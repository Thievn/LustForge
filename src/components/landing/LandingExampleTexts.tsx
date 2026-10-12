import { LANDING_EXAMPLE_TEXTS } from "@/data/landingExampleTexts";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

export function LandingExampleTexts() {
  return (
    <section id="example-texts" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="example-texts-heading">
      <div className="mx-auto max-w-3xl">
        <LandingHeading
          id="example-texts-heading"
          eyebrow="Sample messages"
          title="What she might text you"
          lede="These are examples of texts inside the app. They are not quotes from customers."
        />
        <ul className="mt-8 space-y-3">
          {LANDING_EXAMPLE_TEXTS.map((item, index) => (
            <Reveal key={item.id} as="li" delay={index * 0.04} className="rounded-[1.3rem] border border-border bg-card/90 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">{item.name}</p>
                <time className="text-[11px] text-muted-foreground">{item.when}</time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{item.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
