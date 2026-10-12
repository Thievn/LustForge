import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduce(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);
  return reduce;
}

/** Still portrait or an existing Storage loop. No new renders. */
export function HomeWallpaper({ image, video }: { image?: string | null; video?: string | null }) {
  const reduce = useReducedMotion();
  const showVideo = Boolean(video) && !reduce;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {showVideo ? (
        <video src={video!} autoPlay muted loop playsInline className="h-full w-full scale-110 object-cover opacity-50" />
      ) : image ? (
        <img
          src={image}
          alt=""
          className={cn("h-full w-full object-cover opacity-40", !reduce && "lf-kenburns")}
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.35),transparent_55%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/72 to-background" />
    </div>
  );
}
