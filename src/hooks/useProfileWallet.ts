import { useQuery } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const PROFILE_WALLET_QUERY_KEY = ["profile-wallet"] as const;

export type ProfileWalletData = {
  tokens_balance: number;
  discover_free_common_claimed: boolean;
  chat_daily_quota_date: string | null;
  chat_daily_quota_used: number | null;
};

export function profileWalletQueryKey(userId: string) {
  return [...PROFILE_WALLET_QUERY_KEY, userId] as const;
}

async function fetchProfileWallet(userId: string): Promise<ProfileWalletData> {
  const { data, error } = await supabase
    .from("profiles")
    .select("tokens_balance, discover_free_common_claimed, chat_daily_quota_date, chat_daily_quota_used")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    tokens_balance: typeof data?.tokens_balance === "number" ? data.tokens_balance : 0,
    discover_free_common_claimed: Boolean(data?.discover_free_common_claimed),
    chat_daily_quota_date: data?.chat_daily_quota_date ?? null,
    chat_daily_quota_used:
      typeof data?.chat_daily_quota_used === "number" ? data.chat_daily_quota_used : null,
  };
}

export function useProfileWallet(userId: string | null | undefined) {
  return useQuery({
    queryKey: profileWalletQueryKey(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: () => fetchProfileWallet(userId!),
    staleTime: 30_000,
  });
}

export function syncProfileWalletBalance(
  queryClient: QueryClient,
  userId: string,
  newBalance: number,
) {
  const key = profileWalletQueryKey(userId);
  queryClient.setQueryData<ProfileWalletData>(key, (prev) =>
    prev
      ? { ...prev, tokens_balance: newBalance }
      : {
          tokens_balance: newBalance,
          discover_free_common_claimed: false,
          chat_daily_quota_date: null,
          chat_daily_quota_used: null,
        },
  );
}

export function invalidateProfileWallet(queryClient: QueryClient, userId: string) {
  return queryClient.invalidateQueries({ queryKey: profileWalletQueryKey(userId) });
}
