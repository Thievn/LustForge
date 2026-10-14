import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { drawWithPity, dropOdds, PITY_EVERY, RARITY_ORDER, tierOdds, type VaultRarity } from "../../supabase/functions/_shared/vaultDraw";
import { TreasureCard } from "@/components/vault/TreasureCard";
import { VaultSheet } from "@/components/vault/VaultSheet";
import { RARITY_TONE, resolveVaultArt } from "@/lib/vault/art";
import { CATEGORY_REWARDS, TREASURES, VAULT_CATEGORIES, type VaultCategory } from "@/lib/vault/treasures";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { usePhonePreview } from "@/components/phone/PhoneStage";
import { cn } from "@/lib/utils";

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
  imageUrl: string;
  thumbUrl: string;
};

const PILL: Record<VaultCategory, string> = {
  lingerie: "Lingerie",
  swim: "Swim",
  night: "Night",
  costume: "Costume",
  accessory: "Extras",
  scene: "Places",
  pose: "Poses",
  hair: "Hair",
  mood: "Mood",
};

const EMPTY_TIERS: Record<VaultRarity, number> = { silk: 53, satin: 27, velvet: 13, forbidden: 5, obsession: 2 };

function formatPct(value: number): string {
  if (!Number.isFinite(value)) return "0%";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function asPool(raw: Record<string, unknown>): PoolItem {
  const id = String(raw.id);
  const art = resolveVaultArt({
    id,
    imageUrl: typeof raw.imageUrl === "string" ? raw.imageUrl : null,
    thumbUrl: typeof raw.thumbUrl === "string" ? raw.thumbUrl : null,
    image_url: typeof raw.image_url === "string" ? raw.image_url : null,
    thumb_url: typeof raw.thumb_url === "string" ? raw.thumb_url : null,
  });
  return {
    id,
    name: String(raw.name ?? ""),
    kind: String(raw.kind ?? "lingerie") as VaultCategory,
    rarity: String(raw.rarity ?? "silk") as VaultRarity,
    blurb: String(raw.blurb ?? ""),
    owned: Boolean(raw.owned),
    percent: Number(raw.percent ?? 0),
    neutral: String(raw.neutral ?? ""),
    poseId: raw.poseId == null ? null : String(raw.poseId),
    isNew: Boolean(raw.isNew),
    slot: raw.slot == null ? undefined : String(raw.slot),
    imageUrl: art.imageUrl,
    thumbUrl: art.thumbUrl,
  };
}

function localPool(sample: boolean): PoolItem[] {
  return dropOdds(TREASURES).map((item, index) => asPool({
    ...item,
    owned: sample && (index % 4 === 0 || (item.rarity === "obsession" && index % 2 === 0)),
    poseId: item.poseId,
    isNew: item.isNew,
  }));
}

export default function VelvetVault() {
  const preview = usePhonePreview();
  const { companions } = usePhoneRoster(preview);
  const [items, setItems] = useState<PoolItem[]>(() => (preview ? localPool(true) : []));
  const [tiers, setTiers] = useState<Record<VaultRarity, number>>(EMPTY_TIERS);
  const [cost, setCost] = useState(5);
  const [bundleCost, setBundleCost] = useState(20);
  const [bundleSize, setBundleSize] = useState(5);
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
  const [oddsOpen, setOddsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    void import("@/components/vault/VaultReveal");
  }, []);

  const load = useCallback(async () => {
    if (preview) return;
    const { data, error } = await supabase.functions.invoke("velvet-vault", { body: { action: "quote" } });
    const payload = data as {
      items?: Array<Record<string, unknown>>;
      cost?: number;
      bundleCost?: number;
      bundleSize?: number;
      tiers?: Record<VaultRarity, number>;
      error?: string;
      allCollected?: boolean;
      pity?: number;
    } | null;
    if (error || payload?.error || !payload?.items?.length) {
      setItems(localPool(false));
      setTiers(tierOdds(TREASURES));
      setNotice(payload?.error || "Showing the full collection. Live odds appear once the vault answers.");
      setServer(false);
      setLoaded(true);
      return;
    }
    setItems(payload.items.map((item) => asPool(item)));
    setCost(Number(payload.cost ?? 5));
    setBundleCost(Number(payload.bundleCost ?? 20));
    setBundleSize(Number(payload.bundleSize ?? 5));
    if (payload.tiers) setTiers(payload.tiers);
    if (typeof payload.pity === "number") setPity(payload.pity);
    setServer(true);
    setLoaded(true);
    setNotice(payload.allCollected ? "All collected, more coming soon." : null);
  }, [preview]);

  useEffect(() => {
    void load();
  }, [load]);

  const owned = items.filter((item) => item.owned).length;
  const total = items.length || 150;
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
  const counts = useMemo(() => {
    const map = {} as Record<VaultRarity, { owned: number; total: number }>;
    for (const rarity of RARITY_ORDER) map[rarity] = { owned: 0, total: 0 };
    for (const item of items) {
      map[item.rarity].total += 1;
      if (item.owned) map[item.rarity].owned += 1;
    }
    return map;
  }, [items]);
  const reveal = queue[0] ?? null;
  const selected = selectedId ? items.find((item) => item.id === selectedId) ?? null : null;
  const progress = items.length ? (owned / items.length) * 100 : 0;
  const pityLeft = Math.max(0, PITY_EVERY - pity);
  const crackLabel = cost <= 0 ? "On the house" : `${cost} credits`;
  const bundleLabel = bundleCost <= 0 ? "On the house" : `${bundleSize} for ${bundleCost}`;

  async function open(kind: "crack" | "bundle") {
    if (preview) {
      const pool = items.filter((item) => !item.owned);
      const count = kind === "bundle" ? bundleSize : 1;
      if (!pool.length || all) return;
      if (kind === "bundle" && pool.length < bundleSize) {
        setNotice("Not enough treasures left for a bundle.");
        return;
      }
      const result = drawWithPity(
        pool.map((item) => ({ ...item, weight: 1 })),
        Array.from({ length: count }, () => Math.random()),
        pity,
      );
      const won = result.drawn
        .map((item) => items.find((row) => row.id === item.id))
        .filter((item): item is PoolItem => Boolean(item));
      setPity(result.pity);
      setTiers(tierOdds(pool.filter((item) => !won.some((next) => next.id === item.id))));
      setItems((current) => current.map((item) => (won.some((next) => next.id === item.id) ? { ...item, owned: true, percent: 0 } : item)));
      setSelectedId(null);
      setQueue(won.map((item) => ({ ...item, owned: true })));
      setNotice(null);
      return;
    }
    if (!server || all || busy) return;
    const count = kind === "bundle" ? bundleSize : 1;
    if (kind === "bundle" && remaining < bundleSize) {
      setNotice("Not enough treasures left for a bundle.");
      return;
    }
    setBusy(kind);
    setNotice(null);
    const { data, error } = await supabase.functions.invoke("velvet-vault", { body: { action: kind === "bundle" ? "bundle" : "open" } });
    const payload = data as { item?: Record<string, unknown>; items?: Array<Record<string, unknown>>; error?: string; credits?: number | null } | null;
    setBusy(null);
    const won = (payload?.items?.length ? payload.items : payload?.item ? [payload.item] : []).map((item) => asPool({ ...item, owned: true }));
    if (error || !won.length) {
      setNotice(payload?.error || "The vault stayed shut. If you were charged, it has been returned.");
      await load();
      return;
    }
    setItems((current) => current.map((item) => (won.some((next) => next.id === item.id) ? { ...item, ...next, owned: true, percent: 0 } : item)));
    setSelectedId(null);
    setQueue(won);
    void load();
    if (count > won.length) setNotice("That was everything left.");
  }

  return (
    <div className="mx-auto flex w-full max-w-[1176px] flex-col gap-3 px-4 pb-24 pt-3 lg:px-6 lg:pb-8 lg:pt-5">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h1 className="font-gothic text-[15px] leading-none tracking-wide text-foreground">Vault</h1>
          <p className="truncate text-[11px] text-muted-foreground">{crackLabel}</p>
          <button
            type="button"
            disabled={Boolean(busy) || all || remaining < bundleSize || (!server && !preview)}
            onClick={() => void open("bundle")}
            className="shrink-0 text-[11px] text-foreground/80 underline-offset-2 hover:text-primary disabled:opacity-40"
          >
            {busy === "bundle" ? "Opening" : bundleLabel}
          </button>
          <span className="min-w-2 flex-1" />
          <p className="shrink-0 text-[11px] tabular-nums text-foreground/80" aria-label={`${owned} of ${total} collected`}>{loaded ? `${owned}/${total}` : "—"}</p>
          <button
            type="button"
            disabled={Boolean(busy) || all || (!server && !preview)}
            onClick={() => void open("crack")}
            className="h-8 shrink-0 rounded-full bg-primary px-3.5 text-xs font-medium text-primary-foreground disabled:opacity-40"
          >
            {all ? "Collected" : busy === "crack" ? "Cracking" : "Crack"}
          </button>
        </div>
        <div className="mt-1.5 h-px overflow-hidden rounded-full bg-white/10" aria-hidden>
          <div className="h-full bg-primary/80" style={{ width: `${progress}%` }} />
        </div>

        <div
          role="button"
          tabIndex={0}
          className="mt-2 w-full cursor-pointer py-1 text-left"
          aria-expanded={oddsOpen}
          onClick={() => setOddsOpen((open) => !open)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setOddsOpen((open) => !open);
            }
          }}
        >
          <span className="sr-only">Drop odds. {oddsOpen ? "Hide" : "Show"} the breakdown.</span>
          <span className="flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-white/5">
            {RARITY_ORDER.map((rarity) => (
              <span
                key={rarity}
                className="h-full min-w-[4px] rounded-full"
                style={{
                  flexGrow: Math.max(tiers[rarity], 0.6),
                  background: rarity === "obsession"
                    ? "linear-gradient(90deg, #f0c2d6, #c4b5fd, #e0c072)"
                    : RARITY_TONE[rarity].border,
                }}
              />
            ))}
          </span>
          <span className="mt-1 flex justify-between text-[9px] tabular-nums">
            {RARITY_ORDER.map((rarity) => (
              <span key={rarity} style={{ color: RARITY_TONE[rarity].border }}>{formatPct(tiers[rarity])}</span>
            ))}
          </span>

        {oddsOpen ? (
          <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
            {RARITY_ORDER.map((rarity) => (
              <div key={rarity} className="flex items-center justify-between gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: RARITY_TONE[rarity].border }} />
                  <span style={{ color: RARITY_TONE[rarity].border }}>{RARITY_TONE[rarity].label}</span>
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatPct(tiers[rarity])}
                  {loaded ? ` · ${counts[rarity].owned}/${counts[rarity].total}` : ""}
                </span>
              </div>
            ))}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Pity · Velvet or better</span>
                <span className="tabular-nums">{pityLeft} left</span>
              </div>
              <div className="mt-1 h-px overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-[#9f1239]" style={{ width: `${Math.min(100, (pity / PITY_EVERY) * 100)}%` }} />
              </div>
            </div>
            <p className="text-[10px] leading-snug text-muted-foreground">
              Fictional adults, 21 or older. When a tier is gone, what is left takes its share.
            </p>
          </div>
        ) : null}
        </div>
        {notice ? <p className="mt-2 text-[11px] text-foreground/80" role="alert">{notice}</p> : null}
      </section>

      {earned.length ? (
        <p className="text-[11px] text-primary/90">{earned.map((category) => CATEGORY_REWARDS[category.id].title).join(" · ")}</p>
      ) : null}

      <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Pill active={filter === "All"} onClick={() => setFilter("All")}>All</Pill>
        {VAULT_CATEGORIES.map((category) => (
          <Pill key={category.id} active={filter === category.id} onClick={() => setFilter(category.id)}>{PILL[category.id]}</Pill>
        ))}
      </div>
      <div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <FilterChip active={rarityFilter === "all"} onClick={() => setRarityFilter("all")}>Any</FilterChip>
        {RARITY_ORDER.map((rarity) => (
          <FilterChip key={rarity} active={rarityFilter === rarity} tone={RARITY_TONE[rarity].border} onClick={() => setRarityFilter(rarity)}>
            {RARITY_TONE[rarity].label}
          </FilterChip>
        ))}
        <span className="mx-0.5 w-px shrink-0 bg-white/10" aria-hidden />
        <FilterChip active={ownFilter === "all" && !freshOnly} onClick={() => { setOwnFilter("all"); setFreshOnly(false); }}>All</FilterChip>
        <FilterChip active={ownFilter === "owned"} onClick={() => { setOwnFilter("owned"); setFreshOnly(false); }}>Owned</FilterChip>
        <FilterChip active={ownFilter === "locked"} onClick={() => { setOwnFilter("locked"); setFreshOnly(false); }}>Locked</FilterChip>
        <FilterChip active={freshOnly} onClick={() => setFreshOnly((on) => !on)}>New</FilterChip>
      </div>

      {!loaded ? (
        <ul className="vault-grid" aria-hidden>
          {Array.from({ length: 9 }, (_, index) => (
            <li key={index}>
              <div className="aspect-[3/4] animate-pulse rounded-[10px] bg-white/10" />
              <div className="mt-1 h-2 w-2/3 rounded bg-white/10" />
            </li>
          ))}
        </ul>
      ) : visible.length ? (
        <ul className="vault-grid">
          {visible.map((item) => (
            <li key={item.id} className="min-w-0">
              <TreasureCard
                name={item.name}
                rarity={item.rarity}
                owned={item.owned}
                thumbUrl={item.thumbUrl}
                kind={item.kind}
                poseId={item.poseId}
                isNew={item.isNew}
                onClick={() => setSelectedId(item.id)}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nothing in this cut.</p>
      )}

      {selected && !reveal ? (
        <VaultSheet
          itemId={selected.id}
          name={selected.name}
          rarity={selected.rarity}
          kind={selected.kind}
          blurb={selected.blurb}
          owned={selected.owned}
          imageUrl={selected.imageUrl}
          poseId={selected.poseId}
          companions={companions.map((her) => ({ id: her.id, name: her.name }))}
          preview={preview}
          onClose={() => setSelectedId(null)}
        />
      ) : null}

      {reveal ? (
        <Suspense fallback={null}>
          <VaultReveal
            key={reveal.id}
            name={reveal.name}
            rarity={reveal.rarity}
            blurb={reveal.blurb}
            imageUrl={reveal.imageUrl}
            kind={reveal.kind}
            poseId={reveal.poseId}
            onDone={() => setQueue((current) => current.slice(1))}
          />
        </Suspense>
      ) : null}
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-6 shrink-0 rounded-full px-2.5 text-[11px]",
        active ? "bg-white/10 text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-6 shrink-0 rounded-full px-2 text-[10px]", active ? "bg-white/[0.06]" : "text-muted-foreground")}
      style={active && tone ? { color: tone } : active ? { color: "inherit" } : undefined}
    >
      {children}
    </button>
  );
}
