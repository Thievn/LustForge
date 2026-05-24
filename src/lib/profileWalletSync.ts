import type { QueryClient } from "@tanstack/react-query";
import {
  invalidateProfileWallet,
  syncProfileWalletBalance,
} from "@/hooks/useProfileWallet";

/** After any RPC/edge call that returns authoritative new_balance. */
export function applyWalletBalanceFromServer(
  queryClient: QueryClient,
  userId: string | null | undefined,
  newBalance: number | null | undefined,
) {
  if (!userId || typeof newBalance !== "number" || !Number.isFinite(newBalance)) return;
  syncProfileWalletBalance(queryClient, userId, newBalance);
}

export function refreshProfileWallet(queryClient: QueryClient, userId: string | null | undefined) {
  if (!userId) return Promise.resolve();
  return invalidateProfileWallet(queryClient, userId);
}
