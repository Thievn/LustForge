import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Coins, Download, History, LogOut, Save, Shield, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ParticleBackground from "@/components/ParticleBackground";
import { cn } from "@/lib/utils";
import { isPlatformAdmin } from "@/config/auth";
import type { User } from "@supabase/supabase-js";
import { fetchFcPaymentHistory, type FcOrderRow } from "@/lib/nowpaymentsFcClient";
import { useProfileWallet } from "@/hooks/useProfileWallet";
import { ShopSyncableToysButton } from "@/components/ShopSyncableToysButton";
import { isStandalonePwa } from "@/lib/pwaInstall";

type UserTransactionRow = {
  id: string;
  credits_change: number;
  balance_after: number;
  transaction_type: string;
  description: string;
  created_at: string;
};

const NEON = "#D6336C";

export default function Account() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preview = params.get("preview") === "1";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const walletQuery = useProfileWallet(sessionUserId ?? undefined);
  const tokens = preview
    ? 1200
    : walletQuery.isLoading && !walletQuery.data
      ? null
      : (walletQuery.data?.tokens_balance ?? null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [installedApp, setInstalledApp] = useState(false);
  const [accountTab, setAccountTab] = useState<"account" | "history">("account");
  const [txLoading, setTxLoading] = useState(false);
  const [txRows, setTxRows] = useState<UserTransactionRow[]>([]);
  const [purchaseRows, setPurchaseRows] = useState<FcOrderRow[]>([]);
  const [planLabel, setPlanLabel] = useState("Member");

  const load = useCallback(async () => {
    if (preview) {
      setEmail("preview@lustforge.app");
      setUsername("Preview");
      setPlanLabel("inferno");
      setLoading(false);
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth", { replace: true });
      return;
    }
    setSessionUserId(session.user.id);
    setSessionUser(session.user);
    setEmail(session.user.email ?? "");
    const meta = session.user.user_metadata as Record<string, string | undefined> | undefined;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const fromProfile = profile?.display_name?.trim();
    setUsername(fromProfile || meta?.username?.trim() || meta?.full_name?.trim() || "");
    const planRow = await (supabase as unknown as {
      from: (table: string) => {
        select: (cols: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: { plan?: string } | null; error: unknown }>;
          };
        };
      };
    })
      .from("profiles")
      .select("plan")
      .eq("user_id", session.user.id)
      .maybeSingle();
    const plan = !planRow.error ? planRow.data?.plan : null;
    if (plan) setPlanLabel(plan);
    setLoading(false);
  }, [navigate, preview]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setInstalledApp(isStandalonePwa());
  }, []);

  const loadTransactions = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_transactions")
        .select("id,credits_change,balance_after,transaction_type,description,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const purchases = await fetchFcPaymentHistory();
      setTxRows(
        (data as UserTransactionRow[] | null)?.filter(Boolean) ?? [],
      );
      setPurchaseRows(purchases);
    } catch (e) {
      console.error(e);
      setTxRows([]);
      setPurchaseRows([]);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accountTab === "history") void loadTransactions();
  }, [accountTab, loadTransactions]);

  const saveUsername = async () => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      toast.error("Username must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 40) {
      toast.error("Username must be 40 characters or fewer.");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    setSaving(true);
    try {
      const { data: nameOk, error: nameErr } = await supabase.rpc("is_display_name_available", {
        p_name: trimmed,
        p_exclude_user_id: session.user.id,
      });
      if (nameErr) throw nameErr;
      if (nameOk === false) {
        throw new Error("That username is already taken. Choose another — names are unique across the forge.");
      }

      const { error: pErr } = await supabase
        .from("profiles")
        .update({ display_name: trimmed })
        .eq("user_id", session.user.id);
      if (pErr) {
        if (pErr.code === "23505") {
          throw new Error("That username is already taken. Choose another — names are unique across the forge.");
        }
        throw pErr;
      }

      const { error: uErr } = await supabase.auth.updateUser({
        data: { username: trimmed, full_name: trimmed },
      });
      if (uErr) console.warn(uErr);

      setUsername(trimmed);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save username.");
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B1620] flex items-center justify-center font-sans">
        <p className="text-sm text-white/75 tracking-wide">Loading your vault…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B1620] text-white font-sans relative overflow-hidden">
      <ParticleBackground />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#D6336C]/[0.07] via-transparent to-[#0a1620]/80" />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-40 blur-[120px]"
        style={{ background: `radial-gradient(circle, ${NEON}55, transparent 70%)` }}
      />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-[hsl(170_80%_35%)]/15 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-lg px-4 py-10 md:py-14 pb-mobile-nav">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-[#D6336C]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-lg"
              style={{
                background: `linear-gradient(145deg, ${NEON}33, hsl(280 45% 22% / 0.5))`,
                boxShadow: `0 0 32px ${NEON}22`,
              }}
            >
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-gothic text-2xl md:text-3xl tracking-wide text-white">Account</h1>
              <p className="text-xs uppercase tracking-[0.25em] text-white/75 mt-1">Vault & identity</p>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Link
              to="/settings"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/90 transition hover:border-[#D6336C]/40 hover:bg-[#D6336C]/10"
            >
              Preferences
            </Link>
            <div className="flex gap-1 rounded-2xl border border-white/10 bg-black/40 p-1">
              <button
                type="button"
                onClick={() => setAccountTab("account")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  accountTab === "account" ? "bg-white/10 text-white" : "text-white/75 hover:text-white",
                )}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => setAccountTab("history")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  accountTab === "history" ? "bg-white/10 text-white" : "text-white/75 hover:text-white",
                )}
              >
                <History className="h-3.5 w-3.5" />
                Transaction history
              </button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "rounded-3xl border border-white/[0.08] bg-black/50 p-6 md:p-8 backdrop-blur-2xl shadow-2xl",
            "shadow-[0_0_80px_rgba(214,51,108,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]",
          )}
        >
          {accountTab === "account" ? (
            <>
          <div className="mb-8 flex items-start justify-between gap-4 rounded-2xl border border-[#D6336C]/20 bg-gradient-to-r from-[#D6336C]/[0.08] to-[hsl(280_50%_30%)]/20 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D6336C]/20 text-[#D6336C]">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  Forge Coin balance
                </p>
                <span className="mt-1 inline-flex rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-white">
                  {planLabel}
                </span>
                <p className="font-gothic text-2xl text-white tabular-nums">
                  {tokens ?? "—"} <span className="text-sm font-sans text-white/75">FC</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              Hardware & sync
            </p>
            <ShopSyncableToysButton variant="promo" />
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
                <UserRound className="h-3.5 w-3.5 text-[#D6336C]" />
                Email
              </label>
              <div className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white/75">{email || "—"}</div>
              <p className="mt-2 text-xs text-white/75">Email is tied to your sign-in and cannot be changed here.</p>
              {sessionUser && isPlatformAdmin(sessionUser, { profileDisplayName: username }) && (
                <p className="mt-3 flex items-center gap-2 rounded-xl border border-[#D6336C]/25 bg-[#D6336C]/[0.06] px-3 py-2 text-xs text-white/75">
                  <Shield className="h-3.5 w-3.5 shrink-0 text-[#D6336C]" />
                  <span>
                    <span className="text-white font-medium">Forge operator</span> — admin matches your allowed
                    email (Gmail ignores dots), optional user id in env, and the reserved handle{" "}
                    <span className="text-white">LustForge</span> only when paired with that same account.
                  </span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="account-username"
                className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75"
              >
                <UserRound className="h-3.5 w-3.5 text-[hsl(170_100%_42%)]" />
                Display username
              </label>
              <input
                id="account-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="How you appear in the forge"
                className={cn(
                  "w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm text-white placeholder:text-white/50",
                  "focus:outline-none focus:border-[#D6336C]/50 focus:ring-2 focus:ring-[#D6336C]/20 transition-shadow",
                )}
                maxLength={40}
                autoComplete="nickname"
              />
              <p className="mt-2 text-xs text-white/75">
                One-of-a-kind across the forge (case-insensitive): if you change or clear it, the old handle can be claimed
                again. Shown in your dashboard greeting.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void saveUsername()}
              disabled={saving}
              className={cn(
                "group relative w-full overflow-hidden rounded-2xl py-3.5 text-sm font-semibold text-white transition-transform",
                "disabled:opacity-50 disabled:pointer-events-none",
                "hover:scale-[1.01] active:scale-[0.99]",
              )}
              style={{
                background: `linear-gradient(135deg, ${NEON}, hsl(280 45% 38%), hsl(170 70% 32%))`,
                boxShadow: `0 0 40px ${NEON}33, inset 0 1px 0 rgba(255,255,255,0.15)`,
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save username"}
              </span>
            </button>

            {!installedApp ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-[#D4AF37]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Install app</p>
                </div>
                <p className="text-xs text-white/75 leading-relaxed">
                  Keep LustForge on your home screen, so she is one tap away.
                </p>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new Event("lustforge-request-install-hint"))}
                  className="w-full rounded-xl border border-[#D6336C]/35 bg-[#D6336C]/10 py-2.5 text-xs font-semibold text-[#D6336C] hover:bg-[#D6336C]/15 transition-colors"
                >
                  Install app
                </button>
              </div>
            ) : null}

            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => void signOut()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/40 py-3.5 text-sm font-medium text-white/75 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Forge Coin ledger</p>
                <p className="text-xs text-white/75 mt-1">
                  Spends and credits in Forge Coins (FC). Most recent first.
                </p>
              </div>
              {purchaseRows.length > 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">Payments</p>
                  <ul className="space-y-1.5">
                    {purchaseRows.slice(0, 6).map((p) => (
                      <li key={p.id} className="text-xs flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
                        <span className="text-white/90">${p.usd_amount} → {p.fc_amount} FC</span>
                        <span className={cn(
                          "uppercase text-[10px] tracking-wider rounded-full border px-2 py-0.5",
                          p.payment_status === "completed" && "text-emerald-300 border-emerald-400/35 bg-emerald-500/10",
                          p.payment_status === "pending" && "text-amber-200 border-amber-300/35 bg-amber-500/10",
                          (p.payment_status === "failed" || p.payment_status === "expired" || p.payment_status === "refunded") &&
                            "text-rose-300 border-rose-300/35 bg-rose-500/10",
                        )}>
                          {p.payment_status}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/buy-credits" className="inline-flex text-xs text-[#D6336C] hover:underline">
                    Open Buy Credits →
                  </Link>
                </div>
              ) : null}
              {txLoading ? (
                <p className="text-sm text-white/75">Loading…</p>
              ) : txRows.length === 0 ? (
                <p className="text-sm text-white/75">No transactions yet.</p>
              ) : (
                <ul className="max-h-[min(60vh,32rem)] overflow-y-auto space-y-2 pr-1">
                  {txRows.map((r) => {
                    const isSpend = r.credits_change < 0;
                    const amount = Math.abs(r.credits_change);
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border border-white/[0.07] bg-black/30 px-3 py-2.5 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">
                              {r.description || r.transaction_type}
                            </p>
                            <p className="text-[10px] text-white/75 mt-0.5">
                              {r.transaction_type} · {new Date(r.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 text-xs font-semibold tabular-nums",
                              isSpend ? "text-rose-300" : "text-emerald-300",
                            )}
                          >
                            {isSpend ? "−" : "+"}
                            {amount} FC
                          </span>
                        </div>
                        <p className="text-[10px] text-white/75 mt-1">Balance after: {r.balance_after} FC</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
