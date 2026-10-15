import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SLOT_OF, TREASURES, VAULT_CATEGORIES, type VaultCategory, type VaultRarity } from "@/lib/vault/treasures";

type Item = {
  id: string;
  name: string;
  kind: string;
  slot?: string | null;
  rarity: VaultRarity;
  weight: number;
  neutral: string;
  blurb: string;
  active: boolean;
  pose_id: string | null;
};

const RARITIES: VaultRarity[] = ["silk", "satin", "velvet", "forbidden", "obsession"];

export default function AdminTreasures() {
  const [items, setItems] = useState<Item[]>([]);
  const [cost, setCost] = useState(5);
  const [bundleCost, setBundleCost] = useState(20);
  const [bundleSize, setBundleSize] = useState(5);
  const [notice, setNotice] = useState<string | null>(null);
  const [draft, setDraft] = useState({ id: "", name: "", kind: "lingerie" as VaultCategory, rarity: "silk" as VaultRarity, weight: 60, neutral: "", blurb: "" });

  async function load() {
    const client = supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          order: (col: string) => Promise<{ data: Item[] | null; error: { message: string } | null }>;
          eq: (col: string, val: number) => { maybeSingle: () => Promise<{ data: { credit_cost?: number } | null }> };
        };
        upsert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
        update: (value: Record<string, unknown>) => { eq: (col: string, val: number) => Promise<{ error: { message: string } | null }> };
      };
    };
    const rows = await client.from("collectible_items").select("*").order("name");
    if (rows.error) {
      setItems(TREASURES.map((item) => ({ ...item, pose_id: item.poseId, active: true, weight: item.weight })));
      setNotice("The vault tables are not on this database yet. Showing the seed so you can see the pool.");
      return;
    }
    setItems(rows.data ?? []);
    const settings = await client.from("velvet_vault_settings").select("credit_cost, bundle_cost, bundle_size").eq("id", 1).maybeSingle();
    const row = settings.data as { credit_cost?: number; bundle_cost?: number; bundle_size?: number } | null;
    if (row?.credit_cost) setCost(Number(row.credit_cost));
    if (row?.bundle_cost) setBundleCost(Number(row.bundle_cost));
    if (row?.bundle_size) setBundleSize(Number(row.bundle_size));
  }

  useEffect(() => { void load(); }, []);

  async function save(item: Item) {
    const { error } = await (supabase as unknown as { from: (t: string) => { upsert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> } })
      .from("collectible_items")
      .upsert({ ...item, updated_at: new Date().toISOString() });
    setNotice(error ? error.message : `Saved ${item.name}.`);
  }

  async function saveCost() {
    const { error } = await (supabase as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: number) => Promise<{ error: { message: string } | null }> } } })
      .from("velvet_vault_settings")
      .update({
        credit_cost: Math.max(1, Math.min(50, cost)),
        bundle_cost: Math.max(1, Math.min(200, bundleCost)),
        bundle_size: Math.max(2, Math.min(10, bundleSize)),
      })
      .eq("id", 1);
    setNotice(error ? error.message : `An unveil is ${cost} credits.`);
  }

  async function add() {
    if (!draft.id || !draft.neutral) {
      setNotice("An id and a style-neutral description are required.");
      return;
    }
    await save({ ...draft, slot: SLOT_OF[draft.kind], pose_id: null, active: true });
    setItems((current) => [...current, { ...draft, pose_id: null, active: true }]);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 pb-28 lg:px-8">
      <Link to="/admin" className="text-sm text-primary">Admin</Link>
      <h1 className="mt-2 font-gothic text-4xl">Treasures</h1>
      <p className="mt-2 text-sm text-muted-foreground">Odds follow the weights of what a person does not own yet. Keep the description style-neutral. Her art style is applied when the picture is made.</p>
      {notice ? <p className="mt-3 text-sm" role="status">{notice}</p> : null}
      <div className="mt-4 flex items-end gap-3">
        <label className="text-xs text-muted-foreground">
          Credits per unveil
          <input type="number" min={1} max={50} value={cost} onChange={(event) => setCost(Number(event.target.value))} className="mt-1 block h-11 w-28 rounded-xl border border-border bg-card px-3 text-sm text-foreground" />
        </label>
        <label className="text-xs text-muted-foreground">
          Bundle size
          <input type="number" min={2} max={10} value={bundleSize} onChange={(event) => setBundleSize(Number(event.target.value))} className="mt-1 block h-11 w-28 rounded-xl border border-border bg-card px-3 text-sm text-foreground" />
        </label>
        <label className="text-xs text-muted-foreground">
          Bundle price
          <input type="number" min={1} max={200} value={bundleCost} onChange={(event) => setBundleCost(Number(event.target.value))} className="mt-1 block h-11 w-28 rounded-xl border border-border bg-card px-3 text-sm text-foreground" />
        </label>
        <button type="button" onClick={() => void saveCost()} className="h-11 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Save price</button>
      </div>
      <div className="mt-6 grid gap-2 rounded-2xl border border-white/10 p-4 sm:grid-cols-2">
        <input value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="id" className="h-11 rounded-xl border border-border bg-card px-3 text-sm" />
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Name" className="h-11 rounded-xl border border-border bg-card px-3 text-sm" />
        <input value={draft.neutral} onChange={(event) => setDraft({ ...draft, neutral: event.target.value })} placeholder="Style-neutral garment or scene" className="h-11 rounded-xl border border-border bg-card px-3 text-sm sm:col-span-2" />
        <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as VaultCategory })} className="h-11 rounded-xl border border-border bg-card px-3 text-sm">
          {VAULT_CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}
        </select>
        <select value={draft.rarity} onChange={(event) => setDraft({ ...draft, rarity: event.target.value as VaultRarity })} className="h-11 rounded-xl border border-border bg-card px-3 text-sm">
          {RARITIES.map((rarity) => <option key={rarity}>{rarity}</option>)}
        </select>
        <button type="button" onClick={() => void add()} className="h-11 rounded-2xl border border-primary text-sm text-primary">Add drop</button>
      </div>
      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="grid gap-2 rounded-2xl border border-white/10 p-3 md:grid-cols-[1fr_8rem_6rem_auto]">
            <div>
              <input value={item.name} onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, name: event.target.value } : row))} className="h-10 w-full rounded-xl border border-border bg-transparent px-2 text-sm" />
              <input value={item.neutral} onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, neutral: event.target.value } : row))} className="mt-1 h-10 w-full rounded-xl border border-border bg-transparent px-2 text-xs" />
            </div>
            <select value={item.rarity} onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, rarity: event.target.value as VaultRarity } : row))} className="h-10 rounded-xl border border-border bg-card px-2 text-sm">
              {RARITIES.map((rarity) => <option key={rarity}>{rarity}</option>)}
            </select>
            <input type="number" value={item.weight} onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? { ...row, weight: Number(event.target.value) } : row))} className="h-10 rounded-xl border border-border bg-transparent px-2 text-sm" />
            <div className="flex gap-2">
              <button type="button" className="h-10 rounded-xl border border-border px-3 text-xs" onClick={() => setItems((current) => current.map((row) => row.id === item.id ? { ...row, active: !row.active } : row))}>{item.active ? "Live" : "Hidden"}</button>
              <button type="button" className="h-10 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground" onClick={() => void save(item)}>Save</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
