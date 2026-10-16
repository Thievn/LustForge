import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import {
  SPOILING_COPY,
  SPOILING_PAYMENTS_LIVE,
  spoilingCheckoutHref,
  type SpoilingPlan,
} from "@/config/spoilingPlans";
import { cn } from "@/lib/utils";

const FRAME: Record<SpoilingPlan["id"], string> = {
  free: "from-white/30 via-white/10 to-white/5",
  spark: "from-[#F9A8C8] via-[#D6336C]/70 to-[#1B1620]",
  forge: "from-[#F8E7B0] via-[#D6336C] to-[#E879F9]",
  inferno: "from-[#F0ABFC] via-[#D6336C] to-[#6B2148]",
};

export function SpoilingPlanCard({
  plan,
  centered,
  continueTo,
}: {
  plan: SpoilingPlan;
  centered: boolean;
  continueTo: string;
}) {
  const href = plan.id === "free" ? continueTo : spoilingCheckoutHref(plan.id);
  const paidLive = plan.id !== "free" && SPOILING_PAYMENTS_LIVE && Boolean(href);

  return (
    <article
      data-plan={plan.id}
      data-centered={centered ? "true" : "false"}
      data-highlighted={plan.highlighted ? "true" : "false"}
      className={cn(
        "relative flex h-full snap-center flex-col rounded-[1.55rem] bg-gradient-to-b p-px transition duration-300 motion-reduce:transition-none",
        FRAME[plan.id],
        plan.highlighted && "shadow-[0_0_42px_rgba(214,51,108,0.38)]",
        centered ? "z-10 scale-100 opacity-100" : "scale-[0.94] opacity-80 xl:scale-100 xl:opacity-100",
      )}
    >
      {plan.badge ? (
        <p className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-[#D4AF37]/80 bg-[#1B1620] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.45)]">
          {plan.badge}
        </p>
      ) : null}
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-[1.5rem] px-4 py-5 sm:px-5",
          plan.highlighted
            ? "bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(212,175,55,0.2),transparent_42%),radial-gradient(90%_60%_at_100%_0%,rgba(214,51,108,0.35),transparent_50%),linear-gradient(180deg,#3A1C32_0%,#1B1620_72%)]"
            : "bg-[radial-gradient(90%_50%_at_50%_-10%,rgba(214,51,108,0.2),transparent_46%),linear-gradient(180deg,#2A1826_0%,#1B1620_70%)]",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/15 to-transparent" />
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <p className="relative font-wordmark text-xl text-[#F4EEF2]">{plan.name}</p>
        <p className="relative mt-2 flex items-end gap-1 text-[#F4EEF2]">
          <span className={cn("font-wordmark text-4xl leading-none", plan.highlighted && "text-[#D4AF37]")}>{plan.price}</span>
          {plan.perMonth ? <span className="pb-1 text-sm text-[#B8A9BC]">/month</span> : null}
        </p>
        <p className="relative mt-2 text-sm italic text-[#F57AA3]">{plan.tagline}</p>
        {plan.inherits ? <p className="relative mt-4 text-sm font-medium text-[#F4EEF2]">{plan.inherits}</p> : null}
        <ul className={cn("relative space-y-2 text-[13px] leading-snug text-[#F4EEF2]", plan.inherits ? "mt-2" : "mt-4")}>
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#D4AF37]" aria-hidden="true" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {plan.id === "free" || paidLive ? (
          <Link
            to={href ?? continueTo}
            className="relative mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#D4AF37]/50 bg-white/5 px-3 text-sm font-semibold text-[#F4EEF2] transition hover:bg-white/10"
          >
            {plan.button}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="relative mt-5 inline-flex min-h-12 w-full cursor-not-allowed flex-col items-center justify-center rounded-full bg-gradient-to-r from-[#D6336C] to-[#C026D3] px-3 py-2 text-sm font-semibold text-white opacity-80 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
          >
            <span>{plan.button}</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/80">{SPOILING_COPY.comingSoon}</span>
          </button>
        )}
      </div>
    </article>
  );
}
