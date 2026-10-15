#!/usr/bin/env node
/**
 * Fill voice_teaser and voice_story for every companion that is missing them.
 *
 * Uses the same rules as the grok-chat `voice_copy` intent: first person, in the
 * existing voice, and no facts that are not already in bio / backstory / personality.
 *
 * Requires the migration `20261015183000_voice_copy_and_private_photos.sql` first.
 *
 *   node scripts/backfill-companion-voice.mjs
 *   node scripts/backfill-companion-voice.mjs --dry-run
 *   node scripts/backfill-companion-voice.mjs --limit 5
 *
 * Reads SUPABASE url + service role and XAI_API_KEY / GROK_API_KEY from the environment
 * or from .env in the repo root. Nothing is printed except counts and ids.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv() {
  try {
    const text = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const i = trimmed.indexOf("=");
      const k = trimmed.slice(0, i).trim();
      let v = trimmed.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* optional */
  }
}

loadEnv();

const dry = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit"));
const limit = limitArg ? Number(process.argv[process.argv.indexOf(limitArg) + 1] || limitArg.split("=")[1]) : Infinity;

const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const xai = process.env.XAI_API_KEY || process.env.GROK_API_KEY || "";

if (!url || !key) {
  console.error("Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!xai) {
  console.error("Missing XAI_API_KEY or GROK_API_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function rest(path, options = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path} ${text.slice(0, 240)}`);
  return text ? JSON.parse(text) : null;
}

function promptFor(row) {
  return `You write profile copy for a fictional consenting adult companion (21+).
Use ONLY facts present in the fields below. Do not invent places, relatives, events, jobs, or traits that are not written there.
If something is missing, leave it out. Do not mention apps, credits, or technology.
Return JSON only: {"voice_teaser":"...","voice_story":"..."}
voice_teaser: one or two sentences in the first person, about 160 characters, human, in their voice. Not a product blurb.
voice_story: 3 or 4 sentences in the first person, in their voice, drawn from the backstory and bio.

Name: ${row.name || ""}
Tagline: ${row.tagline || ""}
Role: ${row.role || ""}
Personality: ${(row.personality || "").slice(0, 2000)}
Bio: ${(row.bio || "").slice(0, 4000)}
Backstory: ${(row.backstory || "").slice(0, 6000)}
Appearance: ${(row.appearance || "").slice(0, 1500)}`;
}

async function grok(row) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${xai}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GROK_CHAT_MODEL || "grok-4.3",
      temperature: 0.7,
      max_tokens: 500,
      messages: [
        { role: "system", content: "You return only JSON. You never invent biography." },
        { role: "user", content: promptFor(row) },
      ],
    }),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`xAI ${res.status} ${raw.slice(0, 180)}`);
  const json = JSON.parse(raw);
  const content = json.choices?.[0]?.message?.content ?? "";
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  const parsed = JSON.parse(content.slice(start, end + 1));
  const teaser = String(parsed.voice_teaser || "").replace(/\s+/g, " ").trim();
  const story = String(parsed.voice_story || "").replace(/\s+/g, " ").trim();
  if (teaser.length < 40 || story.length < 80) throw new Error("short copy");
  return {
    voice_teaser: teaser.length > 170 ? `${teaser.slice(0, 166).replace(/\s+\S*$/, "")}…` : teaser,
    voice_story: story,
  };
}

async function rowsFrom(table) {
  const data = await rest(
    `${table}?select=id,name,tagline,role,personality,bio,backstory,appearance,voice_teaser,voice_story&limit=1000`,
  );
  return (data || []).map((row) => ({ ...row, table }));
}

async function main() {
  let rows = [];
  try {
    rows = [...(await rowsFrom("custom_characters")), ...(await rowsFrom("companions"))];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/voice_teaser|42703|column/i.test(msg)) {
      console.error("Columns are missing. Apply supabase/migrations/20261015183000_voice_copy_and_private_photos.sql first.");
      process.exit(2);
    }
    throw err;
  }
  const todo = rows.filter((r) => !String(r.voice_teaser || "").trim() || !String(r.voice_story || "").trim());
  console.log(`missing voice copy: ${todo.length}${dry ? " (dry run)" : ""}`);
  let done = 0;
  let failed = 0;
  for (const row of todo) {
    if (done >= limit) break;
    try {
      const copy = await grok(row);
      if (!dry) {
        await rest(`${row.table}?id=eq.${row.id}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(copy),
        });
      }
      done += 1;
      console.log(`${dry ? "would write" : "wrote"} ${row.table} ${row.id} teaser=${copy.voice_teaser.length} story=${copy.voice_story.length}`);
    } catch (err) {
      failed += 1;
      console.error(`failed ${row.table} ${row.id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`finished written=${done} failed=${failed} dry=${dry}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
