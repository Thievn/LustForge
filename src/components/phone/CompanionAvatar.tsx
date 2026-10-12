import { cn } from "@/lib/utils";

export function CompanionAvatar({
  name,
  from,
  to,
  src,
  size = "md",
  presence = "online",
}: {
  name: string;
  from: string;
  to: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  presence?: "online" | "typing" | "idle";
}) {
  const box = size === "lg" ? "h-16 w-16" : size === "sm" ? "h-11 w-11" : "h-14 w-14";
  return (
    <span className={cn("relative inline-flex shrink-0", box)}>
      <span
        className={cn(
          "absolute -inset-1 rounded-[1.15rem]",
          presence === "typing" ? "lf-presence-hot" : presence === "online" ? "lf-presence" : "opacity-0",
        )}
        aria-hidden
      />
      {src ? (
        <img src={src} alt="" className={cn("relative h-full w-full rounded-2xl object-cover ring-2 ring-white/70", box)} />
      ) : (
        <span
          className={cn("relative grid h-full w-full place-items-center rounded-2xl font-gothic text-lg text-white ring-2 ring-white/70", box)}
          style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span
        className={cn(
          "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
          presence === "idle" ? "bg-white/40" : "bg-emerald-400",
        )}
        aria-hidden
      />
    </span>
  );
}
