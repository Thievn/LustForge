import { CREDIT_PACKS, PLANS } from "@/lib/phone/pricing";
import { LandingCta } from "@/components/landing/LandingCta";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="pricing-heading"
          eyebrow="At launch"
          title="Prices when billing opens"
          lede="Ember, Blaze, and Inferno, plus credit packs. You cannot buy them on this page. We plan to give early waitlist emails a lower price and bonus credits. Joining the list does not charge you."
        />

        <ul className="mt-10 grid gap-3 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal
              key={plan.id}
              as="li"
              delay={index * 0.06}
              className={cn(
                "relative flex h-full flex-col rounded-[1.4rem] border bg-card/90 p-5",
                plan.id === "blaze" ? "border-primary/55 shadow-[0_18px_44px_hsl(var(--primary)/0.16)]" : "border-border",
              )}
            >
              <span className="absolute -top-2.5 right-4 rounded-full border border-primary/40 bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground">
                At launch
              </span>
              <p className="font-gothic text-2xl text-foreground">{plan.name}</p>
              <p className="mt-2 font-gothic text-4xl text-foreground">
                {plan.price}
                <span className="ml-1 font-sans text-sm text-muted-foreground">/ mo</span>
              </p>
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                <li>{plan.companions}</li>
                <li>{plan.texts}</li>
                <li>{plan.pictures}</li>
                {plan.extras.map((extra) => (
                  <li key={extra}>{extra}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>

        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <li key={pack.id} className="rounded-[1.2rem] border border-border bg-card/70 px-4 py-4">
              <p className="text-[10px] uppercase tracking-[0.16em] text-primary">At launch · {pack.name}</p>
              <p className="mt-1 font-gothic text-2xl text-foreground">{pack.price}</p>
              <p className="text-sm text-muted-foreground">{pack.credits.toLocaleString()} credits · {pack.note}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center">
          <LandingCta location="pricing">Join for the early price</LandingCta>
        </p>
      </div>
    </section>
  );
}
