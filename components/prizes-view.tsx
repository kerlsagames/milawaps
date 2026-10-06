"use client";

import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { useDeskPrefs, type RevealMap } from "@/lib/desk-prefs";
import {
  CLASS_MILESTONES,
  UNITS,
  nextClassMilestone,
  type Milestone,
  type PublicBoard,
  type UnitTheme,
} from "@/lib/game";
import { Countdown } from "@/components/countdown";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";

const HIGHEST = CLASS_MILESTONES[CLASS_MILESTONES.length - 1]?.points ?? 60;
const NODE = "var(--node)";

function namedPrize(points: number, reveals: RevealMap, now: number) {
  const reveal = revealForPoints(points);
  return prizeIsPublic(reveal ? reveals[reveal.id]?.at : null, now);
}

export function PrizesView({ board }: { board: PublicBoard }) {
  const prefs = useDeskPrefs();
  const now = Date.now();

  return (
    <div className="flex flex-col gap-3 lg:h-full">
      <header className="flex shrink-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">Follow the path</p>
          <h2 className="font-display text-3xl leading-none lg:text-5xl">Prizes</h2>
          <p className="mt-0.5 text-sm font-extrabold text-[#5c4a32] lg:mt-1 lg:text-2xl">
            Unlock prizes as you get more ticks.
          </p>
        </div>
        <Countdown />
      </header>

      <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        {UNITS.map((unit) => (
          <ClassPath
            key={unit.id}
            unit={unit}
            score={board.units[unit.id]}
            reveals={prefs.reveals}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}

function ClassPath({
  unit,
  score,
  reveals,
  now,
}: {
  unit: UnitTheme;
  score: number;
  reveals: RevealMap;
  now: number;
}) {
  const fraction = pathFraction(score);

  return (
    <section
      className="flex flex-1 items-center gap-1.5 rounded-2xl border-4 bg-card px-1.5 py-2 lg:gap-3 lg:rounded-[28px] lg:px-3 lg:py-3"
      style={{ borderColor: unit.color }}
    >
      <div
        className="flex shrink-0 flex-col items-center justify-center gap-1 self-stretch rounded-2xl px-1.5 py-1.5 lg:gap-2 lg:rounded-3xl lg:px-2 lg:py-2"
        style={{ background: unit.color, color: unit.ink }}
      >
        <p className="font-display text-lg leading-none whitespace-nowrap lg:text-3xl">{unit.code}</p>
        <p
          className="grid size-10 place-items-center rounded-full bg-[#fffdf8] font-display text-xl leading-none tabular-nums shadow-[0_3px_0_rgba(42,28,4,0.28)] lg:size-[4.25rem] lg:text-4xl"
          aria-label={`${unit.code} tally ${score}`}
        >
          {score}
        </p>
      </div>

      <div className="relative min-w-0 flex-1 overflow-x-auto [--node:2.15rem] [--stop:2.4rem] lg:overflow-visible lg:[--node:clamp(3.4rem,10vh,6.25rem)] lg:[--stop:5rem]">
        <div className="relative min-w-[16.8rem] lg:min-w-0">
        <div
          className="absolute h-3 -translate-y-1/2 rounded-full bg-[#f3e2c0] lg:h-4"
          style={{ top: `calc(${NODE} / 2)`, left: "calc(var(--stop) / 2)", right: "calc(var(--stop) / 2)" }}
        />
        <motion.div
          className="absolute h-3 -translate-y-1/2 rounded-full lg:h-4"
          style={{ top: `calc(${NODE} / 2)`, left: "calc(var(--stop) / 2)", background: unit.color }}
          initial={false}
          animate={{ width: `calc((100% - var(--stop)) * ${fraction})` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <span
          className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow lg:size-7 lg:border-4"
          style={{
            top: `calc(${NODE} / 2)`,
            left: `calc(var(--stop) / 2 + (100% - var(--stop)) * ${fraction})`,
            background: unit.color,
          }}
          aria-hidden="true"
        />
        <ol className="relative flex items-start justify-between">
          <li className="flex w-[var(--stop)] flex-col items-center text-center">
            <div
              className="grid place-items-center rounded-full border-4 bg-[#fffdf8]"
              style={{
                width: NODE,
                height: NODE,
                borderColor: "rgba(42,34,24,0.12)",
              }}
            >
              <span className="size-3 rounded-full" style={{ background: unit.deep }} />
            </div>
            <p className="mt-1 text-xs leading-none font-extrabold tabular-nums lg:mt-1.5 lg:text-sm">0</p>
            <p className="hidden text-xs leading-tight font-bold text-muted-foreground lg:block lg:text-sm">Start</p>
          </li>
          {CLASS_MILESTONES.map((milestone) => (
            <Stop
              key={milestone.points}
              milestone={milestone}
              score={score}
              unit={unit}
              named={namedPrize(milestone.points, reveals, now)}
              art={revealForPoints(milestone.points)?.image ?? ""}
            />
          ))}
        </ol>
        </div>
      </div>
    </section>
  );
}

function Stop({
  milestone,
  score,
  unit,
  named,
  art,
}: {
  milestone: Milestone;
  score: number;
  unit: UnitTheme;
  named: boolean;
  art: string;
}) {
  const reached = score >= milestone.points;
  const title = named ? milestone.short : "";
  const next = nextClassMilestone(score);
  const aiming = next?.points === milestone.points;

  return (
    <li className="flex w-[var(--stop)] flex-col items-center text-center">
      <div
        className="grid place-items-center overflow-hidden rounded-full border-4"
        style={{
          width: NODE,
          height: NODE,
          background: named ? "#efe6d6" : "#2a1c04",
          color: named ? unit.ink : "#ffe08a",
          borderColor: aiming ? unit.deep : reached && named ? unit.deep : "rgba(42,34,24,0.12)",
          boxShadow: aiming ? `0 0 0 4px ${unit.color}` : undefined,
        }}
      >
        {named && art ? (
          <img src={art} alt="" className="size-full object-cover" />
        ) : (
          <LockKeyhole className="size-4 lg:size-9" />
        )}
      </div>
      <p className="mt-1 text-xs leading-none font-extrabold tabular-nums lg:mt-1.5 lg:text-sm">{milestone.points}</p>
      <p className="hidden text-xs leading-tight font-bold text-muted-foreground lg:block lg:text-sm">{title}</p>
    </li>
  );
}

function pathFraction(score: number) {
  const points = [0, ...CLASS_MILESTONES.map((milestone) => milestone.points)];
  if (score <= 0) return 0;
  if (score >= HIGHEST) return 1;
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (score <= end) {
      const local = (score - start) / (end - start);
      return (index + local) / (points.length - 1);
    }
  }
  return 1;
}
