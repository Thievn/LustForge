import { requireSessionUser } from "./requireSessionUser.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function json(obj: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function gate(req: Request): Promise<
  | { user: { id: string; email?: string | null } }
  | { response: Response }
> {
  if (req.method === "OPTIONS") return { response: new Response("ok", { headers: corsHeaders }) };
  if (req.method !== "POST" && req.method !== "GET") return { response: json({ error: "Method not allowed" }, 405) };
  return await requireSessionUser(req);
}
