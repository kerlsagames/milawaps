"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Crosshair, Crown, IceCreamCone, LockKeyhole, Sparkles } from "lucide-react";
import {
  CLASS_MILESTONES,
  UNITS,
  nextClassMilestone,
  type Milestone,
  type PublicBoard,
} from "@/lib/game";

const HIGHEST = 50;

export function PrizesView({ board }: { board: PublicBoard }) {
  const lead = Math.max(...UNITS.map((unit) => board.units[unit.id]));
  const travelled = Math.max(0, Math.min(1, lead / HIGHEST));

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">
            Follow the path
          </p>
          <h2 className="font-display text-3xl leading-none sm:text-4xl">The highest honour</h2>
        </div>
        <p className="flex items-center gap-1.5 text-sm font-bold text-ink-gold">
          <Sparkles className="size-4" />
          Seven stops. The last one is the big one.
        </p>
      </header>

      <div className="overflow-x-auto pb-1">
        <div className="relative min-w-[920px] px-1 pt-3">
          <div className="absolute top-[2.55rem] right-12 left-12 h-3 rounded-full bg-[#f3e2c0]" />
          <motion.div
            className="absolute top-[2.55rem] left-12 h-3 rounded-full"
            style={{
              background: "linear-gradient(90deg, #f5b942, #ff8b5a, #8b7cf7)",
            }}
            initial={false}
            animate={{ width: `calc((100% - 6rem) * ${travelled})` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
          {UNITS.map((unit) => {
            const spot = Math.max(0, Math.min(1, board.units[unit.id] / HIGHEST));
            return (
              <span
                key={unit.id}
                className="absolute top-[2.2rem] size-6 -translate-x-1/2 rounded-full border-2 border-white shadow"
                style={{
                  left: `calc(3rem + (100% - 6rem) * ${spot})`,
                  background: unit.color,
                }}
                title={unit.code}
              />
            );
          })}

          <ol className="relative grid grid-cols-7 gap-2">
            {CLASS_MILESTONES.map((milestone, index) => (
              <Stop
                key={milestone.points}
                milestone={milestone}
                board={board}
                index={index}
                last={index === CLASS_MILESTONES.length - 1}
              />
            ))}
          </ol>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {UNITS.map((unit) => {
          const score = board.units[unit.id];
          const next = nextClassMilestone(score);
          const line = !next
            ? "Standing at the highest honour"
            : next.secret
              ? `${next.points - score} to the next stop`
              : `${next.points - score} to ${next.title}`;
          return (
            <div
              key={unit.id}
              className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2"
              style={{ background: unit.color, color: unit.ink }}
            >
              <p className="font-display text-2xl leading-none">{unit.code}</p>
              <p className="text-right text-xs font-extrabold">{line}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stop({
  milestone,
  board,
  index,
  last,
}: {
  milestone: Milestone;
  board: PublicBoard;
  index: number;
  last: boolean;
}) {
  const reachedCount = UNITS.filter((unit) => board.units[unit.id] >= milestone.points).length;
  const opened = reachedCount > 0;
  const secret = milestone.secret && !opened;
  const title = last ? "Highest honour" : secret ? "Secret" : milestone.title;
  const Icon = last ? Crown : milestone.points === 35 ? IceCreamCone : milestone.points === 20 ? Crosshair : LockKeyhole;

  return (
    <motion.li
      initial={{ opacity: 1, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-col items-center text-center"
    >
      <div
        className={
          last
            ? "relative grid size-24 place-items-center rounded-full border-4 border-[#fff4c8] bg-[#2a1c04] text-gold shadow-[0_0_0_6px_rgba(245,185,66,0.45),0_8px_0_#a86a12]"
            : "grid size-16 place-items-center rounded-full border-4 shadow-[0_5px_0_rgba(42,28,4,0.18)]"
        }
        style={
          last
            ? undefined
            : {
                borderColor: milestone.points === 20 ? "#a86a12" : milestone.points === 35 ? "#c45a32" : "#f5b942",
                background: secret ? "#2a1c04" : milestone.points === 35 ? "#ff8b5a" : milestone.points === 20 ? "#f5b942" : "#fff8df",
                color: secret ? "#ffe08a" : "#2a1c04",
              }
        }
      >
        <Icon className={last ? "size-10" : "size-7"} />
        {last && (
          <Sparkles className="absolute -top-1 -right-1 size-5 text-[#ffe08a]" aria-hidden="true" />
        )}
      </div>
      <p className="mt-2 font-display text-xl leading-none">{milestone.points}</p>
      <p className="mt-1 min-h-8 font-display text-sm leading-tight">{title}</p>
      <div className="mt-1 flex gap-1">
        {UNITS.map((unit) => {
          const reached = board.units[unit.id] >= milestone.points;
          return (
            <span
              key={unit.id}
              className="rounded-full px-1.5 py-0.5 text-[10px] font-extrabold"
              style={{
                background: reached ? unit.color : "rgba(42,34,24,0.06)",
                color: reached ? unit.ink : "#6b5844",
              }}
            >
              {unit.code}
            </span>
          );
        })}
      </div>
      {last && (
        <div className="mt-2 flex justify-center gap-1.5">
          <Image
            src="/mystery-teacher-a.jpg"
            alt="A mystery teacher, face hidden."
            width={64}
            height={64}
            className="size-10 rounded-full border-2 border-[#f5b942] object-cover"
          />
          <Image
            src="/mystery-teacher-b.jpg"
            alt="Another mystery teacher, face hidden."
            width={64}
            height={64}
            className="size-10 rounded-full border-2 border-[#f5b942] object-cover"
          />
        </div>
      )}
    </motion.li>
  );
}
