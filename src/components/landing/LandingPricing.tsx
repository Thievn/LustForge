import { LandingCta } from "@/components/landing/LandingCta";
import { LandingHeading, Reveal } from "@/components/landing/Reveal";

const NOTES = [
  { title: "Credits available", body: "Your account includes credits once you are in." },
  { title: "Add more credits later", body: "You can add more credits when you want them." },
  { title: "Waitlist only", body: "This page does not take payment. Leave your email." },
] as const;

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-28 px-4 py-14 sm:px-6 sm:py-20" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl">
        <LandingHeading
          id="pricing-heading"
          eyebrow="Early access"
          title="Credits, when you are in"
          lede="Credits are available in the app. You can add more credits later. Joining the waitlist does not charge you."
        />
        <ul className="mt-8 grid gap-3 sm:grid-cols-3">
          {NOTES.map((note, index) => (
            <Reveal
              key={note.title}
              as="li"
              delay={index * 0.05}
              className="rounded-[1.3rem] border border-[#f1c45e]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
            >
              <p className="font-gothic text-xl text-[#F4EEF2]">{note.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[#B8A9BC]">{note.body}</p>
            </Reveal>
          ))}
        </ul>
        <p className="mt-8 text-center">
          <LandingCta location="pricing">Join the waitlist</LandingCta>
        </p>
      </div>
    </section>
  );
}
