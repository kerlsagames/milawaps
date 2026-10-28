"use client";

import { motion } from "framer-motion";
import { LockKeyhole, Star } from "lucide-react";
import { useDeskPrefs, type RevealMap } from "@/lib/desk-prefs";
import {
  CLASS_MILESTONES,
  UNITS,
  type Milestone,
  type PublicBoard,
  type UnitTheme,
} from "@/lib/game";
import { Countdown } from "@/components/countdown";
import { prizeIsPublic, revealForPoints, type RevealDef } from "@/lib/reveals";

const HIGHEST = CLASS_MILESTONES[CLASS_MILESTONES.length - 1]?.points ?? 80;
const NODE = "var(--node)";
/** One little square per point along the track (0 → finish). */
const TRACK_POINTS = Array.from({ length: HIGHEST }, (_, index) => index + 1);

function namedPrize(points: number, reveals: RevealMap, now: number) {
  const reveal = revealForPoints(points);
  const saved = reveal ? reveals[reveal.id] : null;
  return prizeIsPublic(saved?.at, now, saved?.unlocked === true);
}

export function PrizesView({ board }: { board: PublicBoard }) {
  const prefs = useDeskPrefs();
  const now = Date.now();

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 lg:gap-3">
      <header className="shrink-0">
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">Follow the path</p>
        <h2 className="font-display text-3xl leading-none lg:text-5xl">Prizes</h2>
        <p className="mt-0.5 text-sm font-extrabold text-[#5c4a32] lg:mt-1 lg:text-2xl">
          Unlock prizes as you get more ticks.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:gap-3">
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

      {/* Always keep the school finish clock on screen — paths shrink above it. */}
      <div className="flex shrink-0 justify-center pt-1 lg:pt-2">
        <Countdown finishAt={board.finishAt ?? prefs.finishAt} />
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
  // Marker sits on the last earned point, not under the next prize circle.
  const markerFraction = score <= 0 ? 0 : Math.min(score, HIGHEST) / HIGHEST;

  return (
    <section
      className="flex min-h-0 flex-1 items-center gap-1.5 rounded-2xl border-4 bg-card px-1.5 pt-4 pb-2 lg:gap-3 lg:rounded-[28px] lg:px-3 lg:pt-5 lg:pb-3"
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
          {/* Empty track rail */}
          <div
            className="absolute h-3 -translate-y-1/2 rounded-full bg-[#f3e2c0] lg:h-4"
            style={{
              top: `calc(${NODE} / 2)`,
              left: "calc(var(--stop) / 2)",
              right: "calc(var(--stop) / 2)",
            }}
          />
          {/* Soft fill only under filled squares — stops short of the next prize circle */}
          <motion.div
            className="absolute h-3 -translate-y-1/2 rounded-full opacity-30 lg:h-4"
            style={{ top: `calc(${NODE} / 2)`, left: "calc(var(--stop) / 2)", background: unit.color }}
            initial={false}
            animate={{ width: `calc((100% - var(--stop)) * ${markerFraction})` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
          {/* One square per point — empty squares after the score make “not yet” obvious */}
          <div
            className="pointer-events-none absolute inset-x-0"
            style={{ top: `calc(${NODE} / 2)` }}
            aria-hidden="true"
          >
            {TRACK_POINTS.map((point) => {
              const filled = score >= point;
              const atStop = CLASS_MILESTONES.some((milestone) => milestone.points === point);
              return (
                <span
                  key={point}
                  className={
                    atStop
                      ? "absolute size-0"
                      : "absolute size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-[1.5px] border lg:size-2.5 lg:rounded-[2px]"
                  }
                  style={
                    atStop
                      ? { left: trackLeft(point) }
                      : {
                          left: trackLeft(point),
                          background: filled ? unit.color : "#fffdf8",
                          borderColor: filled ? unit.deep : "rgba(42,34,24,0.22)",
                          opacity: filled ? 1 : 0.85,
                          boxShadow: filled ? `0 1px 0 ${unit.deep}55` : undefined,
                        }
                  }
                />
              );
            })}
          </div>
          {score > 0 ? (
            <span
              className="absolute z-[1] size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow lg:size-5 lg:border-[3px]"
              style={{
                top: `calc(${NODE} / 2)`,
                left: trackLeft(Math.min(score, HIGHEST)),
                background: unit.color,
              }}
              aria-hidden="true"
            />
          ) : null}
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
              <p className="hidden text-xs leading-tight font-bold text-muted-foreground lg:block lg:text-sm">
                Start
              </p>
            </li>
            {CLASS_MILESTONES.map((milestone) => {
              const reveal = revealForPoints(milestone.points);
              const saved = reveal ? reveals[reveal.id] : null;
              const named = namedPrize(milestone.points, reveals, now);
              const reached = score >= milestone.points;
              // Only show the prize picture/name once this class has actually hit the stop.
              // (School-wide “named” alone was making 19 look like they already won.)
              const title = reached
                ? named
                  ? saved?.label?.trim() || milestone.short
                  : milestone.short
                : reveal && !reveal.wide && !named
                  ? "Teacher takedown"
                  : "";
              const art = reached
                ? named
                  ? saved?.image || reveal?.image || ""
                  : ""
                : reveal && !reveal.wide && !named
                  ? reveal.face
                  : "";
              return (
                <Stop
                  key={milestone.points}
                  milestone={milestone}
                  score={score}
                  unit={unit}
                  named={named}
                  reveal={reveal}
                  title={title}
                  art={art}
                />
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

function trackLeft(point: number) {
  return `calc(var(--stop) / 2 + (100% - var(--stop)) * ${point / HIGHEST})`;
}

function Stop({
  milestone,
  score,
  unit,
  named,
  reveal,
  title,
  art,
}: {
  milestone: Milestone;
  score: number;
  unit: UnitTheme;
  named: boolean;
  reveal: RevealDef | null;
  title: string;
  art: string;
}) {
  const reached = score >= milestone.points;
  const takedownLocked = Boolean(reveal && !reveal.wide && !named && !reached);
  const showPicture = Boolean(art);
  // Mystery faces are square cutouts on charcoal — match that fill and fade
  // the square edges so they blend into the circle instead of reading as a stamp.
  const blendSquare = Boolean(reveal && !reveal.wide && showPicture);
  const circleFill = !showPicture ? "#2a1c04" : takedownLocked ? "#5a524f" : "#efe6d6";

  return (
    <li className="relative z-[1] flex w-[var(--stop)] flex-col items-center text-center">
      {reached ? (
        <Star
          aria-hidden="true"
          className="pointer-events-none absolute -top-2 left-1/2 z-[2] size-6 -translate-x-1/2 fill-current drop-shadow-[0_2px_0_rgba(42,28,4,0.25)] lg:-top-3 lg:size-9"
          style={{ color: unit.color }}
        />
      ) : null}
      <div
        className="relative z-[1] grid place-items-center overflow-hidden rounded-full border-4"
        style={{
          width: NODE,
          height: NODE,
          background: circleFill,
          color: showPicture ? unit.ink : "#ffe08a",
          borderColor: reached ? unit.deep : "rgba(42,34,24,0.12)",
        }}
      >
        {showPicture ? (
          blendSquare ? (
            <span className="relative block size-full">
              <img src={art} alt="" className="size-full object-cover" />
              {/* Extra rim fade for JPG stamps; soft PNGs already fall off to transparent. */}
              {!art.endsWith(".png") ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at center, transparent 38%, ${circleFill} 74%)`,
                  }}
                />
              ) : null}
            </span>
          ) : (
            <img src={art} alt="" className="size-full object-cover" />
          )
        ) : (
          <LockKeyhole className="size-4 lg:size-9" />
        )}
      </div>
      <p className="mt-1 text-xs leading-none font-extrabold tabular-nums lg:mt-1.5 lg:text-sm">
        {milestone.points}
      </p>
      <p
        className={
          title
            ? "text-[10px] leading-tight font-bold lg:text-sm"
            : "hidden text-xs leading-tight font-bold text-muted-foreground lg:block lg:text-sm"
        }
        style={reached ? { color: unit.deep } : undefined}
      >
        {title}
      </p>
    </li>
  );
}
