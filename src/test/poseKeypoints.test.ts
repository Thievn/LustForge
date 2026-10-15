import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CHAT_POSE_IDS, POSE_IDS } from "../../supabase/functions/_shared/studioPoseIds";
import { POSE_RULES } from "@/lib/phone/poses";
import { POSE_KEYPOINT_NAMES, STUDIO_POSES, poseSkeleton, renderPosePng, type PosePoint, type PoseSkeleton } from "@/lib/studio/poses";
import { TREASURES } from "@/lib/vault/treasures";

const root = process.cwd();

function thumbBytes(id: string): Buffer {
  const path = join(root, "src/assets/pose-thumbs", `${id}.webp.b64`);
  return Buffer.from(readFileSync(path, "utf8").replace(/\s+/g, ""), "base64");
}

function point(pose: PoseSkeleton, name: string): PosePoint {
  const index = POSE_KEYPOINT_NAMES.indexOf(name);
  return pose.keypoints[index] ?? null;
}

function dist(a: [number, number], b: [number, number]) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function kneeAngle(hip: [number, number], knee: [number, number], ankle: [number, number]) {
  const hipSide = [hip[0] - knee[0], hip[1] - knee[1]];
  const ankleSide = [ankle[0] - knee[0], ankle[1] - knee[1]];
  const hipLen = Math.hypot(hipSide[0], hipSide[1]);
  const ankleLen = Math.hypot(ankleSide[0], ankleSide[1]);
  const cos = Math.min(1, Math.max(-1, (hipSide[0] * ankleSide[0] + hipSide[1] * ankleSide[1]) / (hipLen * ankleLen)));
  return (Math.acos(cos) * 180) / Math.PI;
}

function leg(pose: PoseSkeleton, side: "r" | "l") {
  const hip = point(pose, `${side}_hip`);
  const knee = point(pose, `${side}_knee`);
  const ankle = point(pose, `${side}_ankle`);
  if (!hip || !knee || !ankle) throw new Error(`${pose.id} ${side} leg`);
  return { hip, knee, ankle, angle: kneeAngle(hip, knee, ankle), shin: dist(knee, ankle) };
}

/** Chair sits, couch sits, and upright kneels — not knees-up hugs. */
const UPRIGHT_SEATED = [
  "sit_chair",
  "sit_chair_spread",
  "sit_chair_side",
  "sit_edge_peace",
  "sit_floor_cross",
  "bed_sit_edge",
  "chair_backwards",
  "chair_side_drive",
  "couch_sit",
  "counter_sit",
];

const KNEELING = ["kneeling_02", "floor_kneel", "bed_kneel"];

function vaultPoseIds(): string[] {
  const sql = readFileSync(join(root, "supabase/migrations/20261013220000_velvet_bond.sql"), "utf8");
  return [...sql.matchAll(/'(pose-[a-z0-9-]+)','[^']+','pose','[^']+',\d+,'[^']*','([a-z0-9_]+)'/g)].map((match) => match[2]);
}

function chatPoseIds(): string[] {
  const sql = readFileSync(join(root, "supabase/migrations/20261012064734_phone_shell_and_media_archive.sql"), "utf8");
  const block = sql.split("INSERT INTO public.pose_keywords")[1]?.split("ON CONFLICT")[0] ?? "";
  return [...block.matchAll(/\('([a-z0-9_]+)'/g)].map((match) => match[1]);
}

describe("pose skeletons", () => {
  it("resolves every studio, vault, and chat pose to keypoints and a thumbnail", () => {
    const vaultIds = vaultPoseIds();
    const chatIds = chatPoseIds();
    expect(vaultIds).toHaveLength(15);
    expect(chatIds).toEqual([...CHAT_POSE_IDS]);
    expect(POSE_RULES.map((rule) => rule.id)).toEqual([...CHAT_POSE_IDS]);
    const treasureIds = TREASURES.filter((item) => item.kind === "pose").map((item) => item.poseId);
    expect(treasureIds).toEqual(vaultIds);

    const required = [...POSE_IDS, ...vaultIds, ...chatIds, ...POSE_RULES.map((rule) => rule.id)];
    for (const id of required) {
      const pose = poseSkeleton(id);
      expect(pose, id).toBeTruthy();
      expect(pose?.keypoints).toHaveLength(18);
      expect(pose?.keypoints.filter(Boolean).length).toBeGreaterThanOrEqual(17);
      expect(pose?.width === 832 || pose?.width === 1216).toBe(true);
      expect(pose?.height === 832 || pose?.height === 1216).toBe(true);
      const bytes = thumbBytes(id);
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
      expect(bytes.length).toBeGreaterThan(500);
    }

    expect(STUDIO_POSES.map((pose) => pose.id)).toEqual([...POSE_IDS]);
    for (const id of CHAT_POSE_IDS) expect(STUDIO_POSES.some((pose) => pose.id === id)).toBe(false);
  });

  /**
   * Neck-centered, scale-normalized RMS in a shared aspect frame.
   * 0.10 is a limb-or-lean change you can see at thumbnail size. The closest allowed pair must clear it.
   */
  const MIN_DISTINCT_RMS = 0.1;

  function normalizedPose(pose: PoseSkeleton): Array<[number, number] | null> {
    const long = Math.max(pose.width, pose.height);
    const placed = pose.keypoints.map((point) => (point ? ([point[0] * (pose.width / long), point[1] * (pose.height / long)] as [number, number]) : null));
    const neck = placed[1] ?? placed.find((point): point is [number, number] => Boolean(point));
    if (!neck) return placed;
    const centered = placed.map((point) => (point ? ([point[0] - neck[0], point[1] - neck[1]] as [number, number]) : null));
    const present = centered.filter((point): point is [number, number] => Boolean(point));
    const scale = Math.sqrt(present.reduce((sum, point) => sum + point[0] ** 2 + point[1] ** 2, 0) / present.length);
    return centered.map((point) => (point ? ([point[0] / scale, point[1] / scale] as [number, number]) : null));
  }

  function poseRms(a: Array<[number, number] | null>, b: Array<[number, number] | null>) {
    let sum = 0;
    let count = 0;
    let missing = 0;
    for (let i = 0; i < a.length; i++) {
      const left = a[i];
      const right = b[i];
      if (!left || !right) {
        if (Boolean(left) !== Boolean(right)) missing += 1;
        continue;
      }
      sum += (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2;
      count += 1;
    }
    return Math.sqrt(sum / Math.max(1, count)) + missing * 0.15;
  }

  it("rejects poses whose skeletons are too close", () => {
    const ids = [...POSE_IDS, ...CHAT_POSE_IDS];
    const shaped = ids.map((id) => ({ id, points: normalizedPose(poseSkeleton(id)!) }));
    const close: string[] = [];
    for (let i = 0; i < shaped.length; i++) {
      for (let j = i + 1; j < shaped.length; j++) {
        const distance = poseRms(shaped[i].points, shaped[j].points);
        if (distance < MIN_DISTINCT_RMS) close.push(`${shaped[i].id} vs ${shaped[j].id} (${distance.toFixed(3)})`);
      }
    }
    expect(close).toEqual([]);
  });

  it("keeps seated and kneeling poses bent, with hips above the knees", () => {
    for (const id of UPRIGHT_SEATED) {
      const pose = poseSkeleton(id);
      expect(pose, id).toBeTruthy();
      const legs = [leg(pose!, "r"), leg(pose!, "l")];
      expect(legs.every((item) => item.hip[1] < item.knee[1]), id).toBe(true);
      expect(legs.every((item) => item.angle < 160), `${id} knees`).toBe(true);
    }
    for (const id of KNEELING) {
      const pose = poseSkeleton(id);
      expect(pose, id).toBeTruthy();
      const legs = [leg(pose!, "r"), leg(pose!, "l")];
      expect(legs.every((item) => item.hip[1] < item.knee[1]), id).toBe(true);
      expect(legs.every((item) => item.shin < 0.08), `${id} folded`).toBe(true);
    }
  });

  it("draws sit_chair as a portrait OpenPose skeleton", async () => {
    const strokes: Array<{ color: string; y1: number; y2: number }> = [];
    const canvas = {
      width: 0,
      height: 0,
      getContext() {
        return {
          fillStyle: "",
          strokeStyle: "",
          lineWidth: 0,
          lineCap: "butt",
          lineJoin: "miter",
          globalAlpha: 1,
          fillRect() {},
          beginPath() {},
          moveTo(_x: number, y: number) {
            strokes.push({ color: "", y1: y, y2: y });
          },
          lineTo(_x: number, y: number) {
            const last = strokes[strokes.length - 1];
            if (last) last.y2 = y;
          },
          stroke() {
            const last = strokes[strokes.length - 1];
            if (last) last.color = this.strokeStyle;
          },
          arc() {},
          fill() {},
        };
      },
      toDataURL() {
        return "data:image/png;base64,sit-chair";
      },
    };
    const original = document.createElement.bind(document);
    const spy = vi.spyOn(document, "createElement").mockImplementation(((tag: string) => {
      if (tag === "canvas") return canvas;
      return original(tag);
    }) as typeof document.createElement);

    const pose = STUDIO_POSES.find((item) => item.id === "sit_chair");
    const url = await renderPosePng(pose!);
    spy.mockRestore();

    expect(url.startsWith("data:image/png")).toBe(true);
    expect(canvas.width).toBe(832);
    expect(canvas.height).toBe(1216);
    expect(strokes.length).toBeGreaterThanOrEqual(15);
    const hip = point(poseSkeleton("sit_chair")!, "r_hip")!;
    const knee = point(poseSkeleton("sit_chair")!, "r_knee")!;
    expect(hip[1]).toBeLessThan(knee[1]);
    const thigh = strokes.find((stroke) => Math.abs(stroke.y1 - hip[1] * 1216) < 2 && Math.abs(stroke.y2 - knee[1] * 1216) < 2);
    expect(thigh).toBeTruthy();
  });
});
