import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { LandingPortraitReel } from "@/components/landing/LandingPortraitReel";
import { LandingThreadMock } from "@/components/landing/LandingThreadMock";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 70% 42% at 18% -8%, hsl(338 76% 46% / 0.16), transparent 58%),
            radial-gradient(ellipse 50% 36% at 90% 8%, hsl(280 40% 46% / 0.1), transparent 55%)
          `,
        }}
      />

      <div className="relative z-10">
        <Navbar variant="landing" />

        <header className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-8 pt-[max(7.5rem,calc(5.5rem+env(safe-area-inset-top,0px)))] sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:pb-12 lg:pt-[max(8.5rem,calc(6rem+env(safe-area-inset-top,0px)))]">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-primary/80">Adults 18+</p>
            <h1 className="mx-auto mt-4 max-w-xl font-gothic text-4xl leading-[1.05] text-foreground sm:text-6xl lg:mx-0">
              Describe them. Then talk.
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
              They text you first. A picture can land in the thread, clothed or nude, and you can hear them when you want to.
            </p>
            <Link
              to="/auth"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_10px_30px_hsl(var(--primary)/0.28)] transition-colors hover:bg-primary/90"
            >
              Create yours
            </Link>
          </div>
          <LandingThreadMock />
        </header>

        <LandingPortraitReel />

        <footer className="mt-10 border-t border-border px-4 py-12">
          <div className="mx-auto max-w-3xl space-y-3 text-center text-xs leading-relaxed text-muted-foreground">
            <p>
              <strong className="font-medium text-foreground">18+ only.</strong> LustForge is for adults. The people here
              are fictional. You confirm you are at least 18 before you enter.
            </p>
            <p>Your conversations are saved for you, on your account.</p>
            <p>
              © {new Date().getFullYear()} LustForge ·{" "}
              <Link to="/terms-of-service" className="text-foreground/80 underline-offset-2 hover:underline">
                Terms
              </Link>
              {" · "}
              <Link to="/privacy-policy" className="text-foreground/80 underline-offset-2 hover:underline">
                Privacy
              </Link>
              {" · "}
              <a href="mailto:support@lustforge.app" className="text-foreground/80 underline-offset-2 hover:underline">
                support@lustforge.app
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;
