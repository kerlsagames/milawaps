"use client";

import Image from "next/image";
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

export function PrizesView({ board }: { board: PublicBoard }) {
  return (
    <div className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">
            Follow the path
          </p>
          <h2 className="font-display text-3xl leading-none sm:text-4xl">The highest honour</h2>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <Image
            src="/mystery-teacher-a.jpg"
            alt="A mystery teacher, face hidden."
            width={56}
            height={56}
            className="size-11 rounded-full border-2 border-[#f5b942] object-cover"
          />
          <Image
            src="/mystery-teacher-b.jpg"
            alt="Another mystery teacher, face hidden."
            width={56}
            height={56}
            className="size-11 rounded-full border-2 border-[#f5b942] object-cover"
          />
        </div>
      </header>

      {UNITS.map((unit) => (
        <ClassPath key={unit.id} unit={unit} score={board.units[unit.id]} />
      ))}
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
      className="rounded-3xl border bg-card px-2 py-2 sm:px-3"
      style={{ borderColor: `${unit.color}88` }}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <div
          className="grid w-[4.6rem] shrink-0 place-items-center rounded-2xl px-1 py-2 text-center sm:w-24"
          style={{ background: unit.color, color: unit.ink }}
        >
          <p className="font-display text-2xl leading-none sm:text-3xl">{unit.code}</p>
          <p className="mt-1 font-display text-xl leading-none tabular-nums">{score}</p>
        </div>

        <div className="relative min-w-0 flex-1">
          <div className="absolute top-[1.15rem] right-3 left-3 h-2 rounded-full bg-[#f3e2c0] sm:top-5" />
          <motion.div
            className="absolute top-[1.15rem] left-3 h-2 rounded-full sm:top-5"
            style={{ background: unit.color }}
            initial={false}
            animate={{ width: `calc((100% - 1.5rem) * ${fraction})` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
          <span
            className="absolute top-[0.7rem] size-5 -translate-x-1/2 rounded-full border-2 border-white shadow sm:top-[1.15rem]"
            style={{
              left: `calc(0.75rem + (100% - 1.5rem) * ${fraction})`,
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
          <p className="mt-1 truncate text-center text-[11px] font-extrabold" style={{ color: unit.deep }}>
            {status}
          </p>
        </div>
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
  const title = last ? "Honour" : secret ? "Secret" : milestone.points === 20 ? "Laser" : milestone.points === 35 ? "Ice cream" : milestone.short;
  const Icon = last ? Crown : milestone.points === 35 ? IceCreamCone : milestone.points === 20 ? Crosshair : LockKeyhole;
  const next = nextClassMilestone(score);
  const aiming = next?.points === milestone.points;

  return (
    <li className="flex flex-col items-center text-center">
      <div
        className="grid size-9 place-items-center rounded-full border-2 sm:size-11"
        style={{
          background: reached ? (last ? "#2a1c04" : unit.color) : secret ? "#2a1c04" : "#fffdf8",
          color: reached ? (last ? "#ffe08a" : unit.ink) : secret ? "#ffe08a" : "#6b5844",
          borderColor: aiming ? unit.deep : reached ? unit.deep : "rgba(42,34,24,0.12)",
          boxShadow: aiming ? `0 0 0 3px ${unit.color}` : undefined,
        }}
      >
        <Icon className="size-4 sm:size-5" />
      </div>
      <p className="mt-1 text-[10px] leading-none font-extrabold tabular-nums">{milestone.points}</p>
      <p className="text-[10px] leading-tight font-bold text-muted-foreground">{title}</p>
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
