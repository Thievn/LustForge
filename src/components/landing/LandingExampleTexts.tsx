import { LANDING_EXAMPLE_TEXTS } from "@/data/landingExampleTexts";
import { LANDING_LOCAL_PORTRAITS } from "@/components/landing/landingPortraitSources";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const PORTRAIT_BY_NAME: Record<string, string> = {
  Ivy: LANDING_LOCAL_PORTRAITS["lilith-vesper"],
  Mira: LANDING_LOCAL_PORTRAITS["kira-lux"],
  Sloane: LANDING_LOCAL_PORTRAITS["lena-frost"],
  Noor: LANDING_LOCAL_PORTRAITS["zara-eclipse"],
};

export function LandingExampleTexts() {
  return (
    <section id="texts" className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="texts-heading">
      <div className="mx-auto max-w-3xl">
        <LandingHeading
          id="texts-heading"
          eyebrow="Notes"
          title="She can write first"
          lede="Set a morning and an evening. The note arrives from her, in the conversation."
        />
        <ul className="mt-8 space-y-3">
          {LANDING_EXAMPLE_TEXTS.map((item, index) => (
            <Reveal
              key={item.id}
              as="li"
              delay={index * 0.04}
              className="flex gap-3 rounded-[1.3rem] border border-[#f1c45e]/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <img
                src={PORTRAIT_BY_NAME[item.name]}
                alt=""
                className="mt-0.5 h-10 w-10 shrink-0 rounded-xl object-cover object-[center_18%]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[#F4EEF2]">{item.name}</p>
                  <time className="text-[11px] text-[#B8A9BC]">{item.when}</time>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#F4EEF2]/90">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
