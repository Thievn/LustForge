import { Link } from "react-router-dom";
import { Check, ChevronLeft } from "lucide-react";
import { PhoneStage, usePhonePreview } from "@/components/phone/PhoneStage";
import { usePhoneRoster } from "@/lib/phone/usePhoneRoster";
import { CREDIT_COSTS, CREDIT_PACKS, FREE_TIER, PLANS } from "@/lib/phone/pricing";
import { cn } from "@/lib/utils";

export default function PlansView() {
  const preview = usePhonePreview();
  const { limits } = usePhoneRoster(preview);
  const q = preview ? "?preview=1" : "";

  return (
    <PhoneStage layout="app">
      <header className="flex items-center gap-2 px-3 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to={`/dashboard${q}`} className="inline-flex h-11 w-11 items-center justify-center text-primary" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">Passes</p>
          <h1 className="font-gothic text-2xl text-foreground">Plans</h1>
        </div>
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-[max(6rem,env(safe-area-inset-bottom))]">
        <div className="rounded-[1.4rem] border border-primary/30 bg-card/90 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary">On this account</p>
          <p className="mt-1 font-gothic text-3xl capitalize text-foreground">{limits.plan}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {limits.credits} credits · {limits.textsLeft} texts left · {limits.picsLeft} pictures left · {limits.slots} companion slots
          </p>
        </div>

        <article className="rounded-2xl border border-[rgba(42,32,48,0.1)] bg-[#EADFD6] p-7 text-[#2A2030]">
          <h2 className="text-xl font-semibold">Free</h2>
          <ul className="mt-2 space-y-1 text-sm text-[#665670]">
            <li>{FREE_TIER.companions} companion</li>
            <li>{FREE_TIER.textsPerDay} texts a day</li>
            <li>Pictures stay blurred</li>
          </ul>
        </article>

        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "rounded-2xl border bg-[#EADFD6] p-7 text-[#2A2030]",
              plan.id === "blaze" ? "border-2 border-[#D4AF37] shadow-[0_12px_40px_rgba(212,175,55,0.15)]" : "border-[rgba(42,32,48,0.1)]",
              limits.plan === plan.id && "ring-2 ring-[#D6336C]",
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#665670]">{plan.name}</p>
            <p className="mt-1 text-4xl font-semibold">{plan.price}</p>
            <ul className="mt-3 space-y-1.5 text-[15px]">
              {[plan.companions, plan.texts, plan.pictures, ...plan.extras].map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {line}
                </li>
              ))}
            </ul>
            <button type="button" disabled className="mt-4 h-12 w-full rounded-[14px] border border-[rgba(42,32,48,0.28)] px-3 text-sm font-semibold text-[#2A2030] disabled:opacity-70">
              Checkout is not enabled
            </button>
          </article>
        ))}

        <h2 className="font-gothic text-xl text-foreground">Credit packs</h2>
        {CREDIT_PACKS.map((pack) => (
          <article key={pack.id} className="rounded-2xl border border-white/[0.08] bg-card p-6 text-center">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-foreground">{pack.name}</p>
              <p className="text-2xl font-semibold text-foreground">{pack.price}</p>
            </div>
            <p className="text-sm text-muted-foreground">{pack.credits} credits · {pack.note}</p>
            <button type="button" disabled className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">
              Checkout is not enabled
            </button>
          </article>
        ))}

        <p className="pb-4 text-xs leading-relaxed text-muted-foreground">
          Voice is {CREDIT_COSTS.voicePerMinute} credits a minute. An extra picture is {CREDIT_COSTS.extraPicture} credits. 100 extra texts are {CREDIT_COSTS.hundredTexts} credits. Buying a pass is not wired up yet — these numbers are the limits the app already understands.
        </p>
      </div>
    </PhoneStage>
  );
}
