import { useMemo, useState } from "react";
import { POSE_CATEGORIES, STUDIO_POSES, type StudioPose } from "@/lib/studio/poses";
import { poseThumbUrl } from "@/lib/studio/poseThumbs";
import { Chip, StudioSheet } from "@/components/studio/Sheet";

export function PoseMark({ pose }: { pose: StudioPose }) {
  const src = poseThumbUrl(pose.id);
  if (!src) return <div className="h-full w-full bg-black" />;
  return <img src={src} alt="" className="h-full w-full bg-black object-contain" />;
}

export function PoseSheet({
  open,
  selected,
  onClose,
  onPick,
}: {
  open: boolean;
  selected: string | null;
  onClose: () => void;
  onPick: (pose: StudioPose | null) => void;
}) {
  const [cat, setCat] = useState("All");
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () =>
      STUDIO_POSES.filter((pose) => (cat === "All" || pose.cat === cat) && pose.name.toLowerCase().includes(query.trim().toLowerCase())),
    [cat, query],
  );
  return (
    <StudioSheet
      open={open}
      title="Pose"
      onClose={onClose}
      footer={
        <button type="button" className="h-12 w-full rounded-2xl border border-border text-sm" onClick={() => onPick(null)}>
          No pose
        </button>
      }
    >
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search poses"
        className="mb-3 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm"
      />
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        {POSE_CATEGORIES.map((item) => (
          <Chip key={item} on={cat === item} onClick={() => setCat(item)}>
            {item}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {visible.map((pose) => (
          <button
            key={pose.id}
            type="button"
            onClick={() => onPick(pose)}
            className={`overflow-hidden rounded-2xl border text-left ${selected === pose.id ? "border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]" : "border-border"}`}
          >
            <div className="aspect-[3/4] bg-black">
              <PoseMark pose={pose} />
            </div>
            <p className="truncate px-2 py-1.5 text-[11px] text-foreground">{pose.name}</p>
          </button>
        ))}
      </div>
    </StudioSheet>
  );
}
