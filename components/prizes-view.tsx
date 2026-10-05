"use client";

import { motion } from "framer-motion";
import { Crosshair, Crown, IceCreamCone, LockKeyhole } from "lucide-react";
import {
  CLASS_MILESTONES,
  UNITS,
  nextClassMilestone,
  type Milestone,
  type PublicBoard,
  type UnitTheme,
} from "@/lib/game";

const HIGHEST = CLASS_MILESTONES[CLASS_MILESTONES.length - 1]?.points ?? 50;
const NODE = "clamp(3.4rem, 10vh, 6.25rem)";

export function PrizesView({ board }: { board: PublicBoard }) {
  return (
    <div className="flex flex-col gap-3 lg:h-full">
      <header className="shrink-0">
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">Follow the path</p>
        <h2 className="font-display text-4xl leading-none sm:text-5xl">The highest honour</h2>
      </header>

      <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
        {UNITS.map((unit) => (
          <ClassPath key={unit.id} unit={unit} score={board.units[unit.id]} />
        ))}
      </div>
    </div>
  );
}

function ClassPath({ unit, score }: { unit: UnitTheme; score: number }) {
  const next = nextClassMilestone(score);
  const status = !next
    ? "At the honour"
    : next.secret
      ? `${next.points - score} to the next stop`
      : `${next.points - score} to ${next.title}`;
  const fraction = pathFraction(score);

  return (
    <section
      className="flex flex-1 items-center gap-3 rounded-[28px] border-4 bg-card px-3 py-3 sm:gap-4 sm:px-4"
      style={{ borderColor: unit.color }}
    >
      <div
        className="grid w-[5.5rem] shrink-0 place-items-center self-stretch rounded-3xl px-1 py-3 text-center sm:w-36"
        style={{ background: unit.color, color: unit.ink }}
      >
        <div>
          <p className="font-display text-3xl leading-none sm:text-5xl">{unit.code}</p>
          <p className="mt-2 font-display text-4xl leading-none tabular-nums sm:text-6xl">{score}</p>
        </div>
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          className="absolute right-5 left-5 h-4 -translate-y-1/2 rounded-full bg-[#f3e2c0]"
          style={{ top: `calc(${NODE} / 2)` }}
        />
        <motion.div
          className="absolute left-5 h-4 -translate-y-1/2 rounded-full"
          style={{ top: `calc(${NODE} / 2)`, background: unit.color }}
          initial={false}
          animate={{ width: `calc((100% - 2.5rem) * ${fraction})` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        <span
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow"
          style={{
            top: `calc(${NODE} / 2)`,
            left: `calc(1.25rem + (100% - 2.5rem) * ${fraction})`,
            background: unit.color,
          }}
          aria-hidden="true"
        />
        <ol className="relative grid grid-cols-7 gap-1">
          {CLASS_MILESTONES.map((milestone, index) => (
            <Stop
              key={milestone.points}
              milestone={milestone}
              score={score}
              unit={unit}
              last={index === CLASS_MILESTONES.length - 1}
            />
          ))}
        </ol>
        <p className="mt-2 text-center text-sm font-extrabold sm:text-base" style={{ color: unit.deep }}>
          {status}
        </p>
      </div>
    </section>
  );
}

function Stop({
  milestone,
  score,
  unit,
  last,
}: {
  milestone: Milestone;
  score: number;
  unit: UnitTheme;
  last: boolean;
}) {
  const reached = score >= milestone.points;
  const secret = milestone.secret && !reached && !last;
  const title = last
    ? "Honour"
    : secret
      ? "Secret"
      : milestone.points === 20
        ? "Laser"
        : milestone.points === 35
          ? "Ice cream"
          : milestone.short;
  const Icon = last ? Crown : milestone.points === 35 ? IceCreamCone : milestone.points === 20 ? Crosshair : LockKeyhole;
  const next = nextClassMilestone(score);
  const aiming = next?.points === milestone.points;

  return (
    <li className="flex flex-col items-center text-center">
      <div
        className="grid place-items-center rounded-full border-4"
        style={{
          width: NODE,
          height: NODE,
          background: reached ? (last ? "#2a1c04" : unit.color) : secret ? "#2a1c04" : "#fffdf8",
          color: reached ? (last ? "#ffe08a" : unit.ink) : secret ? "#ffe08a" : "#6b5844",
          borderColor: aiming ? unit.deep : reached ? unit.deep : "rgba(42,34,24,0.12)",
          boxShadow: aiming ? `0 0 0 4px ${unit.color}` : undefined,
        }}
      >
        <Icon className="size-7 sm:size-9" />
      </div>
      <p className="mt-1.5 text-sm leading-none font-extrabold tabular-nums">{milestone.points}</p>
      <p className="text-xs leading-tight font-bold text-muted-foreground sm:text-sm">{title}</p>
    </li>
  );
}

function pathFraction(score: number) {
  const points = CLASS_MILESTONES.map((milestone) => milestone.points);
  const slots = points.length;
  if (score <= 0) return 0;
  if (score >= HIGHEST) return 1;
  if (score < points[0]) return (score / points[0]) * (0.5 / slots);
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    if (score <= end) {
      const local = (score - start) / (end - start);
      const from = (index + 0.5) / slots;
      const to = (index + 1.5) / slots;
      return from + local * (to - from);
    }
  }
  return 1;
}
