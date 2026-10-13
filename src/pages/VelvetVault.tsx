import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dropOdds, PITY_EVERY, tierOdds, type VaultRarity } from "../../supabase/functions/_shared/vaultDraw";
import { RARITY_COLOR } from "@/components/vault/TreasureCard";
import { CATEGORY_REWARDS, TREASURES, VAULT_CATEGORIES, type VaultCategory } from "@/lib/vault/treasures";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { usePhonePreview } from "@/components/phone/PhoneStage";

const VaultReveal = lazy(() => import("@/components/vault/VaultReveal").then((mod) => ({ default: mod.VaultReveal })));

type PoolItem = {
  id: string;
  name: string;
  kind: VaultCategory;
  rarity: VaultRarity;
  blurb: string;
  owned: boolean;
  percent: number;
  neutral: string;
  poseId?: string | null;
  isNew?: boolean;
  slot?: string;
};

const EMPTY_TIERS: Record<VaultRarity, number> = { silk: 53, satin: 27, velvet: 13, forbidden: 5, obsession: 2 };

function localPool(): PoolItem[] {
  const odds = dropOdds(TREASURES);
  return odds.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    rarity: item.rarity,
    blurb: item.blurb,
    owned: false,
    percent: item.percent,
    neutral: item.neutral,
    poseId: item.poseId,
    isNew: item.isNew,
    slot: item.slot,
  }));
}

function CardSkeleton() {
  return <div className="aspect-[4/5] animate-pulse rounded-3xl bg-white/10" />;
}

export default function VelvetVault() {
  const preview = usePhonePreview();
  const { limits } = usePhoneRoster(preview);
  const [items, setItems] = useState<PoolItem[]>(() => (preview ? localPool() : []));
  const [tiers, setTiers] = useState<Record<VaultRarity, number>>(EMPTY_TIERS);
  const [cost, setCost] = useState(5);
  const [bundleCost, setBundleCost] = useState(20);
  const [bundleSize, setBundleSize] = useState(5);
  const [credits, setCredits] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"crack" | "bundle" | null>(null);
  const [filter, setFilter] = useState("All");
  const [rarityFilter, setRarityFilter] = useState<"all" | VaultRarity>("all");
  const [ownFilter, setOwnFilter] = useState<"all" | "owned" | "locked">("all");
  const [freshOnly, setFreshOnly] = useState(false);
  const [pity, setPity] = useState(0);
  const [queue, setQueue] = useState<PoolItem[]>([]);
  const [server, setServer] = useState(preview);
  const [loaded, setLoaded] = useState(preview);

  useEffect(() => {
    void import("@/components/vault/VaultReveal");
    void import("@/components/vault/TreasureCard");
  }, []);

  async function load() {
    if (preview) return;
    const { data, error } = await supabase.functions.invoke("velvet-vault", { body: { action: "quote" } });
    const payload = data as {
      items?: PoolItem[];
      cost?: number;
      bundleCost?: number;
      bundleSize?: number;
      tiers?: Record<VaultRarity, number>;
      error?: string;
      allCollected?: boolean;
      pity?: number;
    } | null;
    if (error || payload?.error || !payload?.items?.length) {
      setItems(localPool());
      setTiers(tierOdds(TREASURES));
      setNotice(payload?.error || "Showing the full collection. Live odds appear once the vault answers.");
      setServer(false);
      setLoaded(true);
      return;
    }
    setItems(payload.items);
    setCost(Number(payload.cost ?? 5));
    setBundleCost(Number(payload.bundleCost ?? 20));
    setBundleSize(Number(payload.bundleSize ?? 5));
    if (payload.tiers) setTiers(payload.tiers);
    if (typeof payload.pity === "number") setPity(payload.pity);
    setServer(true);
    setLoaded(true);
    setNotice(payload.allCollected ? "All collected, more coming soon." : null);
  }

  useEffect(() => {
    void load();
  }, [preview]);

  useEffect(() => {
    if (credits == null) setCredits(limits.credits);
  }, [limits.credits, credits]);

  const owned = items.filter((item) => item.owned).length;
  const remaining = items.length - owned;
  const all = items.length > 0 && owned === items.length;
  const visible = useMemo(
    () => items.filter((item) => {
      if (filter !== "All" && item.kind !== filter) return false;
      if (rarityFilter !== "all" && item.rarity !== rarityFilter) return false;
      if (ownFilter === "owned" && !item.owned) return false;
      if (ownFilter === "locked" && item.owned) return false;
      if (freshOnly && !item.isNew) return false;
      return true;
    }),
    [items, filter, rarityFilter, ownFilter, freshOnly],
  );
  const earned = VAULT_CATEGORIES.filter((category) => {
    const rows = items.filter((item) => item.kind === category.id);
    return rows.length > 0 && rows.every((item) => item.owned);
  });
  const reveal = queue[0] ?? null;
  const shownCredits = limits.catalogOwner ? null : credits;

  async function open(kind: "crack" | "bundle") {
    if (preview) {
      setNotice("Sign in to crack the vault.");
      return;
    }
    if (!server || all || busy) return;
    const price = kind === "bundle" ? bundleCost : cost;
    const count = kind === "bundle" ? bundleSize : 1;
    if (kind === "bundle" && remaining < bundleSize) {
      setNotice("Not enough treasures left for a bundle.");
      return;
    }
    setBusy(kind);
    setNotice(null);
    if (!limits.catalogOwner && credits != null) setCredits(Math.max(0, credits - price));
    const { data, error } = await supabase.functions.invoke("velvet-vault", { body: { action: kind === "bundle" ? "bundle" : "open" } });
    const payload = data as { item?: PoolItem; items?: PoolItem[]; error?: string; credits?: number | null } | null;
    setBusy(null);
    const won = payload?.items?.length ? payload.items : payload?.item ? [payload.item] : [];
    if (error || !won.length) {
      if (!limits.catalogOwner && credits != null) setCredits(credits);
      setNotice(payload?.error || "The vault stayed shut. If you were charged, it has been returned.");
      await load();
      return;
    }
    if (typeof payload?.credits === "number") setCredits(payload.credits);
    setItems((current) => current.map((item) => (won.some((next) => next.id === item.id) ? { ...item, owned: true, percent: 0 } : item)));
    setQueue(won.map((item) => ({ ...item, owned: true })));
    void load();
    if (count > won.length) setNotice("That was everything left.");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-28 lg:px-8 lg:pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-primary">LustForge</p>
          <h1 className="font-gothic text-4xl text-foreground">The Velvet Vault</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {cost} credits. One treasure you do not own yet. A bundle of {bundleSize} is {bundleCost}, if you want the night to move faster.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">{limits.catalogOwner ? "Unlimited" : `${shownCredits ?? limits.credits} credits`}</p>
      </header>

      <section className="rounded-[1.6rem] border border-primary/30 bg-card/80 p-4 shadow-[0_0_40px_hsl(var(--primary)/0.12)]">
        <div className="flex items-center justify-between text-sm">
          <span>{loaded ? `${owned}/${items.length || 150} collected` : "Counting the vault…"}</span>
          <span>{limits.catalogOwner ? "On the house" : `This crack: ${cost} credits`}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${items.length ? (owned / items.length) * 100 : 0}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(EMPTY_TIERS) as VaultRarity[]).map((rarity) => (
            <div key={rarity} className="rounded-2xl border px-3 py-2" style={{ borderColor: RARITY_COLOR[rarity].from }}>
              <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: RARITY_COLOR[rarity].from }}>{RARITY_COLOR[rarity].label}</p>
              <p className="font-gothic text-2xl">{loaded ? `${tiers[rarity].toFixed(tiers[rarity] % 1 ? 1 : 0)}%` : "—"}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Adults 18+ only. Everyone depicted is a fictional adult, 21 or older. Silk starts at 53%. Obsession is 2%. When a tier is gone, what is left takes its share. Velvet or better is guaranteed every {PITY_EVERY} cracks{loaded ? ` (${Math.max(0, PITY_EVERY - pity)} to go)` : ""}.
        </p>
        {notice ? <p className="mt-3 text-sm text-foreground" role="alert">{notice}</p> : null}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={Boolean(busy) || all || (!server && !preview)}
            onClick={() => void open("crack")}
            className="h-12 rounded-2xl bg-primary font-semibold text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/0.35)] disabled:opacity-50"
          >
            {all ? "All collected, more coming soon" : busy === "crack" ? "The lock is turning…" : `Crack the Vault · ${cost}`}
          </button>
          <button
            type="button"
            disabled={Boolean(busy) || all || remaining < bundleSize || (!server && !preview)}
            onClick={() => void open("bundle")}
            className="h-12 rounded-2xl border border-primary/50 font-semibold text-primary disabled:opacity-50"
          >
            {busy === "bundle" ? `${bundleSize} locks, one after another…` : `Bundle of ${bundleSize} · ${bundleCost}`}
          </button>
        </div>
      </section>

      {earned.length ? (
        <p className="text-sm text-primary">{earned.map((category) => `${CATEGORY_REWARDS[category.id].badge}: ${CATEGORY_REWARDS[category.id].title}`).join(" · ")}</p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" onClick={() => setFilter("All")} className={`h-10 shrink-0 rounded-full border px-4 text-sm ${filter === "All" ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>All</button>
        {VAULT_CATEGORIES.map((category) => (
          <button key={category.id} type="button" onClick={() => setFilter(category.id)} className={`h-10 shrink-0 rounded-full border px-4 text-sm ${filter === category.id ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
            {category.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(["all", "silk", "satin", "velvet", "forbidden", "obsession"] as const).map((rarity) => (
          <button key={rarity} type="button" onClick={() => setRarityFilter(rarity)} className={`h-9 rounded-full border px-3 text-xs capitalize ${rarityFilter === rarity ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {rarity === "all" ? "Any rarity" : RARITY_COLOR[rarity].label}
          </button>
        ))}
        {(["all", "owned", "locked"] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => setOwnFilter(mode)} className={`h-9 rounded-full border px-3 text-xs capitalize ${ownFilter === mode ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
            {mode === "all" ? "Owned & locked" : mode}
          </button>
        ))}
        <button type="button" onClick={() => setFreshOnly((on) => !on)} className={`h-9 rounded-full border px-3 text-xs ${freshOnly ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>New!</button>
      </div>

      {!loaded ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
          {Array.from({ length: 10 }, (_, index) => <CardSkeleton key={index} />)}
        </div>
      ) : (
        <TreasureGrid items={visible} />
      )}

      {reveal ? (
        <Suspense fallback={null}>
          <VaultReveal
            name={reveal.name}
            kind={reveal.kind}
            rarity={reveal.rarity}
            blurb={reveal.blurb}
            poseId={reveal.poseId}
            onDone={() => setQueue((current) => current.slice(1))}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function TreasureGrid({ items }: { items: PoolItem[] }) {
  const [Card, setCard] = useState<typeof import("@/components/vault/TreasureCard").TreasureCard | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("@/components/vault/TreasureCard").then((mod) => {
      if (!cancelled) setCard(() => mod.TreasureCard);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!Card) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.slice(0, 10).map((item) => <CardSkeleton key={item.id} />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.id} name={item.name} kind={item.kind} rarity={item.rarity} blurb={item.blurb} owned={item.owned} percent={item.percent} isNew={item.isNew} poseId={item.poseId} />
      ))}
    </div>
  );
}
