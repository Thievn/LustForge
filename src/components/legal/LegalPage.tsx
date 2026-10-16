import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const UPDATED = "October 16, 2026";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="relative z-10 mx-auto min-h-screen max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="font-wordmark text-lg text-foreground">
        <Link to="/" className="hover:opacity-80">
          Lust<b className="text-primary">Forge</b>
        </Link>
      </p>
      <h1 className="mt-8 font-gothic text-4xl text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {UPDATED}</p>
      <article className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/85 [&_h2]:font-gothic [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:text-foreground [&_li]:mt-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </article>
      <p className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
        <Link to="/terms-of-service" className="hover:text-foreground hover:underline">
          Terms
        </Link>
        <Link to="/privacy-policy" className="hover:text-foreground hover:underline">
          Privacy
        </Link>
        <Link to="/18-plus-disclaimer" className="hover:text-foreground hover:underline">
          Adult content
        </Link>
        <a href="mailto:support@lustforge.app" className="hover:text-foreground hover:underline">
          Contact
        </a>
      </p>
    </main>
  );
}
