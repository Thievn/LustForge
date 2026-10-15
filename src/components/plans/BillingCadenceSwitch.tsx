import { SPOILING_COPY } from "@/config/spoilingPlans";
import { cn } from "@/lib/utils";

export type BillingCadence = "monthly" | "yearly";

export function BillingCadenceSwitch({
  cadence,
  onChange,
}: {
  cadence: BillingCadence;
  onChange: (next: BillingCadence) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex rounded-full border border-white/10 bg-black/35 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        {(["monthly", "yearly"] as const).map((value) => {
          const selected = cadence === value;
          const label = value === "monthly" ? SPOILING_COPY.monthly : SPOILING_COPY.yearly;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              data-cadence={value}
              onClick={() => onChange(value)}
              className={cn(
                "min-h-11 min-w-[7.25rem] rounded-full px-4 text-sm font-semibold transition",
                selected
                  ? "bg-gradient-to-r from-[#D6336C] to-[#C026D3] text-white shadow-[0_8px_22px_rgba(214,51,108,0.35)]"
                  : "text-[#B8A9BC] hover:text-[#F4EEF2]",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {cadence === "yearly" ? (
        <p data-yearly-note className="text-sm font-medium tracking-wide text-[#D4AF37]">
          {SPOILING_COPY.yearlyNote}
        </p>
      ) : null}
    </div>
  );
}
