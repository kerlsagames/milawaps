"use client";

import { motion } from "framer-motion";
import {
  CLASS_MILESTONES,
  UNIT_MAX,
  nextClassMilestone,
  type UnitTheme,
} from "@/lib/game";
import { BlockMatrix } from "@/components/block-matrix";

export function UnitCard({
  unit,
  score,
  index,
}: {
  unit: UnitTheme;
  score: number;
  index: number;
}) {
  const percent = Math.max(0, Math.min(100, (score / UNIT_MAX) * 100));
  const next = nextClassMilestone(score);
  const complete = score >= UNIT_MAX;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-[28px] border bg-card/95 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.25)] sm:p-5"
      style={{
        borderColor: `${unit.color}66`,
        boxShadow: `0 8px 0 ${unit.deep}, 0 18px 40px rgba(0,0,0,0.25)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="font-display text-3xl leading-none tracking-tight sm:text-4xl"
            style={{ color: unit.color }}
          >
            {unit.code}
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">{unit.name}</p>
          <p className="mt-0.5 max-w-[16rem] text-sm leading-snug text-muted-foreground">
            {unit.zoneLine}
          </p>
        </div>
        {complete && (
          <span
            className="rotate-[-8deg] rounded-full border-2 px-2.5 py-1 font-display text-xs tracking-wide uppercase"
            style={{ color: unit.color, borderColor: unit.color }}
          >
            Track full
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="font-display text-7xl leading-none tracking-tight tabular-nums sm:text-8xl">
          {score}
        </p>
        <p className="pb-1 font-display text-2xl text-muted-foreground tabular-nums">/ {UNIT_MAX}</p>
      </div>

      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: unit.color }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
        />
      </div>

      <div className="mt-4">
        <BlockMatrix score={score} color={unit.color} label={unit.code} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5">
        {CLASS_MILESTONES.map((milestone) => {
          const reached = score >= milestone.points;
          return (
            <div
              key={milestone.points}
              className="rounded-xl px-2 py-1.5 text-center"
              style={{
                background: reached ? unit.color : "rgba(255,255,255,0.04)",
                color: reached ? unit.ink : "#b7c0d6",
              }}
            >
              <p className="text-[10px] font-extrabold tracking-wide uppercase">{milestone.points}</p>
              <p className="font-display text-[11px] leading-tight sm:text-xs">{milestone.short}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {next ? `${next.points - score} to ${next.short}.` : "Every space on this track is lit."}
      </p>
    </motion.article>
  );
}
