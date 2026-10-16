import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="mt-4 border-t border-[#f1c45e]/15 px-4 py-12">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <p className="font-wordmark text-lg text-[#F4EEF2]">
          Lust<b className="text-[#ff8ac4]">Forge</b>
        </p>
        <div className="flex flex-col items-center gap-2">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#B8A9BC]" aria-label="Footer">
            <Link to="/terms-of-service" className="text-foreground/80 underline-offset-2 hover:underline">
              Terms
            </Link>
            <Link to="/privacy-policy" className="text-foreground/80 underline-offset-2 hover:underline">
              Privacy
            </Link>
            <a href="mailto:support@lustforge.app" className="text-foreground/80 underline-offset-2 hover:underline">
              Contact
            </a>
          </nav>
          <p className="text-xs text-[#B8A9BC]">
            <a href="mailto:support@lustforge.app" className="text-foreground/80 underline-offset-2 hover:underline">
              support@lustforge.app
            </a>
          </p>
        </div>
        <p className="text-xs text-[#B8A9BC]">© {new Date().getFullYear()} LustForge</p>
      </div>
    </footer>
  );
}
