import { LANDING_TESTIMONIAL_LABEL, LANDING_TESTIMONIALS } from "@/data/landingTestimonials";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

export function LandingTestimonials() {
  return (
    <section id="impressions" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="impressions-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="impressions-heading"
          eyebrow="From the beta"
          title={
            <>
              What people <span className="gradient-vice-text">noticed first</span>
            </>
          }
          lede="Sample impressions from early access. A tone check — not a user count, and not a press list."
        />
        <p className="mx-auto mt-5 w-fit rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {LANDING_TESTIMONIAL_LABEL}
        </p>
        <ul className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
          {LANDING_TESTIMONIALS.map((item, index) => (
            <Reveal
              key={item.id}
              as="li"
              delay={index * 0.05}
              className="flex h-full w-[min(82vw,20rem)] shrink-0 snap-start flex-col rounded-[1.4rem] border border-border bg-card/90 p-5 shadow-[0_16px_40px_rgba(80,30,50,0.05)] md:w-auto dark:shadow-[0_16px_40px_rgba(0,0,0,0.25)]"
            >
              <span className="font-gothic text-4xl leading-none text-primary/70" aria-hidden>
                “
              </span>
              <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-foreground/90">
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
