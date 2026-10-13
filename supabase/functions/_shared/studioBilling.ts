import { isLustforgeAdminUser } from "./requireSessionUser.ts";

type Svc = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    update: (value: Record<string, unknown>) => {
      eq: (col: string, val: string) => {
        gte: (col: string, val: number) => {
          select: (cols: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
        };
        select: (cols: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      };
    };
  };
};

export type ChargeMode = "admin" | "credits" | "free";

export async function chargeStudio(
  svc: Svc,
  user: { id: string; email?: string | null },
  count: number,
) {
  return chargeExact(svc, user, count, 4);
}

/** Credit charge with an explicit cap. Studio edits stay at 4; the vault can go higher. */
export async function chargeExact(
  svc: Svc,
  user: { id: string; email?: string | null },
  count: number,
  cap = 4,
): Promise<
  | { ok: true; mode: ChargeMode; credits: number; freeLeft: number }
  | { ok: false; status: number; error: string; code: string }
> {
  const n = Math.max(1, Math.min(cap, Math.floor(count)));
  const admin = await isLustforgeAdminUser(user);
  const { data: profile, error } = await svc
    .from("profiles")
    .select("plan, credits, studio_free_left, is_catalog_owner")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error?.message && /studio_free_left|column/i.test(error.message)) {
    return {
      ok: false,
      status: 503,
      code: "MIGRATION_REQUIRED",
      error: "Studio storage is not migrated yet. Apply supabase/migrations/20261013180000_studio.sql.",
    };
  }
  const credits = Number(profile?.credits ?? 0);
  const freeLeft = Number(profile?.studio_free_left ?? 0);
  const plan = String(profile?.plan ?? "free");
  const owner = Boolean(profile?.is_catalog_owner);
  if (admin || owner) return { ok: true, mode: "admin", credits, freeLeft };

  if (credits >= n) {
    const spent = await svc.from("profiles").update({ credits: credits - n }).eq("user_id", user.id).gte("credits", n).select("credits");
    const next = spent.data?.[0];
    if (!next) return needCredits(n, credits, plan === "free" ? freeLeft : 0);
    return { ok: true, mode: "credits", credits: Number(next.credits ?? credits - n), freeLeft };
  }

  if (plan === "free" && freeLeft >= n) {
    const spent = await svc
      .from("profiles")
      .update({ studio_free_left: freeLeft - n })
      .eq("user_id", user.id)
      .gte("studio_free_left", n)
      .select("studio_free_left");
    const next = spent.data?.[0];
    if (!next) return needCredits(n, credits, freeLeft);
    return { ok: true, mode: "free", credits, freeLeft: Number(next.studio_free_left ?? freeLeft - n) };
  }

  return needCredits(n, credits, plan === "free" ? freeLeft : 0);
}

function needCredits(n: number, credits: number, freeLeft: number) {
  const tries = freeLeft > 0 ? ` You have ${freeLeft} free ${freeLeft === 1 ? "try" : "tries"} left.` : "";
  return {
    ok: false as const,
    status: 402,
    code: "NEED_CREDITS",
    error: `This takes ${n} ${n === 1 ? "credit" : "credits"}. You have ${credits}.${tries} Upgrade a plan or add credits to keep going.`,
  };
}

export async function refundOne(svc: Svc, userId: string, mode: string) {
  await refundCredits(svc, userId, mode, 1);
}

export async function refundCredits(svc: Svc, userId: string, mode: string, count: number) {
  const n = Math.max(1, Math.floor(count));
  if (mode !== "credits" && mode !== "free") return;
  const { data: profile } = await svc.from("profiles").select("credits, studio_free_left").eq("user_id", userId).maybeSingle();
  if (!profile) return;
  if (mode === "credits") {
    const credits = Number(profile.credits ?? 0) + n;
    await svc.from("profiles").update({ credits }).eq("user_id", userId).select("credits");
  } else {
    const studio_free_left = Number(profile.studio_free_left ?? 0) + n;
    await svc.from("profiles").update({ studio_free_left }).eq("user_id", userId).select("studio_free_left");
  }
}
