import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
};

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = as === "li" ? motion.li : motion.div;

  return (
    <Tag
      className={className}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

type HeadingProps = {
  id: string;
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  className?: string;
};

export function LandingHeading({ id, eyebrow, title, lede, className }: HeadingProps) {
  return (
    <Reveal className={cn("mx-auto max-w-2xl text-center", className)}>
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-primary/80">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-gothic text-3xl leading-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {lede ? <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{lede}</p> : null}
    </Reveal>
  );
}
