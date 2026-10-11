import { trackEvent } from "@/lib/analytics";

export function scrollToLandingId(id: string): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  return true;
}

/** Public landing CTAs only. Does not replace waitlist_submit. */
export function trackLandingCta(location: string): void {
  trackEvent("landing_cta_click", { location });
}
