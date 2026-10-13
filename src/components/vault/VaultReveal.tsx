import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TreasureArt, RARITY_COLOR } from "@/components/vault/TreasureCard";
import type { VaultCategory, VaultRarity } from "@/lib/vault/treasures";

type Phase = "shake" | "heart" | "burst" | "card";

const RAINBOW = ["#ff2d7b", "#a78bfa", "#22d3ee", "#fde68a", "#fb7185", "#f8fafc"];

export function VaultReveal({
  name,
  kind,
  rarity,
  blurb,
  poseId,
  onDone,
}: {
  name: string;
  kind: VaultCategory;
  rarity: VaultRarity;
  blurb: string;
  poseId?: string | null;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduced ? "card" : "shake");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tone = RARITY_COLOR[rarity];
  const obsession = rarity === "obsession";
  const big = rarity === "velvet" || rarity === "forbidden" || obsession;

  useEffect(() => {
    if (phase !== "burst") return;
    try {
      if (rarity === "obsession") navigator.vibrate?.([28, 70, 36, 120, 48]);
      else if (rarity === "forbidden") navigator.vibrate?.([24, 36, 48, 36, 24]);
      else if (rarity === "velvet") navigator.vibrate?.(35);
    } catch {
      /* haptic is optional */
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const count = obsession ? 88 : big ? 54 : 26;
    const speed = obsession ? 18 : big ? 14 : 9;
    const particles = Array.from({ length: count }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.8) * speed,
      life: 1,
      size: 2 + Math.random() * (obsession ? 5.5 : big ? 4 : 2.5),
      color: obsession ? RAINBOW[Math.floor(Math.random() * RAINBOW.length)]! : "",
    }));
    let frame = 0;
    let raf = 0;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.12;
        particle.life -= 0.018;
        ctx.globalAlpha = Math.max(0, particle.life);
        ctx.fillStyle = particle.color || (particle.life > 0.5 ? tone.from : tone.to);
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (frame < (obsession ? 64 : 42)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, big, obsession, rarity, tone.from, tone.to]);

  useEffect(() => {
    if (reduced) return;
    const timers = obsession
      ? [
          window.setTimeout(() => setPhase("heart"), 520),
          window.setTimeout(() => setPhase("burst"), 1880),
          window.setTimeout(() => setPhase("card"), 2680),
        ]
      : [
          window.setTimeout(() => setPhase("burst"), 880),
          window.setTimeout(() => setPhase("card"), 1500),
        ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [reduced, obsession]);

  return (
    <div className={`fixed inset-0 z-[80] grid place-items-center px-4 backdrop-blur-sm ${obsession && phase !== "card" ? "bg-black/95" : "bg-black/75"}`} role="dialog" aria-label="Vault opening">
      <button type="button" className="absolute right-4 top-4 z-10 rounded-full border border-white/20 px-4 py-2 text-sm text-white" onClick={onDone}>
        Skip
      </button>
      {obsession && phase === "heart" ? (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-black"
          animate={{ opacity: [0.35, 0.7, 0.4, 0.8, 0.45] }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
        />
      ) : null}
      {phase === "burst" && obsession ? (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ background: "conic-gradient(from 20deg, #050505, #ff2d7b, #7c3aed, #22d3ee, #fde68a, #050505)" }}
        />
      ) : null}
      {big && !obsession && phase === "burst" ? (
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ background: rarity === "forbidden" ? "#fff6d4" : "#ff4d8d" }}
        />
      ) : null}
      <canvas ref={canvasRef} width={640} height={800} className="pointer-events-none absolute h-[70vh] w-[min(100%,420px)]" />
      {phase !== "card" ? (
        <motion.div
          className={`relative grid place-items-center rounded-[1.6rem] border border-white/20 ${obsession ? "obsession-card h-56 w-44" : "h-48 w-40"}`}
          style={{ background: `linear-gradient(160deg, ${tone.from}, ${tone.to})`, boxShadow: obsession ? undefined : `0 0 40px ${tone.glow}` }}
          animate={
            phase === "heart"
              ? { scale: [1, 1.18, 0.94, 1.24, 1] }
              : phase === "shake"
                ? { rotate: [0, -3, 3, -4, 4, -2, 2, 0], x: [0, -3, 4, -4, 3, 0], scale: [1, 1.02, 1.06] }
                : { scale: [1.05, obsession ? 1.7 : 1.35], opacity: [1, 0] }
          }
          transition={{ duration: phase === "heart" ? 1.25 : phase === "shake" ? 0.88 : 0.45, ease: "easeInOut" }}
        >
          <span className="font-gothic text-3xl text-black/80">LF</span>
          <motion.div
            className="absolute inset-0 rounded-[1.6rem]"
            animate={{ opacity: [0.15, 0.85] }}
            transition={{ duration: 0.88 }}
            style={{ boxShadow: `inset 0 0 40px ${tone.glow}, 0 0 80px ${tone.glow}` }}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ rotateY: 90, opacity: 0, scale: 0.9 }}
          animate={{ rotateY: 0, opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className={obsession ? "w-[min(100%,340px)]" : "w-[min(100%,280px)]"}
          style={{ transformPerspective: 800 }}
        >
          <div className={`overflow-hidden rounded-[1.8rem] border border-white/20 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${obsession ? "obsession-card" : ""}`} style={obsession ? undefined : { boxShadow: `0 20px 70px ${tone.glow}` }}>
            <div className="aspect-[4/5]">
              <TreasureArt kind={kind} rarity={rarity} poseId={poseId} />
            </div>
            <div className="bg-[#12080e] px-4 py-4 text-center">
              <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: tone.from }}>{tone.label}</p>
              <h2 className="font-gothic text-2xl text-white">{name}</h2>
              <p className="mt-1 text-sm text-white/75">{blurb}</p>
              <button type="button" className="mt-4 h-11 w-full rounded-2xl bg-primary font-semibold text-primary-foreground" onClick={onDone}>
                Keep it
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
