import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SPOILING_COPY } from "@/config/spoilingPlans";
import { BillingCadenceSwitch, type BillingCadence } from "@/components/plans/BillingCadenceSwitch";
import { EmberGuide } from "@/components/plans/EmberGuide";
import { SpoilingPlanDeck } from "@/components/plans/SpoilingPlanDeck";

export default function PlansView() {
  const [params] = useSearchParams();
  const preview = params.get("preview") === "1";
  const welcome = params.get("welcome") === "1";
  const [cadence, setCadence] = useState<BillingCadence>("monthly");
  const continueTo = preview ? "/dashboard?preview=1" : "/dashboard";

  return (
    <div className="relative min-w-0 bg-[#1B1620] pb-28 pt-6 text-[#F4EEF2] xl:px-6 xl:pb-16 xl:pt-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,rgba(214,51,108,0.28),rgba(192,38,211,0.08)_42%,transparent_68%)]" />
      <div className="relative mx-auto max-w-6xl">
        <div className="px-4 xl:px-0">
          {welcome ? (
            <p className="mx-auto mb-4 w-fit rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 px-4 py-1.5 text-center text-sm text-[#F8E7B0]">
              {SPOILING_COPY.welcome}
            </p>
          ) : null}
          <header className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance font-gothic text-[1.7rem] leading-tight text-[#F4EEF2] sm:text-4xl">{SPOILING_COPY.header}</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#B8A9BC] sm:text-base">{SPOILING_COPY.subline}</p>
          </header>
          <div className="mt-6">
            <BillingCadenceSwitch cadence={cadence} onChange={setCadence} />
          </div>
        </div>
        <div className="mt-4">
          <SpoilingPlanDeck continueTo={continueTo} />
        </div>
        <div className="px-4 xl:px-0">
          <EmberGuide />
          <footer className="mx-auto mt-10 max-w-lg space-y-3 pb-2 text-center">
            <p className="text-sm leading-relaxed text-[#F4EEF2]">{SPOILING_COPY.reassurance}</p>
            <p className="text-sm text-[#B8A9BC]">{SPOILING_COPY.changeAnytime}</p>
            <p>
              <Link to={continueTo} className="text-sm font-semibold text-[#F57AA3] underline decoration-[#D6336C]/60 underline-offset-4">
                {SPOILING_COPY.continueFree}
              </Link>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
