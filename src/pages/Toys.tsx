import { Link } from "react-router-dom";
import { Sparkles, Waves } from "lucide-react";
import ParticleBackground from "@/components/ParticleBackground";
import Navbar from "@/components/Navbar";
import { AffiliateShopProductCard } from "@/components/affiliate/AffiliateShopProductCard";
import {
  DEFAULT_AFFILIATE_SHOP_SETTINGS,
  useAffiliateShop,
} from "@/hooks/useAffiliateShop";
import { cn } from "@/lib/utils";

export default function Toys() {
  const { settings, products, isLoading } = useAffiliateShop(true);

  const heroTitle = settings?.hero_title?.trim() || DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_title;
  const heroSubtitle = settings?.hero_subtitle?.trim() || DEFAULT_AFFILIATE_SHOP_SETTINGS.hero_subtitle;
  const syncBody = settings?.sync_section_body?.trim() || DEFAULT_AFFILIATE_SHOP_SETTINGS.sync_section_body;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <ParticleBackground />
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 120% 55% at 50% -15%, hsl(330 100% 58% / 0.11), transparent 52%),
            radial-gradient(ellipse 70% 45% at 100% 35%, hsl(170 100% 50% / 0.06), transparent 50%),
            radial-gradient(ellipse 55% 40% at 0% 60%, hsl(280 50% 45% / 0.07), transparent 48%),
            linear-gradient(to bottom, hsl(240 18% 6%) 0%, hsl(240 20% 4.2%) 45%, hsl(240 22% 3.5%) 100%)
          `,
        }}
      />

      <div className="relative z-10">
        <Navbar />

        <main
          className="mx-auto max-w-7xl px-4 pb-20 pt-[calc(5.5rem+env(safe-area-inset-top))] sm:px-6"
        >
          <header className="mx-auto max-w-3xl text-center">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#D6336C]/30 bg-[#D6336C]/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-[#D6336C]">
              <Sparkles className="h-3 w-3" />
              Lovense × LustForge
            </p>
            <h1 className="font-gothic text-3xl sm:text-4xl md:text-5xl gradient-vice-text leading-tight">
              {heroTitle}
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">{heroSubtitle}</p>
          </header>

          <section
            className={cn(
              "mx-auto mt-10 max-w-4xl rounded-2xl border border-[hsl(280_50%_35%/0.45)] p-5 sm:p-6",
              "bg-gradient-to-r from-[hsl(280_50%_35%/0.12)] via-[#D6336C]/[0.06] to-[hsl(170_100%_50%/0.05)]",
              "shadow-[0_0_40px_rgba(214,51,108,0.08)]",
            )}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[hsl(170_100%_50%/0.35)] bg-[hsl(170_100%_50%/0.08)]">
                <Waves className="h-5 w-5 text-[hsl(170_100%_50%)]" />
              </div>
              <div>
                <h2 className="font-gothic text-lg text-foreground/95">Sync in chat</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{syncBody}</p>
              </div>
            </div>
          </section>

          <section className="mt-14">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-gothic text-2xl text-foreground/95">Curated picks</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  App-controlled toys that pair beautifully with immersive chat.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="aspect-[16/9] rounded-lg border border-white/[0.06] bg-white/[0.03]" />
                    <div className="h-4 w-2/3 rounded bg-white/[0.06]" />
                    <div className="h-10 w-full rounded-xl bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
                <p className="text-muted-foreground">Products coming soon — check back after launch prep.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <AffiliateShopProductCard key={product.id} product={product} interactive />
                ))}
              </div>
            )}
          </section>
        </main>

        <footer className="relative z-10 border-t border-white/[0.06] bg-gradient-to-t from-black/20 to-transparent py-12 px-4">
          <div className="mx-auto max-w-4xl space-y-3 text-center text-xs text-muted-foreground/90">
            <p>
              <strong className="text-foreground/80">18+ Only.</strong> Adult products for consenting adults.
              All companion interactions remain AI-generated fantasy.
            </p>
            <p>
              Affiliate disclosure: Links on this page may earn LustForge a commission at no extra cost to you.
            </p>
            <p className="tracking-widest uppercase">
              Powered by{" "}
              <span className="text-primary/80 text-glow-pink font-medium">Lovense</span>
            </p>
            <Link
              to="/"
              className="inline-block text-sm text-primary/90 hover:text-primary hover:underline transition-colors"
            >
              Back to LustForge
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
