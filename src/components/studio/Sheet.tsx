import { useEffect, type ReactNode } from "react";

export function StudioSheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/55" onClick={onClose}>
      <div
        role="dialog"
        aria-label={title}
        className="max-h-[86%] w-full overflow-hidden rounded-t-[1.6rem] border border-white/15 bg-card/95 shadow-[0_-20px_60px_hsl(var(--primary)/0.25)] backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 pb-2 pt-3">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-white/25" />
        </div>
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="font-gothic text-xl text-foreground">{title}</h2>
          <button type="button" className="h-11 w-11 text-lg text-muted-foreground" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto px-4 pb-3">{children}</div>
        {footer ? <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Chip({
  on,
  children,
  onClick,
}: {
  on: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3 py-2 text-sm ${
        on
          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.35)]"
          : "border-border bg-card/80 text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
