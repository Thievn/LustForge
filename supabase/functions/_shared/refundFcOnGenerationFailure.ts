import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { recordFcTransaction } from "./recordFcTransaction.ts";

export type FcRefundTransactionType =
  | "image_refund"
  | "profile_loop_refund"
  | "video_refund"
  | "nexus_refund";

export async function refundFcOnGenerationFailure(args: {
  svc: SupabaseClient;
  userId: string;
  amount: number;
  reason: string;
  transactionType: FcRefundTransactionType;
  metadata?: Record<string, unknown>;
}): Promise<{ refunded: number }> {
  const amount = Math.max(0, Math.floor(Number(args.amount ?? 0)));
  if (amount <= 0) return { refunded: 0 };

  try {
    const { data: row } = await args.svc
      .from("profiles")
      .select("tokens_balance")
      .eq("user_id", args.userId)
      .maybeSingle();
    const bal = row?.tokens_balance ?? 0;
    const nxt = bal + amount;
    await args.svc.from("profiles").update({ tokens_balance: nxt }).eq("user_id", args.userId);
    await recordFcTransaction(args.svc, {
      userId: args.userId,
      creditsChange: amount,
      balanceAfter: nxt,
      transactionType: args.transactionType,
      description: `Refund: ${args.reason}`,
      metadata: { fc: amount, ...(args.metadata ?? {}) },
    });
    return { refunded: amount };
  } catch (e) {
    console.error("refundFcOnGenerationFailure", e);
    return { refunded: 0 };
  }
}

/** User-facing message when Grok blocks content moderation. */
export function grokModerationUserMessage(): string {
  return "Grok blocked this for content safety — your FC were refunded. Try softer motion notes or a more covered gallery still.";
}

export function isGrokModerationMessage(msg: string): boolean {
  return /content moderation|content safety|moderation rejected/i.test(msg);
}
