import { POSE_IDS } from "../../../supabase/functions/_shared/studioPoseIds";

const CATS: Record<string, string> = {
  stand: "Standing",
  sit: "Sitting",
  lie: "Reclining",
  bed: "In bed",
  couch: "Couch",
  floor: "Floor",
  yoga: "Yoga",
  dance: "Dance",
  selfie: "Selfie",
  wall: "Wall",
  shower: "Shower",
  bath: "Bath",
  towel: "Towel",
  car: "Car",
  counter: "Counter",
  fours: "All fours",
  back: "From behind",
  t: "Tease",
  g: "Close",
  out: "Outside",
  chair: "Chair",
  gaming: "Lounging",
  squat: "Squat",
};

export type StudioPose = {
  id: string;
  name: string;
  cat: string;
  hint: string;
};

function title(id: string) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export const STUDIO_POSES: StudioPose[] = POSE_IDS.map((id) => {
  const prefix = id.split("_")[0] ?? "stand";
  const cat = CATS[prefix] ?? "Pose";
  return {
    id,
    name: title(id),
    cat,
    hint: `${title(id)}, full-body shot, whole figure in frame`,
  };
});

export const POSE_CATEGORIES = ["All", ...Array.from(new Set(STUDIO_POSES.map((pose) => pose.cat)))];

type Line = { x1: number; y1: number; x2: number; y2: number; color: string };

function hash(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 33 + id.charCodeAt(i)) >>> 0;
  return n;
}

/** Normalized 0–1 stick figure so the pose library is visible without the Lab's PNG pack. */
export function poseLines(pose: StudioPose): Line[] {
  const n = hash(pose.id);
  const lean = ((n % 7) - 3) * 0.02;
  const arm = 0.08 + (n % 5) * 0.015;
  const cat = pose.cat;
  const hipY = cat === "Sitting" || cat === "Chair" || cat === "Couch" || cat === "Lounging" ? 0.62 : cat === "Squat" ? 0.7 : cat === "Reclining" || cat === "In bed" ? 0.48 : 0.52;
  const headY = hipY - 0.28;
  const ground = cat === "Reclining" || cat === "In bed" || cat === "All fours" ? 0.72 : 0.9;
  const cx = 0.5 + lean;
  const knee = cat === "Sitting" || cat === "Chair" || cat === "Couch" ? 0.78 : ground - 0.12;
  const footY = ground;
  const spread = cat === "Dance" ? 0.16 : 0.08;
  const armY = cat === "Yoga" || cat === "Tease" ? headY - 0.02 : headY + arm;
  const lines: Line[] = [
    { x1: cx, y1: headY + 0.06, x2: cx, y2: hipY, color: "#39ff88" },
    { x1: cx, y1: headY + 0.1, x2: cx - 0.16, y2: armY, color: "#ff4d8d" },
    { x1: cx - 0.16, y1: armY, x2: cx - 0.22, y2: armY + 0.12, color: "#ff4d8d" },
    { x1: cx, y1: headY + 0.1, x2: cx + 0.16, y2: armY, color: "#7c5cff" },
    { x1: cx + 0.16, y1: armY, x2: cx + 0.22, y2: armY + 0.12, color: "#7c5cff" },
    { x1: cx, y1: hipY, x2: cx - spread, y2: knee, color: "#3ec6ff" },
    { x1: cx - spread, y1: knee, x2: cx - spread - 0.02, y2: footY, color: "#3ec6ff" },
    { x1: cx, y1: hipY, x2: cx + spread, y2: knee, color: "#ffe14a" },
    { x1: cx + spread, y1: knee, x2: cx + spread + 0.02, y2: footY, color: "#ffe14a" },
  ];
  if (cat === "All fours" || cat === "From behind") {
    return [
      { x1: 0.3, y1: 0.42, x2: 0.62, y2: 0.48, color: "#39ff88" },
      { x1: 0.3, y1: 0.42, x2: 0.22, y2: 0.62, color: "#ff4d8d" },
      { x1: 0.4, y1: 0.44, x2: 0.36, y2: 0.66, color: "#7c5cff" },
      { x1: 0.62, y1: 0.48, x2: 0.58, y2: 0.7, color: "#3ec6ff" },
      { x1: 0.62, y1: 0.48, x2: 0.74, y2: 0.7, color: "#ffe14a" },
    ];
  }
  return lines;
}

export function renderPosePng(pose: StudioPose): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 832;
  canvas.height = 1216;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve("");
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const head = poseLines(pose)[0];
  ctx.beginPath();
  ctx.fillStyle = "#f4f4f5";
  ctx.arc(head.x1 * canvas.width, (head.y1 - 0.08) * canvas.height, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  for (const line of poseLines(pose)) {
    ctx.strokeStyle = line.color;
    ctx.beginPath();
    ctx.moveTo(line.x1 * canvas.width, line.y1 * canvas.height);
    ctx.lineTo(line.x2 * canvas.width, line.y2 * canvas.height);
    ctx.stroke();
  }
  return Promise.resolve(canvas.toDataURL("image/png"));
}
