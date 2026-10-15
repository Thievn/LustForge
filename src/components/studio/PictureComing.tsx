import { studioMood } from "@/lib/studio/copy";

/** Soft hold on her picture while an edit finishes. */
export function PictureComing({ src, status, dense }: { src?: string | null; status?: string | null; dense?: boolean }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[1.4rem] border border-primary/25 bg-[#140f18]">
      {src ? <img src={src} alt="" className="h-full w-full object-cover opacity-80" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#140f18] via-[#140f18]/20 to-[#140f18]/30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(214,51,108,0.18),transparent_58%)]" />
      <div className="vault-sheen pointer-events-none absolute inset-0" />
      <p className={dense
        ? "absolute inset-x-1 bottom-2 text-center text-[10px] leading-tight tracking-wide text-primary"
        : "absolute inset-x-3 bottom-4 text-center text-sm tracking-wide text-primary"}>
        {studioMood(status)}
      </p>
    </div>
  );
}
