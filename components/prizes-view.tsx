"use client";

import { motion } from "framer-motion";
import { Crosshair, IceCreamCone, LockKeyhole } from "lucide-react";
import { CLASS_MILESTONES, UNITS, type Milestone, type PublicBoard } from "@/lib/game";

const knownIcons = {
  20: Crosshair,
  35: IceCreamCone,
} as const;

export function PrizesView({ board }: { board: PublicBoard }) {
  const known = CLASS_MILESTONES.filter((milestone) => !milestone.secret);
  const secrets = CLASS_MILESTONES.filter((milestone) => milestone.secret);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">
          Prize cupboard
        </p>
        <h2 className="font-display text-4xl leading-none sm:text-5xl">Ticks turn into treats</h2>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Every unit chases the same ladder. Laser tag and ice cream are out in the open. Teacher
          takedowns stay sealed until the day.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {known.map((milestone, index) => {
          const Icon = knownIcons[milestone.points as keyof typeof knownIcons] ?? Crosshair;
          return (
            <motion.article
              key={milestone.points}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[28px] border border-black/10 bg-card p-5 shadow-[0_8px_0_rgba(226,160,26,0.28)]"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-14 place-items-center rounded-2xl bg-gold text-[#2a1c04] shadow-[0_4px_0_#c48a16]">
                  <Icon className="size-7" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold tracking-wide text-ink-gold uppercase">
                    {milestone.points} ticks
                  </p>
                  <h3 className="font-display text-3xl leading-none">{milestone.title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{milestone.detail}</p>
              <UnitPips board={board} points={milestone.points} />
            </motion.article>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        <div>
          <h3 className="font-display text-3xl">Sealed teacher takedowns</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            The envelope stays shut. Your class finds out what happens to the teacher on the day.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {secrets.map((milestone, index) => (
            <Envelope key={milestone.points} milestone={milestone} board={board} index={index} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Envelope({
  milestone,
  board,
  index,
}: {
  milestone: Milestone;
  board: PublicBoard;
  index: number;
}) {
  const reachedCount = UNITS.filter((unit) => board.units[unit.id] >= milestone.points).length;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.05 }}
      className="relative overflow-hidden rounded-[24px] border border-[#c48a16]/40 bg-[#fff8df] p-4"
    >
      <div
        className="absolute inset-x-0 top-0 h-8 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(135deg,#f5b942 25%,transparent 25%,transparent 50%,#f5b942 50%,#f5b942 75%,transparent 75%)",
          backgroundSize: "16px 16px",
        }}
      />
      <div className="relative mt-6 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-[#2a1c04] text-gold">
          <LockKeyhole className="size-4" />
        </span>
        <p className="font-display text-2xl leading-none text-[#2a1c04]">{milestone.points}</p>
      </div>
      <p className="relative mt-3 font-display text-lg leading-tight text-[#2a1c04]">
        {milestone.short}
      </p>
      <p className="relative mt-1 text-xs leading-snug text-[#6b5844]">
        {reachedCount === 0 ? "Still sealed." : `${reachedCount} unit${reachedCount === 1 ? "" : "s"} opened this one.`}
      </p>
      <UnitPips board={board} points={milestone.points} />
    </motion.article>
  );
}

function UnitPips({ board, points }: { board: PublicBoard; points: number }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {UNITS.map((unit) => {
        const reached = board.units[unit.id] >= points;
        return (
          <span
            key={unit.id}
            className="rounded-full px-2 py-1 text-[11px] font-extrabold"
            style={{
              background: reached ? unit.color : "rgba(42,34,24,0.06)",
              color: reached ? unit.ink : "#6b5844",
            }}
          >
            {unit.code}
            {reached ? " ✓" : ""}
          </span>
        );
      })}
    </div>
  );
}
