import type { ReactNode } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ForgeMomentsBadge, type ForgeMomentsBadgeKind } from "@/components/forge/ForgeMomentsBadge";

export type ForgeMegaSectionProps = {
  value: string;
  title: string;
  subtitle?: string;
  badge?: ForgeMomentsBadgeKind;
  children: ReactNode;
  className?: string;
  borderBottom?: boolean;
  contentClassName?: string;
};

export function ForgeMegaSection({
  value,
  title,
  subtitle,
  badge,
  children,
  className,
  borderBottom = true,
  contentClassName,
}: ForgeMegaSectionProps) {
  return (
    <AccordionItem value={value} className={cn("border-white/10 px-4", !borderBottom && "border-b-0", className)}>
      <AccordionTrigger className="font-gothic text-lg text-white hover:no-underline py-4 [&>svg]:shrink-0">
        <div className="flex flex-col items-start gap-1.5 text-left pr-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span>{title}</span>
            {badge ? <ForgeMomentsBadge kind={badge} /> : null}
          </div>
          {subtitle ? (
            <span className="text-[11px] font-normal font-sans text-muted-foreground normal-case tracking-normal leading-snug max-w-xl">
              {subtitle}
            </span>
          ) : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className={cn("pb-5 space-y-5", contentClassName)}>{children}</AccordionContent>
    </AccordionItem>
  );
}
