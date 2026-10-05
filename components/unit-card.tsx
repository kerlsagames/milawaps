"use client";

import { motion } from "framer-motion";
import { UNIT_MAX, type ScoreAction, type UnitId, type UnitTheme } from "@/lib/game";
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

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="@container relative flex flex-col overflow-hidden rounded-3xl border bg-card"
      style={{
        borderColor: `${unit.color}66`,
        boxShadow: `0 5px 0 ${unit.deep}`,
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-3 py-2.5 lg:px-4 lg:py-4"
        style={{ background: unit.color, color: unit.ink }}
      >
        <div className="min-w-0">
          <p
            className="font-display text-[2.65rem] leading-none whitespace-nowrap lg:text-[length:min(8.5rem,calc((100cqi-8rem)/3))] lg:leading-[0.78]"
            style={{
              letterSpacing: "-0.04em",
              textShadow: `0 4px 0 ${unit.deep}`,
            }}
          >
            {unit.code}
          </p>
        </div>
        <div
          className="grid size-14 shrink-0 place-items-center rounded-full bg-[#fffdf8] shadow-[0_3px_0_rgba(42,28,4,0.28)] lg:size-24 lg:shadow-[0_4px_0_rgba(42,28,4,0.28)]"
          aria-label={`${unit.code} tally ${score}`}
        >
          <p className="font-display text-3xl leading-none tabular-nums lg:text-5xl">{score}</p>
        </div>
      </div>

      <div className="flex flex-col p-2 pt-2 lg:p-3 lg:pt-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-black/10 lg:h-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: unit.color }}
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
        />
      </div>

      <div className="mt-2 hidden lg:block">
        <BlockMatrix score={score} crosses={crosses} color={unit.color} label={unit.code} />
      </div>

      {crosses > 0 ? (
        <p className="mt-1.5 truncate text-xs text-muted-foreground lg:mt-2">
          {crosses} cross{crosses === 1 ? "" : "es"}
        </p>
      ) : null}

      <div className="mt-2 grid grid-cols-3 gap-1.5">
        <Button
          type="button"
          className="h-14 rounded-xl text-lg lg:h-12 lg:text-base"
          style={{ background: unit.color, color: unit.ink }}
          disabled={score >= UNIT_MAX}
          onClick={() => onScore("spot", unit.id)}
        >
          +1
        </Button>
        <Button
          type="button"
          className="h-14 rounded-xl text-lg lg:h-12 lg:text-base"
          style={{ background: unit.deep, color: "#fff7ea" }}
          disabled={score >= UNIT_MAX}
          onClick={() => onScore("surge", unit.id)}
        >
          +2
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 rounded-xl border-[#c23b3b]/40 bg-[#c23b3b]/10 text-lg text-[#8d1f1f] lg:h-12 lg:text-base"
          disabled={score <= 0}
          onClick={() => onScore("strike", unit.id)}
        >
          −1
        </Button>
      </div>
      </div>
    </motion.article>
  );
}
