import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LANDING_FAQ } from "@/data/landingFaq";
import { LandingHeading } from "@/components/landing/Reveal";

export function LandingFaq() {
  return (
    <section id="faq" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl">
        <LandingHeading
          id="faq-heading"
          eyebrow="FAQ"
          title="Questions"
          lede="Short answers. The policies have the longer version."
        />
        <Accordion type="single" collapsible className="mt-8 rounded-[1.4rem] border border-[#f1c45e]/20 bg-white/[0.04] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] sm:px-6">
          {LANDING_FAQ.map((item) => (
            <AccordionItem key={item.id} value={item.id} className="border-border">
              <AccordionTrigger className="text-left font-gothic text-base font-normal text-foreground hover:no-underline sm:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
