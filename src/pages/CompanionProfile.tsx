import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCompanionDisplayOverride } from "@/hooks/useCompanionDisplayOverride";
import { mergeCompanionDisplayWithUserOverride } from "@/lib/mergeCompanionDisplayOverride";
import { stripDiscoverForgeTemplateCanonicalLoop } from "@/lib/discoverTemplateMedia";
import { isLandingSample, landingDisplayName } from "@/lib/landingExamples";
import { useCompanionGeneratedImages } from "@/hooks/useCompanionGeneratedImages";
import { useCompanions, dbToCompanion, staticCatalogDbById } from "@/hooks/useCompanions";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";
import { useForgeCompanionOverlay } from "@/hooks/useForgeCompanionOverlay";
import { useProfileWallet, invalidateProfileWallet } from "@/hooks/useProfileWallet";
import { applyWalletBalanceFromServer } from "@/lib/profileWalletSync";
import { PURCHASED_COMPANION_IDS_QUERY_KEY } from "@/hooks/usePurchasedCompanionIds";
import Navbar from "@/components/Navbar";
import ParticleBackground from "@/components/ParticleBackground";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Crown,
  Gem,
  GitBranch,
  Heart,
  Images,
  MessageCircle,
  Phone,
  Sparkles,
  Loader2,
  Flame,
  ChevronRight,
  ThumbsDown,
  ThumbsUp,
  Waves,
  Zap,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useMemo, useCallback, useRef, type ReactNode } from "react";
import { getCompanionBackstoryParagraphs } from "@/lib/companionBackstory";
import { BoudoirProfile } from "@/components/companion/BoudoirProfile";
import {
  profileStillPortraitUrl,
  isVideoPortraitUrl,
  isLoopVideoStorageUrl,
  isEligibleLoopPortraitVideoUrl,
  portraitUrlsEquivalent,
} from "@/lib/companionMedia";
import { prependCanonicalPortraitIfMissing } from "@/lib/companionGalleryWithCanonical";
import { clearUserPortraitOverrideStill } from "@/lib/clearUserPortraitOverrideStill";
import { setCompanionPortraitFromGalleryUrl } from "@/lib/setCompanionPortraitFromGallery";
import { deleteCompanionGalleryImage } from "@/lib/deleteCompanionGalleryImage";
import {
  enrichCompanionWithGalleryLoop,
  profileLoopLightboxAnimated,
  resolveProfileLoopDisplayState,
} from "@/lib/profileLoopDisplay";
import { CompanionGalleryGrid } from "@/components/companion/CompanionGalleryGrid";
import type { CompanionRarity } from "@/lib/companionRarity";
import { TierHaloPortraitFrame } from "@/components/rarity/TierHaloPortraitFrame";
import { profileTierHaloInnerRoundClass } from "@/lib/profilePortraitTierHalo";
import { AbyssalProfileParticles } from "@/components/rarity/AbyssalProfileParticles";
import { cn } from "@/lib/utils";
import { getToys, type LovenseToy } from "@/lib/lovense";
import { useCompanionVibrationPatterns, type CompanionVibrationPatternRow } from "@/hooks/useCompanionVibrationPatterns";
import { VibrationPatternButtons } from "@/components/toy/VibrationPatternButtons";
import { buildLovenseCommand } from "@/lib/buildLovenseCommand";
import { createSustainedLovenseSession } from "@/lib/sustainedLovenseSession";
import { formatNexusCooldownShort, nexusCooldownRemainingMs } from "@/lib/nexusMerge";
import { splitProseIntoParagraphs } from "@/lib/profileProseSplit";
import { buildProfileSearchTags } from "@/lib/companionSearchTags";
import { getChatAutoSpendImages, setChatAutoSpendImages } from "@/lib/chatImageSettings";
import { discoverCardPriceFc } from "@/lib/forgeEconomy";
import { purchaseDiscoverCompanion } from "@/lib/forgeCoinsClient";
import { DiscoverPurchaseConfirmDialog } from "@/components/discover/DiscoverPurchaseConfirmDialog";
import { PORTRAIT_CARD_ASPECT_CLASS, PROFILE_LOOP_VIDEO_ASPECT_CLASS } from "@/lib/portraitAspect";
import { ChatAutoSpendImagesToggle } from "@/components/chat/ChatAutoSpendImagesToggle";
import { CompanionVibeTraitStrip } from "@/components/traits/CompanionVibeTraitStrip";
import { VibeTraitProfilePanel } from "@/components/traits/VibeTraitProfilePanel";
import { resolveDisplayTraitsForCompanion } from "@/lib/vibeDisplayTraits";
import { PortraitViewLightbox } from "@/components/PortraitViewLightbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { useLovensePairing } from "@/hooks/useLovensePairing";
import { useWindowVisibleRefresh } from "@/hooks/useWindowVisibleRefresh";
import { LovensePairingQrBlock } from "@/components/toy/LovensePairingQrBlock";
import { LiveCallTypePanel } from "@/components/liveCall/LiveCallTypePanel";
import { ProfileLoopingVideoUpsell } from "@/components/companion/ProfileLoopingVideoUpsell";
import { Switch } from "@/components/ui/switch";
import { setProfileLoopVideoEnabledForUser } from "@/lib/setProfileLoopVideoEnabledForUser";
import { isPlatformAdmin } from "@/config/auth";
import { isCompanionProfileTeaserMode } from "@/config/publicLaunch";
import { invokeGenerateLiveCallOptions } from "@/lib/invokeGenerateLiveCallOptions";
import { stashAndNavigateToLiveCall } from "@/lib/navigateToLiveCall";
import { ensureCompanionCallNotifications } from "@/lib/companionCallNotifications";
import { hasUserPurchasedCompanionCard } from "@/lib/hasUserPurchasedCompanionCard";
import {
  getPublicCompanionProfileShareUrl,
  getPublicSiteOrigin,
  absoluteUrlWithPublicSite,
} from "@/lib/publicCompanionShareUrl";

function PremiumDisabledButton({
  label,
  hint,
  className = "",
  icon,
  presented = false,
  tone = "chat",
}: {
  label: string;
  hint: string;
  className?: string;
  icon?: ReactNode;
  /** Looks like a live action. Hover explains why it stays put. */
  presented?: boolean;
  tone?: "chat" | "call";
}) {
  return (
    <div className={`relative group ${className}`}>
      <button
        type="button"
        aria-disabled="true"
        title={hint}
        onClick={(event) => event.preventDefault()}
        className={
          presented && tone === "call"
            ? "inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-card/80 px-5 py-3 text-sm font-bold text-primary touch-manipulation max-md:min-h-[48px]"
            : presented
              ? "inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary px-5 py-3 text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 touch-manipulation max-md:min-h-[48px]"
              : "inline-flex items-center gap-2 rounded-xl border border-border bg-card/40 px-5 py-3.5 text-sm font-semibold text-muted-foreground/70"
        }
      >
        {icon}
        {label}
      </button>
      <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-30 w-56 -translate-x-1/2 rounded-lg border border-white/10 bg-black/85 px-3 py-2 text-[11px] leading-relaxed text-white/85 opacity-0 shadow-xl backdrop-blur-md transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {hint}
      </div>
    </div>
  );
}

const RARITY_BADGE: Record<
  CompanionRarity,
  { label: string; className: string; sub?: string }
> = {
  common: {
    label: "Common",
    className:
      "border-[#c8c8dc]/55 bg-gradient-to-r from-white/[0.12] to-white/[0.04] text-white/90 shadow-[0_0_20px_rgba(200,200,220,0.15)]",
  },
  rare: {
    label: "Rare",
    className:
      "border-sky-400/45 bg-sky-500/15 text-sky-100 shadow-[0_0_22px_rgba(56,189,248,0.28)]",
  },
  epic: {
    label: "Epic",
    className:
      "border-violet-400/50 bg-violet-600/20 text-violet-100 shadow-[0_0_24px_rgba(168,85,247,0.3)]",
  },
  legendary: {
    label: "Legendary",
    className:
      "border-amber-300/55 bg-amber-500/20 text-amber-50 shadow-[0_0_26px_rgba(251,191,36,0.28)]",
  },
  mythic: {
    label: "Mythic",
    className:
      "border-rose-500/55 bg-rose-600/25 text-rose-50 shadow-[0_0_28px_rgba(244,63,94,0.35)]",
  },
  abyssal: {
    label: "Abyssal",
    sub: "0.1% forge",
    className:
      "border-[#D6336C]/70 bg-gradient-to-r from-[#D6336C]/25 via-fuchsia-600/30 to-[#E0457B]/20 text-white shadow-[0_0_40px_rgba(214,51,108,0.45),0_0_70px_rgba(168,85,247,0.25)]",
  },
};

const CompanionProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: dbCompanions, isLoading } = useCompanions();
  const [user, setUser] = useState<any>(null);
  const [myVote, setMyVote] = useState<1 | -1 | null>(null);
  const [pinned, setPinned] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [connectedToys, setConnectedToys] = useState<LovenseToy[]>([]);
  const [pairDialogOpen, setPairDialogOpen] = useState(false);
  const [sendingVibrationId, setSendingVibrationId] = useState<string | null>(null);
  const [livePatternId, setLivePatternId] = useState<string | null>(null);
  const sustainedToySessionRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [profileTab, setProfileTab] = useState<"profile" | "live">("profile");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [loopFromGeneratedImageId, setLoopFromGeneratedImageId] = useState<string | null>(null);
  const [loopPrefBusy, setLoopPrefBusy] = useState(false);
  const [loopPlaybackFailed, setLoopPlaybackFailed] = useState(false);
  const [portraitRevertBusy, setPortraitRevertBusy] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [autoSpendChatImages, setAutoSpendChatImagesState] = useState(false);
  const [dropClickTracked, setDropClickTracked] = useState(false);
  const walletQuery = useProfileWallet(user?.id);
  const fcBalanceProfile = user?.id
    ? walletQuery.isSuccess
      ? walletQuery.data.tokens_balance
      : (walletQuery.data?.tokens_balance ?? null)
    : null;
  const discoverFreeCommonClaimed = user?.id
    ? walletQuery.data
      ? walletQuery.data.discover_free_common_claimed
      : null
    : null;
  const [buyConfirmProfileOpen, setBuyConfirmProfileOpen] = useState(false);
  const [purchasingDiscoverProfile, setPurchasingDiscoverProfile] = useState(false);
  /** Paid Discover / catalog unlock (see `purchase_discover_companion` → `user_transactions.card_purchase`). */
  const [paidCardQueryDone, setPaidCardQueryDone] = useState(false);
  const [hasPaidForThisCard, setHasPaidForThisCard] = useState(false);

  const isAdminUser = useMemo(() => (user ? isPlatformAdmin(user) : false), [user]);

  const { data: vibrationPatterns = [], isLoading: vibrationPatternsLoading } = useCompanionVibrationPatterns(id);

  const { dbComp: dbFromSources, forgeLookupBusy: forgeRowFetching } = useForgeCompanionOverlay(
    id,
    dbCompanions,
    isLoading,
  );
  const dbComp = useMemo(() => {
    if (dbFromSources) return dbFromSources;
    if (isLoading || forgeRowFetching) return null;
    const localPortrait = id ? LANDING_LOCAL_PORTRAITS[id] : undefined;
    const fallback = staticCatalogDbById(id);
    if (!fallback && id && localPortrait && isLandingSample(id)) {
      const donor = staticCatalogDbById("tyler-kane");
      if (!donor) return null;
      return {
        ...donor,
        id,
        name: landingDisplayName(id),
        tagline: "Golden hour, and nowhere else to be.",
        role: "Companion",
        gender: "Man",
        appearance: "Warm light on his face, easy in the frame, dressed down.",
        personality: "Steady, close, and in no rush.",
        bio: "A sample from the front page. The thread with him stays closed.",
        fantasy_starters: [],
        kinks: [],
        tags: ["sample"],
        image_url: localPortrait,
        static_image_url: localPortrait,
        animated_image_url: null,
        profile_loop_video_enabled: false,
      };
    }
    if (!fallback) return null;
    if (!localPortrait) return fallback;
    return { ...fallback, image_url: localPortrait, static_image_url: localPortrait };
  }, [dbFromSources, forgeRowFetching, id, isLoading]);
  const { data: displayOverride } = useCompanionDisplayOverride(id, user?.id);
  const { data: galleryImages = [], isLoading: galleryImagesLoading } = useCompanionGeneratedImages(id, user?.id);
  const dbCompStripped = useMemo(() => stripDiscoverForgeTemplateCanonicalLoop(dbComp), [dbComp]);
  const dbCompMerged = useMemo(
    () => mergeCompanionDisplayWithUserOverride(dbCompStripped, displayOverride ?? undefined) ?? dbCompStripped,
    [dbCompStripped, displayOverride],
  );
  const dbCompDisplay = useMemo(
    () =>
      enrichCompanionWithGalleryLoop(dbCompMerged, galleryImages, {
        canonicalStillUrl: id && dbCompStripped ? profileStillPortraitUrl(dbCompStripped, id) : null,
      }) ?? dbCompMerged,
    [dbCompMerged, galleryImages, dbCompStripped, id],
  );

  const companion = dbCompDisplay ? dbToCompanion(dbCompDisplay) : null;

  const loopMp4SourceUrl = useMemo(() => {
    const u = dbCompDisplay?.animated_image_url?.trim();
    if (!u) return null;
    return isEligibleLoopPortraitVideoUrl(u, Boolean(dbCompDisplay?.profile_loop_video_enabled))
      ? u
      : null;
  }, [dbCompDisplay?.animated_image_url, dbCompDisplay?.profile_loop_video_enabled]);
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const isDropLanding = searchParams.get("drop") === "1";
  const sampleLook = isLandingSample(id);
  const weeklyDropId = searchParams.get("wd");
  const discoverPreviewFromState =
    (location.state as { discoverPreview?: boolean } | null)?.discoverPreview === true;
  const discoverPreviewFromQuery = searchParams.get("discover") === "1";
  const discoverPreview = discoverPreviewFromState || discoverPreviewFromQuery;
  const isSharedProfileLink = searchParams.get("shared") === "1";
  const isOwnForge = Boolean(
    user?.id && dbComp?.user_id === user.id && companion?.id?.startsWith("cc-"),
  );
  /** Vault / Discover: paid features require owning the card (unless own forge row). */
  const vaultLocked = Boolean(
    companion &&
      !isDropLanding &&
      !isOwnForge &&
      !forgeRowFetching &&
      (!paidCardQueryDone || !hasPaidForThisCard),
  );
  /** Global pre-launch: block spend features for everyone except platform admin. */
  const teaserConsumeLocked = Boolean(companion && isCompanionProfileTeaserMode() && !isAdminUser);
  /**
   * Locks **actions** (chat, live call start, Lovense send, gallery spend, fantasy starters) — not the profile itself.
   * Teaser pre-launch: non-admins blocked. Discover catalog: must acquire card (pins + `card_purchase` both count).
   */
  const consumeFeatureLocked = Boolean(companion && (teaserConsumeLocked || vaultLocked));

  useEffect(() => {
    if (!user?.id || !id) {
      setPaidCardQueryDone(true);
      setHasPaidForThisCard(false);
      return;
    }
    if (isOwnForge) {
      setPaidCardQueryDone(true);
      setHasPaidForThisCard(false);
      return;
    }
    let cancelled = false;
    setPaidCardQueryDone(false);
    setHasPaidForThisCard(false);
    void (async () => {
      const ok = await hasUserPurchasedCompanionCard(user.id, id);
      if (cancelled) return;
      setHasPaidForThisCard(ok);
      setPaidCardQueryDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, id, isOwnForge]);

  /** e.g. Chat “Live call” can deep-link here with `state: { profileTab: "live" }`. Legacy `gallery` opens the inline gallery. */
  useEffect(() => {
    const st = location.state as { profileTab?: "profile" | "gallery" | "live"; discoverPreview?: boolean } | null;
    const tab = st?.profileTab;
    if (tab === "gallery") {
      if (!consumeFeatureLocked) setGalleryOpen(true);
      setProfileTab("profile");
      return;
    }
    if (tab !== "profile" && tab !== "live") return;
    if (teaserConsumeLocked && !isAdminUser && tab !== "profile") return;
    setProfileTab(tab);
  }, [location.state, location.search, consumeFeatureLocked, teaserConsumeLocked, isAdminUser]);
  const vibeTraits = useMemo(
    () => (companion ? resolveDisplayTraitsForCompanion(companion) : []),
    [companion],
  );
  const rarity: CompanionRarity = companion?.rarity ?? "common";
  const discoverListFc = discoverCardPriceFc(rarity);
  const discoverEffectiveFc = useMemo(() => {
    if (!user?.id || rarity !== "common") return discoverListFc;
    if (discoverFreeCommonClaimed !== false) return discoverListFc;
    return 0;
  }, [user?.id, rarity, discoverListFc, discoverFreeCommonClaimed]);
  const profileLoopState = useMemo(
    () => resolveProfileLoopDisplayState(dbCompDisplay, { playbackFailed: loopPlaybackFailed }),
    [dbCompDisplay, loopPlaybackFailed],
  );
  const { animatedPortrait, loopVideoSrc, showLoopVideo } = profileLoopState;
  useEffect(() => {
    setLoopPlaybackFailed(false);
  }, [animatedPortrait]);

  const handleLoopVideoError = useCallback(() => {
    setLoopPlaybackFailed(true);
  }, []);
  const lightboxAnimated = profileLoopLightboxAnimated(dbCompDisplay);
  const stillForProfile = useMemo(() => profileStillPortraitUrl(dbCompDisplay, id), [dbCompDisplay, id]);
  const canonicalCardStillUrl = useMemo(
    () => (id && dbCompStripped ? profileStillPortraitUrl(dbCompStripped, id) : null),
    [dbCompStripped, id],
  );
  const galleryImagesForGrid = useMemo(
    () =>
      prependCanonicalPortraitIfMissing(galleryImages, {
        companionId: id ?? "",
        canonicalStillUrl: canonicalCardStillUrl,
        sortTimestamp: dbCompStripped?.created_at,
      }),
    [galleryImages, id, canonicalCardStillUrl, dbCompStripped?.created_at],
  );
  const portraitDiffersFromCardArt = useMemo(() => {
    if (!user?.id || !canonicalCardStillUrl?.trim() || !stillForProfile?.trim()) return false;
    return !portraitUrlsEquivalent(canonicalCardStillUrl, stillForProfile);
  }, [user?.id, canonicalCardStillUrl, stillForProfile]);

  const loopVideoActive = false;
  const portraitAspectClass = loopVideoActive
    ? PROFILE_LOOP_VIDEO_ASPECT_CLASS
    : PORTRAIT_CARD_ASPECT_CLASS;

  const lockedPreviewBannerText = useMemo(() => {
    if (!companion) return "";
    if (isCompanionProfileTeaserMode() && !isAdminUser) {
      return `Preview mode — ${companion.name} is here for you to explore. Chat, live voice, gallery, and device features are coming soon at launch.`;
    }
    if (isSharedProfileLink) {
      return `A friend shared this LustForge card — meet ${companion.name}. Full profile below; acquire the card to unlock chat, live voice, gallery tools, and Lovense.`;
    }
    if (discoverPreview) {
      return "Preview from Discover — full profile below (traits, bio, patterns). Acquire this card to unlock chat, live calls, gallery tools, and Lovense.";
    }
    return "Full profile below — acquire this card to unlock chat, live calls, gallery tools, and Lovense.";
  }, [companion, isSharedProfileLink, discoverPreview, isAdminUser]);

  useEffect(() => {
    if (typeof document === "undefined" || !companion?.id) return;
    const prevTitle = document.title;
    const shareCanonical = getPublicCompanionProfileShareUrl(companion.id);
    const absoluteImage = absoluteUrlWithPublicSite(stillForProfile);
    const title = `${sampleLook ? landingDisplayName(companion.id, companion.name) : companion.name} · LustForge`;
    const desc = isSharedProfileLink
      ? `Your friend linked you to ${companion.name} on LustForge — preview the card, then forge your fantasies. (18+)`
      : `${companion.tagline ? `${companion.tagline} ` : ""}Preview on LustForge.`;

    document.title = title;

    const metaRows: { attr: "name" | "property"; key: string; value: string }[] = [
      { attr: "property", key: "og:type", value: "website" },
      { attr: "property", key: "og:title", value: title },
      { attr: "property", key: "og:description", value: desc },
      { attr: "property", key: "og:url", value: shareCanonical },
      { attr: "name", key: "twitter:card", value: "summary_large_image" },
      { attr: "name", key: "twitter:title", value: title },
      { attr: "name", key: "twitter:description", value: desc },
    ];
    if (absoluteImage) {
      metaRows.push(
        { attr: "property", key: "og:image", value: absoluteImage },
        { attr: "property", key: "og:image:secure_url", value: absoluteImage },
        { attr: "name", key: "twitter:image", value: absoluteImage },
      );
    }

    const created: Element[] = [];
    for (const row of metaRows) {
      const el = document.createElement("meta");
      el.setAttribute("data-lf-profile-og", "1");
      el.setAttribute(row.attr, row.key);
      el.setAttribute("content", row.value);
      document.head.appendChild(el);
      created.push(el);
    }
    const descPlain = document.createElement("meta");
    descPlain.setAttribute("data-lf-profile-og", "1");
    descPlain.setAttribute("name", "description");
    descPlain.setAttribute("content", desc);
    document.head.appendChild(descPlain);
    created.push(descPlain);

    return () => {
      document.title = prevTitle;
      created.forEach((n) => n.remove());
    };
  }, [companion?.id, companion?.name, companion?.tagline, stillForProfile, isSharedProfileLink]);

  useEffect(() => {
    if (companion?.id) setAutoSpendChatImagesState(getChatAutoSpendImages(companion.id));
  }, [companion?.id]);

  const backstoryParagraphs = companion
    ? getCompanionBackstoryParagraphs(companion, dbComp)
    : [];
  const starters = companion?.fantasyStarters?.slice(0, 5) ?? [];
  const isAbyssal = rarity === "abyssal";

  const appearanceParagraphs = useMemo(
    () => (companion ? splitProseIntoParagraphs(companion.appearance, 3) : []),
    [companion?.appearance],
  );
  const personalityParagraphs = useMemo(
    () => (companion ? splitProseIntoParagraphs(companion.personality, 3) : []),
    [companion?.personality],
  );
  const profileSearchTags = useMemo(
    () => (companion ? buildProfileSearchTags(companion) : []),
    [companion],
  );

  const lineageParents = useMemo(() => {
    const ids = companion?.lineageParentIds;
    if (!ids?.length || !dbCompanions) return [];
    return ids.map((pid) => {
      const row = dbCompanions.find((x) => x.id === pid);
      return { id: pid, name: row?.name ?? "Lineage parent" };
    });
  }, [companion?.lineageParentIds, dbCompanions]);

  const nexusCooldownMs =
    dbComp?.id.startsWith("cc-") && user?.id && dbComp.user_id === user.id
      ? nexusCooldownRemainingMs(dbComp.nexus_cooldown_until ?? null)
      : 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setConnectedToys([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const toys = await getToys(user.id);
      if (!cancelled) setConnectedToys(toys);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const activeToys = useMemo(() => connectedToys.filter((t) => t.enabled), [connectedToys]);
  const hasLovenseToy = activeToys.length > 0;

  const refreshConnectedToys = useCallback(async () => {
    if (!user?.id) return;
    const toys = await getToys(user.id);
    setConnectedToys(toys);
  }, [user?.id]);

  useWindowVisibleRefresh(refreshConnectedToys, Boolean(user?.id));

  const {
    qrImageUrl: pairQrUrl,
    isLoading: pairLoading,
    startPairing: startLovensePairing,
    cancelPairing: cancelLovensePairing,
    lastError: pairErr,
    setLastError: setPairErr,
  } = useLovensePairing(user?.id, {
    onConnected: () => {
      void refreshConnectedToys();
      setPairDialogOpen(false);
      toast.success("Toy linked — try a pattern below.");
    },
  });

  useEffect(() => {
    if (!pairErr) return;
    toast.error(pairErr);
    setPairErr(null);
  }, [pairErr, setPairErr]);

  const stopSustainedToy = useCallback(async () => {
    const s = sustainedToySessionRef.current;
    sustainedToySessionRef.current = null;
    if (s) await s.stop();
    setLivePatternId(null);
  }, []);

  useEffect(() => {
    return () => {
      void stopSustainedToy();
    };
  }, [stopSustainedToy]);

  const triggerProfileVibration = async (row: CompanionVibrationPatternRow) => {
    if (consumeFeatureLocked) {
      toast.message("A card must be acquired first", {
        description: "Acquire this card to use Lovense patterns with your toys.",
      });
      return;
    }
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${companion?.id}` } });
      return;
    }
    if (!hasLovenseToy) {
      toast.error("Connect a Lovense toy to use these patterns.");
      return;
    }
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("lustforge-primary-toy-uid") : null;
    const target =
      (stored && activeToys.some((t) => t.id === stored) ? stored : null) ?? activeToys[0]?.id;
    if (!target) {
      toast.error("No active toy.");
      return;
    }

    if (livePatternId === row.id) {
      setSendingVibrationId(row.id);
      try {
        await stopSustainedToy();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not stop the pattern.");
      } finally {
        setSendingVibrationId(null);
      }
      return;
    }

    const cmd = buildLovenseCommand({
      source: "db_payload",
      raw: row.vibration_pattern_pool?.payload,
      deviceUid: target,
    });
    if (!cmd) {
      toast.error("Invalid pattern.");
      return;
    }
    setSendingVibrationId(row.id);
    try {
      await stopSustainedToy();
      const session = await createSustainedLovenseSession(user.id, cmd, {
        onRefreshError: (err) => {
          toast.error(err.message || "Toy connection lost");
          void stopSustainedToy();
        },
      });
      sustainedToySessionRef.current = session;
      setLivePatternId(row.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reach your toy.");
    } finally {
      setSendingVibrationId(null);
    }
  };

  useEffect(() => {
    if (!id || !user?.id) {
      setMyVote(null);
      setPinned(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [voteRes, pinRes] = await Promise.all([
        supabase
          .from("companion_discovery_votes")
          .select("vote")
          .eq("user_id", user.id)
          .eq("companion_id", id)
          .maybeSingle(),
        supabase
          .from("user_discover_pins")
          .select("companion_id")
          .eq("user_id", user.id)
          .eq("companion_id", id)
          .maybeSingle(),
      ]);
      if (cancelled) return;
      const v = voteRes.data?.vote;
      setMyVote(v === 1 ? 1 : v === -1 ? -1 : null);
      setPinned(!!pinRes.data?.companion_id);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user?.id]);

  useEffect(() => {
    if (!teaserConsumeLocked || isAdminUser) return;
    setProfileTab((t) => (t !== "profile" ? "profile" : t));
  }, [teaserConsumeLocked, isAdminUser]);

  useEffect(() => {
    if (!isDropLanding || !weeklyDropId || dropClickTracked) return;
    setDropClickTracked(true);
    void supabase.functions.invoke("zernio-social", {
      body: { mode: "track_drop_click", dropId: weeklyDropId },
    });
  }, [isDropLanding, weeklyDropId, dropClickTracked]);

  const submitVote = async (next: 1 | -1) => {
    if (!id) return;
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${id}` } });
      return;
    }
    setVoteBusy(true);
    try {
      if (myVote === next) {
        const { error } = await supabase
          .from("companion_discovery_votes")
          .delete()
          .eq("user_id", user.id)
          .eq("companion_id", id);
        if (error) throw error;
        setMyVote(null);
      } else {
        const { error } = await supabase.from("companion_discovery_votes").upsert(
          { user_id: user.id, companion_id: id, vote: next },
          { onConflict: "user_id,companion_id" },
        );
        if (error) throw error;
        setMyVote(next);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not save vote.");
    } finally {
      setVoteBusy(false);
    }
  };

  const togglePin = async () => {
    if (!id) return;
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${id}` } });
      return;
    }
    setPinBusy(true);
    try {
      if (pinned) {
        const { error } = await supabase
          .from("user_discover_pins")
          .delete()
          .eq("user_id", user.id)
          .eq("companion_id", id);
        if (error) throw error;
        setPinned(false);
      } else {
        const { error } = await supabase.from("user_discover_pins").insert({
          user_id: user.id,
          companion_id: id,
        });
        if (error) throw error;
        setPinned(true);
      }
      void queryClient.invalidateQueries({ queryKey: [...VAULT_COLLECTION_QUERY_KEY, user.id] });
      void queryClient.invalidateQueries({ queryKey: [...PURCHASED_COMPANION_IDS_QUERY_KEY, user.id] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Could not update collection.");
    } finally {
      setPinBusy(false);
    }
  };

  const copyCompanionShareLink = useCallback(async () => {
    if (!id) return;
    const url = getPublicCompanionProfileShareUrl(id);
    const name = companion?.name ?? "this companion";
    const shareText = `Open ${name}'s card on LustForge — preview the profile, then forge your fantasies. (18+)`;
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({
          title: `LustForge · ${name}`,
          text: shareText,
          url,
        });
        toast.success("Shared from LustForge");
        return;
      }
    } catch {
      /* user cancelled share sheet */
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied", { description: shareText });
        return;
      }
    } catch {
      /* ignore */
    }
    toast.error("Could not share or copy the link.");
  }, [id, companion?.name]);

  if (isLoading || forgeRowFetching) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!companion) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 pt-20 px-4 text-center">
          <p className="text-muted-foreground">Companion not found.</p>
          <Link to="/" className="text-sm text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const handleStartChat = (starterPrompt?: string, starterTitle?: string) => {
    if (consumeFeatureLocked) {
      toast.message("A card must be acquired first", {
        description: "Acquire this card to unlock chat and fantasies.",
      });
      return;
    }
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${companion.id}` } });
      return;
    }
    const prompt = starterPrompt?.trim();
    const profileEntry = location.state as { from?: string } | undefined;
    const profileBack =
      profileEntry?.from ?? (isOwnForge ? "/dashboard?nav=collection" : "/discover");
    navigate(`/chat/${companion.id}`, {
      state: {
        from: `/companions/${companion.id}`,
        profileBackTarget: profileBack,
        starterPrompt: prompt || undefined,
        starterTitle: starterTitle || undefined,
      },
    });
  };

  const handleQuickLiveCall = () => {
    if (consumeFeatureLocked) {
      toast.message("A card must be acquired first", {
        description: "Acquire this card to unlock live voice.",
      });
      return;
    }
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${companion.id}` } });
      return;
    }
    void ensureCompanionCallNotifications();
    const ok = stashAndNavigateToLiveCall(navigate, companion.id, companion);
    if (!ok) {
      toast.error("No call style available right now.");
      return;
    }
    void invokeGenerateLiveCallOptions(companion.id);
  };

  const handlePortraitFromGallery = async (
    imageUrl: string,
    options?: import("@/lib/setPortraitFromGalleryTypes").SetPortraitFromGalleryOptions,
  ) => {
    if (!user?.id || !id || !dbComp) return;
    const baseAnim = dbComp.animated_image_url?.trim() ?? "";
    const result = await setCompanionPortraitFromGalleryUrl({
      userId: user.id,
      companionId: id,
      imageUrl,
      options,
      fallbackLoopVideoUrl: baseAnim && isLoopVideoStorageUrl(baseAnim) ? baseAnim : null,
      fallbackLoopVideoEnabled: Boolean(dbComp.profile_loop_video_enabled),
    });
    queryClient.setQueryData(
      ["companion-display-override", user.id, id],
      () => ({
        portrait_url: result.portraitUrl,
        animated_portrait_url: result.loopUrl,
        profile_loop_video_enabled: result.loopEnabled,
      }),
    );
    await queryClient.invalidateQueries({ queryKey: ["companions"] });
    await queryClient.refetchQueries({ queryKey: ["companions"] });
    await queryClient.invalidateQueries({ queryKey: ["companion-display-override", user.id, id] });
    await queryClient.invalidateQueries({ queryKey: ["companion-generated-images", user.id, id] });
    await queryClient.refetchQueries({ queryKey: ["companion-generated-images", user.id, id] });
  };

  const handleRevertPortraitToCardArt = async () => {
    if (!user?.id || !id) return;
    setPortraitRevertBusy(true);
    try {
      const cleared = await clearUserPortraitOverrideStill(user.id, id);
      await queryClient.invalidateQueries({ queryKey: ["companion-display-override", user.id, id] });
      await queryClient.invalidateQueries({ queryKey: ["companions"] });
      await queryClient.refetchQueries({ queryKey: ["companions"] });
      if (cleared) {
        toast.success("Portrait restored to the card’s original art.");
      } else {
        toast.message("Nothing to revert", { description: "There was no custom portrait override saved for this card." });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not revert portrait.");
    } finally {
      setPortraitRevertBusy(false);
    }
  };

  const handleDiscoverPurchase = async () => {
    if (!id || !companion) return;
    if (!user) {
      navigate("/auth", { state: { from: `/companions/${id}` } });
      return;
    }
    const listPrice = discoverCardPriceFc(rarity);
    const effective = rarity === "common" && discoverFreeCommonClaimed === false ? 0 : listPrice;
    if (fcBalanceProfile !== null && effective > 0 && fcBalanceProfile < effective) {
      toast.error(`Not enough Forge Coins. This card is ${effective} FC — you have ${fcBalanceProfile} FC.`);
      return;
    }
    setPurchasingDiscoverProfile(true);
    try {
      const r = await purchaseDiscoverCompanion(id);
      if (!r.ok) {
        if (r.err === "insufficient_funds") {
          toast.error(`Need ${r.priceFc} FC. You have ${r.newBalance} FC.`);
        } else {
          toast.error(r.err || "Could not complete purchase.");
        }
        applyWalletBalanceFromServer(queryClient, user.id, r.newBalance);
        return;
      }
      applyWalletBalanceFromServer(queryClient, user.id, r.newBalance);
      void invalidateProfileWallet(queryClient, user.id);
      setPinned(true);
      setHasPaidForThisCard(true);
      void queryClient.invalidateQueries({ queryKey: [...VAULT_COLLECTION_QUERY_KEY, user.id] });
      void queryClient.invalidateQueries({ queryKey: [...PURCHASED_COMPANION_IDS_QUERY_KEY, user.id] });
      if (r.alreadyOwned) {
        toast.message("Already in your collection", { description: companion.name });
      } else {
        toast.success(
          r.priceFc <= 0 ? "Added to your vault — free first Common" : `Added to your vault — ${r.priceFc} FC`,
          { description: companion.name },
        );
        if (r.priceFc <= 0 && rarity === "common") setDiscoverFreeCommonClaimed(true);
      }
      const from = (location.state as { from?: string } | null)?.from;
      navigate({ pathname: `/companions/${id}`, search: "" }, { replace: true, state: from ? { from } : {} });
    } finally {
      setPurchasingDiscoverProfile(false);
      setBuyConfirmProfileOpen(false);
    }
  };

  function ProfileDiscoverRow(_props: { className?: string; hideCollectionPin?: boolean }) {
    return null;
  }


  return (
    <>
      <BoudoirProfile
        companion={companion}
        userId={user?.id ?? null}
        canEditVoice={Boolean(isOwnForge || (user && isPlatformAdmin(user)))}
        portraitUrl={stillForProfile}
        gallery={galleryImagesForGrid
          .filter((row) => row.image_url && !/\.mp4(\?|$)/i.test(row.image_url))
          .map((row) => ({ id: row.id, url: row.image_url }))}
        locked={consumeFeatureLocked}
        onBack={() => {
          const st = location.state as { from?: string } | undefined;
          navigate(st?.from || "/discover");
        }}
        onChat={() => handleStartChat()}
        onCall={() => handleQuickLiveCall()}
        onIncoming={() => {
          void ensureCompanionCallNotifications().then((ok) => {
            toast.message(ok ? "She can reach you when she calls." : "Allow calls if you want her to find you.");
          });
        }}
        acquire={
          vaultLocked && !isOwnForge
            ? {
                label: discoverEffectiveFc <= 0 ? "Add her" : "Make her yours",
                onClick: () => {
                  if (!user) {
                    navigate("/auth", { state: { from: `/companions/${companion.id}` } });
                    return;
                  }
                  setBuyConfirmProfileOpen(true);
                },
              }
            : null
        }
        extras={
          starters.length ? (
            <div className="acc open">
              <button type="button" aria-expanded="true">Scenes</button>
              <div className="pn">
                <div>
                  <div className="in" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {starters.map((starter) => (
                      <button
                        type="button"
                        key={starter.title}
                        className="btn ghost"
                        onClick={() => handleStartChat(starter.description, starter.title)}
                      >
                        {starter.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null
        }
      />
      <DiscoverPurchaseConfirmDialog
        open={buyConfirmProfileOpen}
        name={companion.name}
        tagline={companion.tagline}
        rarity={rarity}
        fcBalance={fcBalanceProfile}
        purchasing={purchasingDiscoverProfile}
        priceOverrideFc={user && rarity === "common" && discoverFreeCommonClaimed === false ? 0 : undefined}
        onClose={() => {
          if (purchasingDiscoverProfile) return;
          setBuyConfirmProfileOpen(false);
        }}
        onConfirm={() => void handleDiscoverPurchase()}
      />

      <Dialog open={pairDialogOpen} onOpenChange={setPairDialogOpen}>
        <DialogContent className="border-border/80 bg-[hsl(280_25%_8%)]/98 p-0 backdrop-blur-xl sm:max-w-md">
          <DialogHeader className="border-b border-white/[0.07] px-5 pb-3 pt-5">
            <DialogTitle className="font-gothic text-xl">Pair Lovense</DialogTitle>
            <p className="text-xs text-muted-foreground font-normal leading-relaxed pt-1">
              Same device link as Settings — scan with Lovense Remote. You can also use{" "}
              <Link to="/settings#device-connection" className="text-primary underline-offset-4 hover:underline">
                Account → Device connection
              </Link>
              .
            </p>
          </DialogHeader>
          <div className="space-y-4 px-5 pb-5">
            <LovensePairingQrBlock
              qrImageUrl={pairQrUrl}
              loading={pairLoading}
              onCancel={() => {
                cancelLovensePairing();
                setPairDialogOpen(false);
              }}
            />
            {!pairQrUrl ? (
              <button
                type="button"
                onClick={() => void startLovensePairing()}
                disabled={pairLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {pairLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Show QR code
              </button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompanionProfile;
