"use client";

import { motion } from "framer-motion";
import {
  CLASS_MILESTONES,
  UNIT_MAX,
  nextClassMilestone,
  type ScoreAction,
  type UnitId,
  type UnitTheme,
} from "@/lib/game";
import { BlockMatrix } from "@/components/block-matrix";
import { Button } from "@/components/ui/button";

export function UnitCard({
  unit,
  score,
  crosses,
  index,
  onScore,
}: {
  unit: UnitTheme;
  score: number;
  crosses: number;
  index: number;
  onScore: (action: ScoreAction, unitId: UnitId) => void;
}) {
  const percent = Math.max(0, Math.min(100, (score / UNIT_MAX) * 100));
  const next = nextClassMilestone(score);
  const complete = score >= UNIT_MAX;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-3xl border bg-card p-3"
      style={{
        borderColor: `${unit.color}66`,
        boxShadow: `0 5px 0 ${unit.deep}`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none" style={{ color: unit.color }}>
            {unit.code}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-muted-foreground">{unit.zoneLine}</p>
        </div>
        <div className="flex items-end gap-1">
          <p className="font-display text-5xl leading-none tabular-nums">{score}</p>
          <p className="pb-1 font-display text-lg text-muted-foreground tabular-nums">/{UNIT_MAX}</p>
        </div>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: unit.color }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
        />
      </div>

      <div className="mt-2">
        <BlockMatrix score={score} crosses={crosses} color={unit.color} label={unit.code} />
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {CLASS_MILESTONES.map((milestone) => {
          const reached = score >= milestone.points;
          const label = milestone.secret && !reached ? "?" : milestone.short;
          return (
            <div
              key={milestone.points}
              className="rounded-lg px-1 py-1 text-center"
              style={{
                background: reached ? unit.color : "rgba(42,34,24,0.05)",
                color: reached ? unit.ink : "#6b5844",
              }}
            >
              <p className="text-[9px] font-extrabold leading-none">{milestone.points}</p>
              <p className="font-display text-[10px] leading-tight">{label}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-1.5 truncate text-xs text-muted-foreground">
        {crosses > 0 ? `${crosses} cross${crosses === 1 ? "" : "es"} · ` : ""}
        {next
          ? next.secret
            ? `${next.points - score} to a secret takedown`
            : `${next.points - score} to ${next.title}`
          : complete
            ? "Sheet full"
            : `${UNIT_MAX - score} squares left`}
      </p>

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Button
          type="button"
          className="h-12 rounded-xl text-base"
          style={{ background: unit.color, color: unit.ink }}
          disabled={score >= UNIT_MAX}
          onClick={() => onScore("spot", unit.id)}
        >
          +1
        </Button>
        <Button
          type="button"
          className="h-12 rounded-xl text-base"
          style={{ background: unit.deep, color: "#fff7ea" }}
          disabled={score >= UNIT_MAX}
          onClick={() => onScore("surge", unit.id)}
        >
          +3
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-xl border-[#c23b3b]/40 bg-[#c23b3b]/10 text-base text-[#8d1f1f]"
          disabled={score <= 0}
          onClick={() => onScore("strike", unit.id)}
        >
          −1
        </Button>
      </div>
    </motion.article>
  );
}
