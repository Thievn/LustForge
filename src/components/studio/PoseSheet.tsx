import { useMemo, useState } from "react";
import { POSE_CATEGORIES, STUDIO_POSES, poseLines, type StudioPose } from "@/lib/studio/poses";
import { Chip, StudioSheet } from "@/components/studio/Sheet";

export function PoseMark({ pose }: { pose: StudioPose }) {
  const lines = poseLines(pose);
  const head = lines[0];
  return (
    <svg viewBox="0 0 100 140" className="h-full w-full" aria-hidden>
      <rect width="100" height="140" fill="#07040c" />
      <circle cx={head.x1 * 100} cy={(head.y1 - 0.08) * 140} r="5" fill="#f4f4f5" />
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1 * 100}
          y1={line.y1 * 140}
          x2={line.x2 * 100}
          y2={line.y2 * 140}
          stroke={line.color}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
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
