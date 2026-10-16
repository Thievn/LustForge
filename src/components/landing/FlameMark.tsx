import { cn } from "@/lib/utils";

/** Brand flame from public/icon-source.svg. */
export function FlameMark({ className }: { className?: string }) {
  return (
    <img
      src="/icon-source.svg"
      alt=""
      className={cn(
        "h-9 w-9 rounded-[0.7rem] shadow-[0_0_18px_rgba(224,40,127,0.42)] ring-1 ring-[#f1c45e]/40",
        className,
      )}
    />
  );
}
