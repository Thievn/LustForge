import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  capabilitiesForToyType,
  extractToysFromCallback,
  isLikelyUserUidNotToyId,
} from "../_shared/lovenseToyParse.ts";
import { fetchCloudToysForUser, fetchLanToysFromCallback } from "../_shared/lovenseFetchToys.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/** Lovense may send `toys` / `toyList` as JSON strings or use GET query params. */
function normalizeCallbackPayload(
  method: string,
  url: URL,
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...raw };
  if (method === "GET") {
    for (const [k, v] of url.searchParams.entries()) {
      if (!(k in out)) out[k] = v;
    }
  }
  const toysVal = out.toys;
  if (typeof toysVal === "string" && toysVal.trim()) {
    try {
      out.toys = JSON.parse(toysVal) as unknown;
    } catch {
      /* keep string */
    }
  }
  const toyListVal = out.toyList;
  if (typeof toyListVal === "string" && toyListVal.trim()) {
    try {
      out.toyList = JSON.parse(toyListVal) as unknown;
    } catch {
      /* keep */
    }
  }
  const dataVal = out.data;
  if (dataVal && typeof dataVal === "object" && !Array.isArray(dataVal)) {
    const dataObj = dataVal as Record<string, unknown>;
    if (out.toys == null && dataObj.toys != null) out.toys = dataObj.toys;
    if (out.toyList == null && dataObj.toyList != null) out.toyList = dataObj.toyList;
    const nestedToys = dataObj.toys;
    if (typeof nestedToys === "string" && nestedToys.trim()) {
      try {
        out.toys = JSON.parse(nestedToys) as unknown;
      } catch {
        /* keep */
      }
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let callbackData: Record<string, unknown>;
    const contentType = req.headers.get("content-type") || "";
    const url = new URL(req.url);

    if (req.method === "GET") {
      callbackData = Object.fromEntries(url.searchParams.entries()) as Record<string, unknown>;
    } else if (contentType.includes("application/json")) {
      callbackData = (await req.json()) as Record<string, unknown>;
    } else {
      const text = await req.text();
      try {
        callbackData = JSON.parse(text) as Record<string, unknown>;
      } catch {
        const params = new URLSearchParams(text);
        callbackData = Object.fromEntries(params.entries()) as Record<string, unknown>;
      }
    }

    callbackData = normalizeCallbackPayload(req.method, url, callbackData);

    console.log("Lovense callback received:", JSON.stringify(callbackData));

    const pairingToken =
      url.searchParams.get("token") ||
      url.searchParams.get("utoken") ||
      (typeof callbackData.utoken === "string" ? callbackData.utoken : null) ||
      (typeof callbackData.token === "string" ? callbackData.token : null);

    if (!pairingToken) {
      console.error("No pairing token in callback");
      return new Response(JSON.stringify({ error: "Missing pairing token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pairing, error: pairingError } = await serviceClient
      .from("lovense_pairings")
      .select("user_id, expires_at")
      .eq("pairing_token", pairingToken)
      .single();

    if (pairingError || !pairing) {
      console.error("Pairing not found:", pairingError);
      return new Response(JSON.stringify({ error: "Invalid or expired pairing" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(pairing.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Pairing token expired" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toysFromCallback = extractToysFromCallback(callbackData).filter(
      (t) => !isLikelyUserUidNotToyId(t.deviceUid, pairing.user_id),
    );

    let toys = toysFromCallback;

    if (toys.length === 0) {
      console.log("No toys in callback payload, trying cloud getToys for user:", pairing.user_id);
      toys = await fetchCloudToysForUser(pairing.user_id);
    }

    if (toys.length === 0) {
      console.log("Cloud getToys empty, trying LAN GetToys from callback domain");
      toys = await fetchLanToysFromCallback(callbackData).filter(
        (t) => !isLikelyUserUidNotToyId(t.deviceUid, pairing.user_id),
      );
    }

    // Remove legacy bad rows where device_uid was stored as the account id.
    await serviceClient
      .from("user_lovense_toys")
      .delete()
      .eq("user_id", pairing.user_id)
      .eq("device_uid", pairing.user_id);

    if (toys.length === 0) {
      console.warn("Pairing callback accepted but no toys resolved yet:", JSON.stringify(callbackData));
      await serviceClient.from("lovense_pairings").delete().eq("pairing_token", pairingToken);
      return new Response(
        JSON.stringify({
          success: true,
          count: 0,
          syncRequired: true,
          message: "Link registered — refresh device list if your toy does not appear.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let firstDeviceUid: string | null = null;

    for (const toy of toys) {
      if (!firstDeviceUid) firstDeviceUid = toy.deviceUid;

      const { error: upsertErr } = await serviceClient.from("user_lovense_toys").upsert(
        {
          user_id: pairing.user_id,
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
        console.error("user_lovense_toys upsert error:", upsertErr);
        return new Response(JSON.stringify({ error: "Failed to save device" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    await serviceClient
      .from("profiles")
      .update({ device_uid: firstDeviceUid })
      .eq("user_id", pairing.user_id);

    await serviceClient.from("lovense_pairings").delete().eq("pairing_token", pairingToken);

    console.log("Device(s) connected for user:", pairing.user_id, "primary uid:", firstDeviceUid);

    return new Response(JSON.stringify({ success: true, count: toys.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Callback error:", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
