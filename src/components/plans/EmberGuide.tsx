import { EMBER_ACTIONS, EMBER_PACKS, SPOILING_COPY, SPOILING_PAYMENTS_LIVE, spoilingCheckoutHref } from "@/config/spoilingPlans";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function EmberGuide() {
  return (
    <div className="mt-12 space-y-8">
      <section aria-labelledby="embers-do">
        <h2 id="embers-do" className="text-center font-gothic text-2xl text-[#F4EEF2]">
          {SPOILING_COPY.embersTitle}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {EMBER_ACTIONS.map((action) => (
            <li
              key={action.id}
              className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <p className="text-[11px] uppercase tracking-[0.14em] text-[#B8A9BC]">{action.label}</p>
              <p className="mt-1 font-wordmark text-2xl leading-none text-[#D4AF37]">
                {action.amount}
                {action.suffix ? <span className="ml-1 font-sans text-xs font-medium tracking-normal text-[#F4EEF2]">{action.suffix}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="ember-packs">
        <h2 id="ember-packs" className="text-center font-gothic text-2xl text-[#F4EEF2]">
          {SPOILING_COPY.packsTitle}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {EMBER_PACKS.map((pack) => {
            const href = spoilingCheckoutHref(pack.id);
            return (
              <li
                key={pack.id}
                data-pack={pack.id}
                className={cn(
                  "relative flex flex-col rounded-[1.3rem] border bg-[#241820]/80 p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
                  pack.badge ? "border-[#D4AF37]/70 shadow-[0_0_28px_rgba(212,175,55,0.18)]" : "border-white/10",
                )}
              >
                {pack.badge ? (
                  <p className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1B1620]">
                    {pack.badge}
                  </p>
                ) : null}
                <p className="font-wordmark text-3xl text-[#F4EEF2]">{pack.price}</p>
                <p className="mt-1 text-sm text-[#F4EEF2]">{pack.embers} Embers</p>
                <p className="mt-1 min-h-5 text-sm font-semibold text-[#D4AF37]">{pack.bonus}</p>
                {href && SPOILING_PAYMENTS_LIVE ? (
                  <Link to={href} className="mt-3 text-sm font-semibold text-[#F57AA3]">
                    {pack.price}
                  </Link>
                ) : (
                  <button type="button" disabled className="mt-3 min-h-10 cursor-not-allowed rounded-full border border-white/15 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#B8A9BC]">
                    {SPOILING_COPY.comingSoon}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
