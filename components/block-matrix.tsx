"use client";

import { Trophy } from "lucide-react";
import { useDeskPrefs } from "@/lib/desk-prefs";
import { CLASS_MILESTONES, STRIKE_MAX, UNIT_MAX } from "@/lib/game";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";
import { cn } from "@/lib/utils";

const SCORE_COLS = 10;
const SCORE_ROWS = UNIT_MAX / SCORE_COLS;
const STRIKE_COLS = 10;
const STRIKE_ROWS = STRIKE_MAX / STRIKE_COLS;

export function BlockMatrix({
  score,
  color,
  ink,
  label,
}: {
  score: number;
  color: string;
  ink: string;
  label: string;
}) {
  const reveals = useDeskPrefs().reveals;
  const now = Date.now();
  const earned = Math.max(0, Math.min(UNIT_MAX, score));
  const trophies = new Map<number, (typeof CLASS_MILESTONES)[number]>();
  for (const milestone of CLASS_MILESTONES) {
    if (milestone.points >= 1 && milestone.points <= UNIT_MAX && !trophies.has(milestone.points)) {
      trophies.set(milestone.points, milestone);
    }
  }

  return (
    <div
      role="img"
      aria-label={`${label}: ${earned} squares out of ${UNIT_MAX}.`}
      className="grid h-full w-full gap-1"
      style={{
        gridTemplateColumns: `repeat(${SCORE_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${SCORE_ROWS}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const square = index + 1;
        const filled = index < earned;
        const milestone = trophies.get(square);
        const reveal = milestone ? revealForPoints(milestone.points) : null;
        const saved = reveal ? reveals[reveal.id] : null;
        const named = Boolean(reveal && prizeIsPublic(saved?.at, now, saved?.unlocked === true));
        const caption =
          reveal && named ? saved?.label?.trim() || milestone?.title || "Prize" : "Prize";
        const won = Boolean(milestone && score >= milestone.points);
        return (
          <span
            key={index}
            title={milestone ? (named ? `${milestone.points} ${caption}` : "Prize") : undefined}
            className={cn(
              "relative min-h-0 min-w-0 overflow-hidden rounded-md border",
              filled && "border-transparent",
              !filled && "border-black/10 bg-black/5",
              milestone && !filled && "border-dashed",
            )}
            style={{
              backgroundColor: filled ? color : undefined,
              borderColor: milestone && !filled ? color : undefined,
            }}
          >
            {milestone ? (
              <Trophy
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2"
                strokeWidth={2.4}
                style={{ color: won ? (filled ? ink : "#f5b942") : "#c8b89a" }}
              />
            ) : filled ? (
              <svg
                viewBox="0 0 12 12"
                className="pointer-events-none absolute top-1/2 left-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                <path
                  d="M2.1 6.2 L4.8 9 L9.9 3.1"
                  fill="none"
                  stroke={ink}
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export function StrikeMatrix({ count, label }: { count: number; label: string }) {
  const marked = Math.max(0, Math.min(STRIKE_MAX, count));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-1 shrink-0 text-[11px] font-extrabold tracking-[0.16em] text-[#8d1f1f] uppercase">
        Strikes
      </p>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div
          className="h-auto max-h-full w-full max-w-full"
          style={{ aspectRatio: `${STRIKE_COLS} / ${STRIKE_ROWS}` }}
        >
          <div
            role="img"
            aria-label={`${label}: ${marked} strikes out of ${STRIKE_MAX}.`}
            className="grid h-full w-full gap-1"
            style={{
              gridTemplateColumns: `repeat(${STRIKE_COLS}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${STRIKE_ROWS}, minmax(0, 1fr))`,
            }}
          >
            {Array.from({ length: STRIKE_MAX }, (_, index) => {
              const struck = index < marked;
              return (
                <span
                  key={index}
                  className={cn(
                    "relative min-h-0 min-w-0 overflow-hidden rounded-md border",
                    struck ? "border-[#9b1c1c] bg-[#c23b3b]/20" : "border-black/10 bg-black/5",
                  )}
                >
                  {struck ? (
                    <svg
                      viewBox="0 0 10 10"
                      className="pointer-events-none absolute top-1/2 left-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      <path
                        d="M1.2 1.2 L8.8 8.8 M8.8 1.2 L1.2 8.8"
                        stroke="#9b1c1c"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
