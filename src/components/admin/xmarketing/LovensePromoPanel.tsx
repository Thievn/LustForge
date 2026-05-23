import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Sparkles, Wand2, Calendar, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionInvokeMessage } from "@/lib/edgeFunction";
import { invokeZernioSocial } from "@/lib/zernioSocial";
import {
  DEFAULT_AFFILIATE_SHOP_SETTINGS,
  useAffiliateShop,
} from "@/hooks/useAffiliateShop";
import type { DbCompanion } from "@/hooks/useCompanions";
import { isVideoPortraitUrl } from "@/lib/companionMedia";
import {
  mediaUrlsMixVideoAndImages,
  resolveLovensePromoMediaUrls,
  type LovenseXMediaStrategy,
} from "@/lib/lovenseComboMedia";
import { LovenseCompanionPicker } from "@/components/admin/xmarketing/LovenseCompanionPicker";
import { bakeLovensePromoCardPngBlob, uploadLovensePromoCard } from "@/lib/bakeLovensePromoCard";
import {
  appendLovenseShopLinkToTweet,
  defaultShopUrl,
  LOVENSE_CAMPAIGN_TEMPLATES,
  LOVENSE_COMBO_MEDIA_STRATEGIES,
  LOVENSE_POST_FORMATS,
  type LovenseCampaignTemplate,
  type LovensePostFormat,
  type LovenseTweetVariation,
} from "@/lib/lovensePromoTweet";
import { MarketingTweetPreview } from "@/components/admin/xmarketing/MarketingTweetPreview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NEON = "#FF2D7B";

const TONES = ["Professional", "Teasing", "Elegant", "Aggressive Hype", "Mysterious"] as const;
const POST_STYLES = ["Punchy one-liner", "Drop / FOMO", "Quote-bait"] as const;
const IMAGE_MODES = [
  { id: "branded_product", label: "Branded product card" },
  { id: "raw_product", label: "Product image as-is" },
] as const;

type ImageMode = (typeof IMAGE_MODES)[number]["id"];

const X_MEDIA_LIMIT_NOTE =
  "X (via Zernio) allows either 1 video or up to 4 images per tweet — not video + image together.";

type Props = {
  roster: DbCompanion[];
  rosterLoading: boolean;
  siteOrigin: string;
};

export function LovensePromoPanel({ roster, rosterLoading, siteOrigin }: Props) {
  const queryClient = useQueryClient();
  const { settings, products, isLoading: productsLoading } = useAffiliateShop(false);

  const [campaignTemplate, setCampaignTemplate] = useState<LovenseCampaignTemplate>("sync_focus");
  const [postFormat, setPostFormat] = useState<LovensePostFormat>("product_only");
  const [productId, setProductId] = useState<string>("");
  const [companionId, setCompanionId] = useState<string>("");
  const [tone, setTone] = useState<string>("Elegant");
  const [tweetStyle, setTweetStyle] = useState<string>(POST_STYLES[0]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageMode, setImageMode] = useState<ImageMode>("branded_product");
  const [variations, setVariations] = useState<LovenseTweetVariation[] | null>(null);
  const [pickVar, setPickVar] = useState(0);
  const [editedText, setEditedText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [baking, setBaking] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaPrepWarning, setMediaPrepWarning] = useState<string | null>(null);
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [comboMediaStrategy, setComboMediaStrategy] = useState<LovenseXMediaStrategy>("companion_video");
  const [teaseUseVideo, setTeaseUseVideo] = useState(true);
  const [xPlatformNote, setXPlatformNote] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).sort((a, b) => a.sort_order - b.sort_order),
    [products],
  );

  const selectedProduct = useMemo(
    () => activeProducts.find((p) => p.id === productId) ?? activeProducts[0] ?? null,
    [activeProducts, productId],
  );

  const selectedCompanion = useMemo(
    () => roster.find((c) => c.id === companionId) ?? null,
    [roster, companionId],
  );

  const shopUrl = defaultShopUrl(siteOrigin);

  useEffect(() => {
    if (activeProducts.length && !productId) {
      setProductId(activeProducts[0]!.id);
    }
  }, [activeProducts, productId]);

  useEffect(() => {
    const tpl = LOVENSE_CAMPAIGN_TEMPLATES.find((t) => t.id === campaignTemplate);
    if (tpl) setTone(tpl.defaultTone);
  }, [campaignTemplate]);

  const needsCompanion = postFormat === "companion_combo" || postFormat === "companion_tease";

  const activeMediaStrategy = useMemo((): LovenseXMediaStrategy | null => {
    if (postFormat === "companion_tease") return teaseUseVideo ? "companion_video" : "companion_still";
    if (postFormat === "companion_combo") return comboMediaStrategy;
    return null;
  }, [postFormat, comboMediaStrategy, teaseUseVideo]);

  const applyPromoMedia = useCallback(() => {
    if (!activeMediaStrategy || !selectedProduct) return null;
    if (!selectedCompanion) {
      setMediaUrls([]);
      setMediaPrepWarning("Select a companion.");
      setXPlatformNote(null);
      return null;
    }
    const result = resolveLovensePromoMediaUrls({
      strategy: activeMediaStrategy,
      companion: selectedCompanion,
      product: selectedProduct,
    });
    setMediaUrls(result.mediaUrls);
    setMediaPrepWarning(result.warnings.length ? result.warnings.join(" ") : null);
    setXPlatformNote(result.xPlatformNote);
    return result;
  }, [activeMediaStrategy, selectedCompanion, selectedProduct]);

  useEffect(() => {
    if (needsCompanion && selectedCompanion && selectedProduct) {
      applyPromoMedia();
    }
  }, [needsCompanion, selectedCompanion?.id, selectedProduct?.id, activeMediaStrategy, applyPromoMedia]);

  const ctaLine = useMemo(() => {
    if (campaignTemplate === "sync_focus") return "Pair your toy — sync in LustForge chat";
    if (campaignTemplate === "fomo") return "Get sync-ready before we open";
    return selectedProduct ? `Shop ${selectedProduct.name} on LustForge` : "Shop syncable toys on LustForge";
  }, [campaignTemplate, selectedProduct]);

  const baseVariation = variations?.[pickVar] ?? null;

  const tweetWithTags = useMemo(() => {
    const body = editedText.trim();
    if (!body && !baseVariation) return "";
    if (baseVariation) {
      const tags = baseVariation.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ");
      const textOnly = body || baseVariation.text;
      if (body.includes("#Lovense") || body.includes("#GrokAI")) return body;
      return tags ? `${textOnly} ${tags}` : textOnly;
    }
    return body;
  }, [editedText, baseVariation]);

  const fullTweetForPreview = useMemo(() => {
    if (!tweetWithTags) return "";
    return appendLovenseShopLinkToTweet(tweetWithTags, shopUrl, ctaLine);
  }, [tweetWithTags, shopUrl, ctaLine]);

  useEffect(() => {
    if (baseVariation) {
      setEditedText(baseVariation.text);
    }
  }, [baseVariation?.text, pickVar]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateCopy = async () => {
    if (!selectedProduct) {
      toast.error("Select an active affiliate product first.");
      return;
    }
    if (needsCompanion && !selectedCompanion) {
      toast.error("Select a companion first.");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-x-marketing", {
        body: {
          mode: "generate_lovense",
          tone,
          tweetStyle,
          customPrompt,
          campaignTemplate,
          postFormat,
          shopUrl,
          heroTitle: settings?.hero_title ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_title,
          heroSubtitle: settings?.hero_subtitle ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_subtitle,
          syncSectionBody: settings?.sync_section_body ?? DEFAULT_AFFILIATE_SHOP_SETTINGS.sync_section_body,
          product: {
            name: selectedProduct.name,
            description: selectedProduct.description,
            badge: selectedProduct.badge,
          },
          companion: selectedCompanion
            ? {
                name: selectedCompanion.name,
                tagline: selectedCompanion.tagline,
                rarity: selectedCompanion.rarity,
                role: selectedCompanion.role,
              }
            : null,
        },
      });
      if (error) throw new Error(await getEdgeFunctionInvokeMessage(error, data));
      const vars = (data as { variations?: LovenseTweetVariation[] })?.variations;
      if (!Array.isArray(vars) || vars.length < 1) throw new Error("No variations returned");
      setVariations(vars);
      setPickVar(0);
      setEditedText(vars[0]!.text);
      toast.success("Grok copy ready — pick a variation or edit.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const preparePromoMedia = useCallback(() => {
    if (needsCompanion) {
      const result = applyPromoMedia();
      if (!result?.mediaUrls.length) {
        toast.error(result?.warnings[0] ?? "Could not prepare media.");
        return false;
      }
      if (mediaUrlsMixVideoAndImages(result.mediaUrls)) {
        toast.error("Invalid for X: cannot mix video and images.");
        return false;
      }
      toast.success(
        result.mediaUrls.length === 1
          ? "Ready — 1 attachment for X."
          : `Ready — ${result.mediaUrls.length} images for X.`,
      );
      return true;
    }
    return false;
  }, [applyPromoMedia, needsCompanion]);

  const bakeMedia = useCallback(async () => {
    if (!selectedProduct) return;
    if (needsCompanion) {
      preparePromoMedia();
      return;
    }
    setBaking(true);
    setMediaPrepWarning(null);
    setXPlatformNote(null);
    try {
      let blob: Blob;
      const slug = selectedProduct.id.slice(0, 8);
      if (imageMode === "raw_product" && selectedProduct.image_url) {
        setMediaUrls([selectedProduct.image_url.split("?")[0]!]);
        toast.success("Using product image URL.");
        return;
      }
      blob = await bakeLovensePromoCardPngBlob({
        productName: selectedProduct.name,
        productDescription: selectedProduct.description,
        productImageUrl: selectedProduct.image_url,
        badge: selectedProduct.badge,
      });
      const url = await uploadLovensePromoCard(supabase, blob, slug);
      setMediaUrls([url]);
      toast.success("X media baked and uploaded.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bake failed");
    } finally {
      setBaking(false);
    }
  }, [imageMode, needsCompanion, preparePromoMedia, selectedProduct]);

  const postToX = async (scheduled: boolean) => {
    if (!fullTweetForPreview.trim()) {
      toast.error("Generate or write tweet copy first.");
      return;
    }
    if (mediaUrls.length && mediaUrlsMixVideoAndImages(mediaUrls)) {
      toast.error("X cannot publish video + images together. Switch to Companion loop video or Two images only.");
      return;
    }
    setPostBusy(true);
    try {
      const scheduledFor = scheduled && scheduleLocal ? new Date(scheduleLocal).toISOString() : undefined;
      if (scheduled && scheduleLocal && Number.isNaN(new Date(scheduleLocal).getTime())) {
        toast.error("Invalid schedule time.");
        return;
      }
      const body: Record<string, unknown> = {
        mode: "post",
        content: fullTweetForPreview,
        publishNow: !scheduledFor,
      };
      if (scheduledFor) body.scheduledFor = scheduledFor;
      if (mediaUrls.length) body.mediaUrls = mediaUrls.map((u) => u.split("?")[0]!);
      const { data, error } = await invokeZernioSocial(body);
      if (error) throw error;
      const z = data as { platformPostUrl?: string; publishWarning?: string };
      toast.success(scheduledFor ? "Scheduled on Zernio" : "Posted to X via Zernio", {
        description: z.platformPostUrl || z.publishWarning,
      });
      void queryClient.invalidateQueries({ queryKey: ["social-post-jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Post failed");
    } finally {
      setPostBusy(false);
    }
  };

  const previewMedia =
    mediaUrls.length > 0 ? (
      <div className="flex flex-col gap-3 w-full max-w-md mx-auto">
        {mediaUrls.map((url, i) => {
          const isVideo = isVideoPortraitUrl(url);
          const label =
            mediaUrls.length === 1
              ? isVideo
                ? "Video"
                : "Image"
              : i === 0
                ? "Image 1"
                : "Image 2";
          return (
            <div key={`${url}-${i}`} className="space-y-1">
              <p className="text-[9px] uppercase tracking-wider text-[#71767b]">{label}</p>
              {isVideo ? (
                <video
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-lg border border-white/10 bg-black"
                />
              ) : (
                <img
                  src={url}
                  alt=""
                  className="w-full h-auto rounded-lg border border-white/10 bg-black/40"
                />
              )}
            </div>
          );
        })}
      </div>
    ) : selectedProduct?.image_url && postFormat === "product_only" ? (
      <img
        src={selectedProduct.image_url}
        alt=""
        className="w-full rounded-xl border border-white/10 object-contain max-h-[280px] bg-black/40"
      />
    ) : null;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <div className="xl:col-span-7 space-y-4">
        <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 md:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: NEON }} />
            <h3 className="font-gothic text-lg text-white">Lovense Promo</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Grok copy + X media for{" "}
            <a href="/toys" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              /toys
            </a>
            . {X_MEDIA_LIMIT_NOTE}
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Campaign template
              </label>
              <Select value={campaignTemplate} onValueChange={(v) => setCampaignTemplate(v as LovenseCampaignTemplate)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOVENSE_CAMPAIGN_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Post format
              </label>
              <Select value={postFormat} onValueChange={(v) => setPostFormat(v as LovensePostFormat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOVENSE_POST_FORMATS.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                {LOVENSE_POST_FORMATS.find((f) => f.id === postFormat)?.hint}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Product
              </label>
              <Select
                value={selectedProduct?.id ?? ""}
                onValueChange={setProductId}
                disabled={productsLoading || activeProducts.length === 0}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No active products" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {needsCompanion ? (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Companion
                </label>
                <LovenseCompanionPicker
                  roster={roster}
                  loading={rosterLoading}
                  value={companionId}
                  onChange={setCompanionId}
                  siteOrigin={siteOrigin}
                  selected={selectedCompanion}
                />
              </div>
            ) : null}
          </div>

          {postFormat === "companion_tease" ? (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Companion media
              </label>
              <select
                value={teaseUseVideo ? "video" : "still"}
                onChange={(e) => setTeaseUseVideo(e.target.value === "video")}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                <option value="video">Loop video (animated on X)</option>
                <option value="still">Still portrait</option>
              </select>
            </div>
          ) : null}

          {postFormat === "companion_combo" ? (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                X media strategy
              </label>
              <select
                value={comboMediaStrategy}
                onChange={(e) => setComboMediaStrategy(e.target.value as LovenseXMediaStrategy)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {LOVENSE_COMBO_MEDIA_STRATEGIES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                {LOVENSE_COMBO_MEDIA_STRATEGIES.find((s) => s.id === comboMediaStrategy)?.hint}
              </p>
            </div>
          ) : null}

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Post shape
              </label>
              <select
                value={tweetStyle}
                onChange={(e) => setTweetStyle(e.target.value)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {POST_STYLES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            {postFormat === "product_only" ? (
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                X image
              </label>
              <select
                value={imageMode}
                onChange={(e) => setImageMode(e.target.value as ImageMode)}
                className="mt-1 w-full rounded-xl bg-black/60 border border-border px-3 py-2 text-sm"
              >
                {IMAGE_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            ) : (
            <div className="hidden sm:block" aria-hidden />
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Operator prompt
            </label>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={2}
              placeholder="e.g. Focus on Lush 4 sync, tease pre-launch…"
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void generateCopy()}
              disabled={generating || !selectedProduct}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white border border-white/10 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${NEON}, hsl(280 48% 40%))` }}
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              Generate with Grok
            </button>
            <button
              type="button"
              onClick={() => void bakeMedia()}
              disabled={baking || !selectedProduct}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-60"
            >
              {baking ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              {needsCompanion ? "Prepare X media" : "Rebake X image"}
            </button>
          </div>

          {xPlatformNote ? (
            <p className="text-[11px] text-muted-foreground border border-white/[0.06] rounded-lg px-3 py-2 leading-snug">
              {xPlatformNote}
            </p>
          ) : null}

          {mediaPrepWarning ? (
            <p className="text-[11px] text-amber-200/90 border border-amber-500/25 rounded-lg px-3 py-2 bg-amber-500/10 leading-snug">
              {mediaPrepWarning}
            </p>
          ) : null}

          {needsCompanion && mediaUrls.length > 0 ? (
            <p className="text-[11px] text-muted-foreground leading-snug">
              {mediaUrls.length} attachment{mediaUrls.length === 1 ? "" : "s"} queued for Zernio
              {mediaUrls.some(isVideoPortraitUrl) ? " (video)" : " (images)"}.
            </p>
          ) : null}

          {variations && variations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {variations.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setPickVar(i);
                    setEditedText(v.text);
                  }}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border",
                    pickVar === i ? "border-primary/50 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground",
                  )}
                >
                  Variation {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Tweet body (hashtags appended on post)
            </label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="mt-1 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Shop link auto-appended: {shopUrl}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-white/[0.06]">
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Schedule (optional)
              </label>
              <Input
                type="datetime-local"
                value={scheduleLocal}
                onChange={(e) => setScheduleLocal(e.target.value)}
                className="mt-1"
              />
            </div>
            <button
              type="button"
              disabled={postBusy}
              onClick={() => void postToX(false)}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/15 px-4 py-2.5 text-sm font-bold text-primary disabled:opacity-60"
            >
              {postBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Post now
            </button>
            <button
              type="button"
              disabled={postBusy || !scheduleLocal}
              onClick={() => void postToX(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Calendar className="h-4 w-4" />
              Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="xl:col-span-5 xl:sticky xl:top-4 space-y-4">
        {needsCompanion && selectedCompanion ? (
          <p className="text-xs text-muted-foreground px-1">
            {postFormat === "companion_tease" ? "Tease" : "Combo"}: {selectedCompanion.name}
            {selectedProduct ? ` + ${selectedProduct.name}` : ""}
            {mediaUrls.length ? ` · ${mediaUrls.length} attachment${mediaUrls.length === 1 ? "" : "s"} ready` : ""}
          </p>
        ) : null}
        <MarketingTweetPreview
          fullText={fullTweetForPreview || "Generate copy to preview…"}
          charCount={fullTweetForPreview.length}
          maxChars={280}
          media={previewMedia}
          mediaBlockedReason={mediaPrepWarning}
        />
      </div>
    </div>
  );
}
