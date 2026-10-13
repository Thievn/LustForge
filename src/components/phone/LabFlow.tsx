import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { ageIsAdult, minorReason } from "@/lib/phone/adultGuard";
import { cn } from "@/lib/utils";

const STYLES = [
  { id: "photoreal", label: "Photoreal" },
  { id: "semi", label: "Semi-real" },
  { id: "anime", label: "Anime" },
  { id: "goth", label: "Goth" },
  { id: "fantasy", label: "Fantasy" },
  { id: "cinematic", label: "Cinematic" },
] as const;

const TRAITS = ["Teasing", "Tender", "Bold", "Shy", "Witty", "Devoted", "Playful", "Intense", "Calm", "Jealous", "Sweet", "Direct"];

type Mode = "menu" | "profile" | "edit" | "create";

export default function LabFlow() {
  const preview = usePhonePreview();
  const navigate = useNavigate();
  const { companions, limits, user } = usePhoneRoster(preview);
  const [mode, setMode] = useState<Mode>("menu");
  const [step, setStep] = useState(0);
  const [style, setStyle] = useState<string>(STYLES[0].id);
  const [look, setLook] = useState("long dark hair, warm eyes");
  const [age, setAge] = useState(24);
  const [traits, setTraits] = useState<string[]>(["Teasing", "Tender"]);
  const [seed, setSeed] = useState(1001);
  const [name, setName] = useState("");
  const [backstory, setBackstory] = useState("");
  const [displayName, setDisplayName] = useState(limits.displayName);
  const [editId, setEditId] = useState(companions[0]?.id ?? "");
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const q = preview ? "?preview=1" : "";
  const ownedCount = companions.filter((item) => item.id.startsWith("cc-") || item.id.startsWith("preview-")).length;
  const slotBlocked = !limits.catalogOwner && ownedCount >= limits.slots;

  const descriptor = useMemo(
    () => `${name || "companion"}, ${age} year old woman, ${look}, style ${style}`.slice(0, 500),
    [name, age, look, style],
  );

  async function createCompanion() {
    const blocked = minorReason(`${name} ${look} ${backstory}`) || (!ageIsAdult(age) ? "Age must be 21 or older." : null);
    if (blocked) {
      setNotice(blocked);
      return;
    }
    if (!name.trim()) {
      setNotice("She needs a name.");
      return;
    }
    if (preview) {
      setNotice("Preview only — sign in to keep her on your home screen.");
      return;
    }
    if (!user) return;
    if (slotBlocked) {
      setNotice("This account has one companion slot. A pass adds more.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("custom_characters").insert({
      user_id: user.id,
      name: name.trim(),
      personality: traits.join(", "),
      appearance: look,
      backstory,
      role: "Companion",
      tagline: traits[0] ?? "",
      gender: "Woman",
      descriptor,
      base_seed: seed,
      style_id: style,
      engine: "zimage",
      system_prompt: `You are ${name.trim()}, a fictional consenting adult age ${age}. ${traits.join(", ")}. ${backstory}`,
    } as never);
    setBusy(false);
    if (error) {
      const retry = await supabase.from("custom_characters").insert({
        user_id: user.id,
        name: name.trim(),
        personality: traits.join(", "),
        appearance: look,
        backstory,
        role: "Companion",
        tagline: traits[0] ?? "",
        gender: "Woman",
        system_prompt: `You are ${name.trim()}, a fictional consenting adult age ${age}.`,
      });
      if (retry.error) {
        setNotice(retry.error.message);
        return;
      }
    }
    navigate("/dashboard");
  }

  async function saveProfile() {
    if (preview || !user) {
      setNotice(preview ? "Preview only." : "Sign in first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    setBusy(false);
    setNotice(error ? error.message : "Profile saved.");
  }

  async function saveCompanion() {
    const target = companions.find((item) => item.id === editId);
    if (!target) return;
    const blocked = minorReason(`${look} ${backstory}`);
    if (blocked) {
      setNotice(blocked);
      return;
    }
    if (preview) {
      setNotice("Preview only.");
      return;
    }
    if (!user) return;
    setBusy(true);
    if (target.id.startsWith("cc-")) {
      const rawId = target.id.slice(3);
      const { error } = await supabase
        .from("custom_characters")
        .update({ appearance: look, backstory, personality: traits.join(", ") })
        .eq("id", rawId)
        .eq("user_id", user.id);
      setNotice(error ? error.message : "Companion updated.");
    } else if (limits.catalogOwner) {
      const client = supabase as unknown as {
        from: (table: string) => {
          update: (value: Record<string, unknown>) => {
            eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
          };
        };
      };
      const { error } = await client.from("companions").update({ appearance: look, backstory }).eq("id", target.id);
      setNotice(error ? error.message : "Catalog companion updated.");
    } else {
      setNotice("Shared catalog cards stay as they are. Forge your own to edit freely.");
    }
    setBusy(false);
  }

  return (
    <PhoneStage layout="app">
      <header className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={mode === "menu" ? `/dashboard${q}` : "#"} onClick={() => mode !== "menu" && setMode("menu")} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">LustForge Lab</p>
          <h1 className="font-gothic text-2xl text-foreground">
            {mode === "menu" ? "Forge" : mode === "profile" ? "Your profile" : mode === "edit" ? "Edit companion" : "New companion"}
          </h1>
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-[max(6rem,env(safe-area-inset-bottom))]">
        {mode === "menu" ? (
          <div className="space-y-3">
            {[
              ["profile", "Edit my profile", "Name on the home screen"],
              ["edit", "Edit a companion", "Look, story, and voice"],
              ["create", "Create new", slotBlocked ? "Slot is full" : "Five short steps"],
            ].map(([id, title, body]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setNotice(null);
                  setMode(id as Mode);
                  setStep(0);
                }}
                className="block w-full rounded-[1.4rem] border border-border bg-card/90 p-4 text-left transition hover:border-primary/40"
              >
                <p className="font-gothic text-xl text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </button>
            ))}
          </div>
        ) : null}

        {mode === "profile" ? (
          <label className="block space-y-2">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Display name</span>
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-foreground" />
            <button type="button" disabled={busy} onClick={() => void saveProfile()} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
              Save
            </button>
          </label>
        ) : null}

        {mode === "edit" ? (
          <div className="space-y-3">
            <select value={editId} onChange={(event) => setEditId(event.target.value)} className="w-full rounded-2xl border border-border bg-card px-3 py-3 text-foreground">
              {companions.map((companion) => (
                <option key={companion.id} value={companion.id}>
                  {companion.name}
                </option>
              ))}
            </select>
            <textarea value={look} onChange={(event) => setLook(event.target.value)} className="min-h-24 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground" />
            <textarea value={backstory} onChange={(event) => setBackstory(event.target.value)} placeholder="Backstory" className="min-h-24 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm text-foreground" />
            <button type="button" disabled={busy} onClick={() => void saveCompanion()} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
              Save companion
            </button>
          </div>
        ) : null}

        {mode === "create" ? (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step {step + 1} of 5</p>
            {step === 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setStyle(option.id)}
                    className={cn(
                      "rounded-2xl border px-3 py-4 text-sm",
                      style === option.id ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
            {step === 1 ? (
              <div className="space-y-3">
                <textarea value={look} onChange={(event) => setLook(event.target.value)} className="min-h-28 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm" />
                <label className="block text-sm text-muted-foreground">
                  Age (21+)
                  <input
                    type="number"
                    min={21}
                    max={99}
                    value={age}
                    onChange={(event) => setAge(Number(event.target.value))}
                    className="mt-1 w-full rounded-2xl border border-border bg-card px-3 py-3 text-foreground"
                  />
                </label>
              </div>
            ) : null}
            {step === 2 ? (
              <div className="flex flex-wrap gap-2">
                {TRAITS.map((trait) => {
                  const on = traits.includes(trait);
                  return (
                    <button
                      key={trait}
                      type="button"
                      onClick={() =>
                        setTraits((current) => {
                          if (current.includes(trait)) return current.filter((item) => item !== trait);
                          if (current.length >= 3) return current;
                          return [...current, trait];
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm",
                        on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
                      )}
                    >
                      {trait}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {step === 3 ? (
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((offset) => (
                  <button
                    key={offset}
                    type="button"
                    onClick={() => setSeed(1000 + offset * 17)}
                    className={cn(
                      "flex h-36 items-end rounded-2xl border p-3 text-left text-xs text-white",
                      seed === 1000 + offset * 17 ? "border-primary" : "border-transparent",
                    )}
                    style={{ background: `linear-gradient(160deg, hsl(${280 + offset * 18} 45% 28%), hsl(338 70% 42%))` }}
                  >
                    Portrait {offset + 1}
                    <span className="ml-auto">seed {1000 + offset * 17}</span>
                  </button>
                ))}
              </div>
            ) : null}
            {step === 4 ? (
              <div className="space-y-3">
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="w-full rounded-2xl border border-border bg-card px-3 py-3" />
                <textarea value={backstory} onChange={(event) => setBackstory(event.target.value)} placeholder="How you met" className="min-h-24 w-full rounded-2xl border border-border bg-card px-3 py-3 text-sm" />
                <p className="text-xs text-muted-foreground">{descriptor}</p>
              </div>
            ) : null}
            <div className="flex gap-2">
              {step > 0 ? (
                <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-xl border border-border px-4 py-3 text-sm">
                  Back
                </button>
              ) : null}
              {step < 4 ? (
                <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  Continue
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => void createCompanion()} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                  {busy ? "Forging…" : "Add to home screen"}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {notice ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-primary">{notice}</motion.p> : null}
      </div>
    </PhoneStage>
  );
}
