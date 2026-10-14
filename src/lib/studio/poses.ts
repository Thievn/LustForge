import { POSE_IDS } from "../../../supabase/functions/_shared/studioPoseIds";
import rawKeypoints from "./poseKeypoints.json";

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

export type PosePoint = [number, number] | null;

export type PoseSkeleton = {
  id: string;
  width: number;
  height: number;
  keypoints: PosePoint[];
};

type KeypointFile = {
  names: string[];
  poses: Record<string, { width: number; height: number; points: PosePoint[] }>;
};

const keypoints = rawKeypoints as unknown as KeypointFile;

export const POSE_KEYPOINT_NAMES = keypoints.names;

const SKELETONS = new Map<string, PoseSkeleton>(
  Object.entries(keypoints.poses).map(([id, row]) => [
    id,
    { id, width: row.width, height: row.height, keypoints: row.points },
  ]),
);

/** OpenPose BODY_18 links (0-index). Colours follow the ControlNet annotator. */
const LIMBS: Array<[number, number]> = [
  [1, 2],
  [1, 5],
  [2, 3],
  [3, 4],
  [5, 6],
  [6, 7],
  [1, 8],
  [8, 9],
  [9, 10],
  [1, 11],
  [11, 12],
  [12, 13],
  [1, 0],
  [0, 14],
  [14, 16],
  [0, 15],
  [15, 17],
];

const COLORS = [
  "#ff0000",
  "#ff5500",
  "#ffaa00",
  "#ffff00",
  "#aaff00",
  "#55ff00",
  "#00ff00",
  "#00ff55",
  "#00ffaa",
  "#00ffff",
  "#00aaff",
  "#0055ff",
  "#0000ff",
  "#5500ff",
  "#aa00ff",
  "#ff00ff",
  "#ff00aa",
  "#ff0055",
];

function title(id: string) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function describe(id: string): StudioPose {
  const prefix = id.split("_")[0] ?? "stand";
  const cat = CATS[prefix] ?? "Pose";
  return {
    id,
    name: title(id),
    cat,
    hint: `${title(id)}, full-body shot, whole figure in frame`,
  };
}

export const STUDIO_POSES: StudioPose[] = POSE_IDS.map((id) => describe(id));

export const POSE_CATEGORIES = ["All", ...Array.from(new Set(STUDIO_POSES.map((pose) => pose.cat)))];

export function poseSkeleton(id: string): PoseSkeleton | null {
  return SKELETONS.get(id) ?? null;
}

export function studioPoseById(id: string | null | undefined): StudioPose | null {
  if (!id) return null;
  return STUDIO_POSES.find((pose) => pose.id === id) ?? (SKELETONS.has(id) ? describe(id) : null);
}

export function paintPose(ctx: CanvasRenderingContext2D, skeleton: PoseSkeleton) {
  const { width, height, keypoints: points } = skeleton;
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min(width, height) / 832;
  ctx.lineWidth = Math.max(6, Math.round(12 * scale));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const at = (index: number): [number, number] | null => {
    const point = points[index];
    if (!point) return null;
    return [point[0] * width, point[1] * height];
  };
  ctx.globalAlpha = 0.6;
  LIMBS.forEach(([from, to], index) => {
    const start = at(from);
    const end = at(to);
    if (!start || !end) return;
    ctx.strokeStyle = COLORS[index] ?? "#ffffff";
    ctx.beginPath();
    ctx.moveTo(start[0], start[1]);
    ctx.lineTo(end[0], end[1]);
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  const radius = Math.max(3, Math.round(5 * scale));
  points.forEach((point, index) => {
    if (!point) return;
    const placed = at(index);
    if (!placed) return;
    ctx.fillStyle = COLORS[index] ?? "#ffffff";
    ctx.beginPath();
    ctx.arc(placed[0], placed[1], radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** OpenPose-18 skeleton at the pose's own canvas size (832×1216 or 1216×832). */
export function renderPosePng(pose: StudioPose): Promise<string> {
  const skeleton = poseSkeleton(pose.id);
  if (!skeleton) return Promise.resolve("");
  const canvas = document.createElement("canvas");
  canvas.width = skeleton.width;
  canvas.height = skeleton.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve("");
  paintPose(ctx, skeleton);
  return Promise.resolve(canvas.toDataURL("image/png"));
}

export function renderPosePngForId(id: string): Promise<string> {
  const pose = studioPoseById(id);
  if (!pose) return Promise.resolve("");
  return renderPosePng(pose);
}
