import { LANDING_TESTIMONIALS } from "@/data/landingTestimonials";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

/** Renders nothing until real quotes are added to LANDING_TESTIMONIALS. */
export function LandingTestimonials() {
  if (LANDING_TESTIMONIALS.length === 0) return null;

  return (
    <section id="impressions" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="impressions-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="impressions-heading"
          eyebrow="Beta testers"
          title="What testers said"
          lede="Quotes from people who tried LustForge and agreed to be named."
        />
        <ul className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item, index) => (
            <Reveal
              key={item.id}
              as="li"
              delay={index * 0.05}
              className="flex h-full w-[min(82vw,20rem)] shrink-0 snap-start flex-col rounded-[1.4rem] border border-border bg-card/90 p-5 md:w-auto"
            >
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                <p>{item.quote}</p>
              </blockquote>
              <p className="mt-4 text-xs font-semibold tracking-wide text-muted-foreground">{item.name}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
