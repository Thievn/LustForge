#!/usr/bin/env node
/**
 * Asks the archive-external-images edge function to copy temporary image URLs
 * into Supabase Storage. Does not run unless you pass --apply.
 *
 * Refuses the production project ref unless you also pass --allow-production.
 * Never prints secrets. Load SUPABASE_URL and ARCHIVE_ACCESS_TOKEN in your shell.
 *
 *   node scripts/archive-external-images.mjs
 *   node scripts/archive-external-images.mjs --apply --allow-production
 */

const PRODUCTION_REF = "tyaplrrlirlbqrfjqryo";
const args = new Set(process.argv.slice(2));

if (args.has("--help") || args.size === 0) {
  console.log(`Usage:
  node scripts/archive-external-images.mjs --dry-run
  node scripts/archive-external-images.mjs --apply --allow-production

Environment:
  SUPABASE_URL
  ARCHIVE_ACCESS_TOKEN   (signed-in catalog owner access token; not the service role)

The script exits before any request unless --dry-run or --apply is present.
Production (${PRODUCTION_REF}) is refused without --allow-production.
`);
  process.exit(0);
}

const apply = args.has("--apply");
const dryRun = args.has("--dry-run") || !apply;
const url = (process.env.SUPABASE_URL || "").trim().replace(/\/$/, "");
const token = (process.env.ARCHIVE_ACCESS_TOKEN || "").trim();

if (!url || !token) {
  console.error("Set SUPABASE_URL and ARCHIVE_ACCESS_TOKEN. Nothing was called.");
  process.exit(1);
}

if (url.includes(PRODUCTION_REF) && !args.has("--allow-production")) {
  console.error(`Refusing production project ${PRODUCTION_REF}. Pass --allow-production after backup and review.`);
  process.exit(2);
}

const endpoint = `${url}/functions/v1/archive-external-images`;
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ apply: apply && !dryRun, limit: 20 }),
});

const text = await response.text();
console.log(`HTTP ${response.status}`);
console.log(text.slice(0, 4000));
process.exit(response.ok ? 0 : 1);
