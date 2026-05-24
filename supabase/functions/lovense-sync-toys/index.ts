import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  capabilitiesForToyType,
  extractToysFromGetToysResponse,
  isLikelyUserUidNotToyId,
} from "../_shared/lovenseToyParse.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const developerToken = Deno.env.get("LOVENSE_DEVELOPER_TOKEN");
    if (!developerToken) {
      return new Response(JSON.stringify({ error: "Device integration not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Remove legacy bad rows where device_uid was stored as the account id.
    await serviceClient
      .from("user_lovense_toys")
      .delete()
      .eq("user_id", user.id)
      .eq("device_uid", user.id);

    const { data: profileRow } = await serviceClient
      .from("profiles")
      .select("device_uid")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileRow?.device_uid === user.id) {
      await serviceClient.from("profiles").update({ device_uid: null }).eq("user_id", user.id);
    }

    const lovenseResponse = await fetch("https://api.lovense.com/api/lan/getToys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: developerToken,
        uid: user.id,
      }),
    });

    const result = await lovenseResponse.json().catch(() => ({}));
    const parsed = extractToysFromGetToysResponse(result);

    if (!parsed.length) {
      const code = typeof result === "object" && result !== null ? (result as Record<string, unknown>).code : null;
      const message =
        typeof result === "object" && result !== null && typeof (result as Record<string, unknown>).message === "string"
          ? String((result as Record<string, unknown>).message)
          : null;
      if (code === 507 || message?.toLowerCase().includes("offline")) {
        return new Response(
          JSON.stringify({
            error:
              "Lovense Remote is offline. Open the Lovense Remote app on your phone, connect your toy, and keep the app running in the background.",
            code: "LOVENSE_OFFLINE",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          error:
            message ||
            "No toys found. Scan the QR code again with Lovense Remote while your toy is connected.",
          code: "NO_TOYS",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let firstUid: string | null = null;
    for (const toy of parsed) {
      if (isLikelyUserUidNotToyId(toy.deviceUid, user.id)) continue;
      if (!firstUid) firstUid = toy.deviceUid;
      const { error: upsertErr } = await serviceClient.from("user_lovense_toys").upsert(
        {
          user_id: user.id,
          device_uid: toy.deviceUid,
          display_name: toy.displayName,
          toy_type: toy.toyType,
          nickname: toy.nickname,
          capabilities: capabilitiesForToyType(toy.toyType),
          battery: toy.battery,
          enabled: true,
        },
        { onConflict: "user_id,device_uid" },
      );
      if (upsertErr) {
        console.error("lovense-sync-toys upsert:", upsertErr);
        return new Response(JSON.stringify({ error: "Failed to save devices" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (firstUid) {
      await serviceClient.from("profiles").update({ device_uid: firstUid }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({ success: true, count: parsed.length, toys: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("lovense-sync-toys:", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
