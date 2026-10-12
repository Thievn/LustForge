import { Link } from "react-router-dom";
import { scrollToLandingId, trackLandingCta } from "@/lib/landingScroll";

export function LandingFooter() {
  return (
    <footer className="mt-4 border-t border-border px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-4 text-center text-xs leading-relaxed text-muted-foreground">
        <p>Adults only, 18 and over. Companions are fictional AI characters. You make them.</p>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <Link to="/terms-of-service" className="text-foreground/80 underline-offset-2 hover:underline">
            Terms
          </Link>
          <Link to="/privacy-policy" className="text-foreground/80 underline-offset-2 hover:underline">
            Privacy
          </Link>
          <Link to="/18-plus-disclaimer" className="text-foreground/80 underline-offset-2 hover:underline">
            18+ disclaimer
          </Link>
          <a href="mailto:support@lustforge.app" className="text-foreground/80 underline-offset-2 hover:underline">
            support@lustforge.app
          </a>
          <button
            type="button"
            onClick={() => {
              trackLandingCta("footer");
              scrollToLandingId("waitlist");
            }}
            className="text-foreground/80 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Join the waitlist
          </button>
        </p>
        <p>© {new Date().getFullYear()} LustForge</p>
      </div>
    </footer>
  );
}
