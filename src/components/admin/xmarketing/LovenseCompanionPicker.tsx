import { ExternalLink } from "lucide-react";
import type { DbCompanion } from "@/hooks/useCompanions";
import { galleryStaticPortraitUrl } from "@/lib/companionMedia";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  roster: DbCompanion[];
  loading?: boolean;
  value: string;
  onChange: (id: string) => void;
  siteOrigin: string;
  selected: DbCompanion | null;
};

function CompanionAvatar({ companion, size = "sm" }: { companion: DbCompanion; size?: "sm" | "md" }) {
  const src = galleryStaticPortraitUrl(companion, companion.id);
  const dim = size === "md" ? "h-10 w-10" : "h-7 w-7";
  return src ? (
    <img
      src={src}
      alt=""
      className={cn(dim, "shrink-0 rounded-full object-cover border border-white/10 bg-black/40")}
    />
  ) : (
    <span
      className={cn(
        dim,
        "shrink-0 rounded-full border border-white/10 bg-gradient-to-br from-[#D6336C]/30 to-purple-900/40 flex items-center justify-center text-[10px] font-bold text-white/70",
      )}
    >
      {companion.name.charAt(0).toUpperCase()}
    </span>
  );
}

export function LovenseCompanionPicker({ roster, loading, value, onChange, siteOrigin, selected }: Props) {
  const profileHref = selected ? `${siteOrigin.replace(/\/$/, "")}/companions/${selected.id}` : null;

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="mt-1 h-auto min-h-10 py-1.5">
          <SelectValue placeholder="Pick companion">
            {selected ? (
              <span className="flex items-center gap-2.5 min-w-0">
                <CompanionAvatar companion={selected} size="md" />
                <span className="truncate text-sm font-medium">{selected.name}</span>
              </span>
            ) : null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[min(360px,50vh)]">
          {roster.slice(0, 120).map((c) => (
            <SelectItem key={c.id} value={c.id} className="py-2">
              <span className="flex items-center gap-2.5 min-w-0">
                <CompanionAvatar companion={c} />
                <span className="truncate">{c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && profileHref ? (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-black/30 px-2.5 py-2">
          <CompanionAvatar companion={selected} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground/90 truncate">{selected.name}</p>
            {selected.tagline ? (
              <p className="text-[10px] text-muted-foreground truncate">{selected.tagline}</p>
            ) : null}
          </div>
          <a
            href={profileHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
          >
            Profile
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
