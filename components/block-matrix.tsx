"use client";

import { Trophy } from "lucide-react";
import { useDeskPrefs } from "@/lib/desk-prefs";
import { CLASS_MILESTONES, STRIKE_MAX, UNIT_MAX } from "@/lib/game";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";
import { cn } from "@/lib/utils";

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
      aria-label={`${label}: ${earned} tidy squares out of ${UNIT_MAX}.`}
      className="grid gap-1"
      style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
    >
      {Array.from({ length: UNIT_MAX }, (_, index) => {
        const square = index + 1;
        const filled = index < earned;
        const milestone = trophies.get(square);
        const reveal = milestone ? revealForPoints(milestone.points) : null;
        const named = Boolean(reveal && prizeIsPublic(reveals[reveal.id]?.at, now));
        const caption =
          reveal && named ? reveals[reveal.id]?.label?.trim() || milestone?.title || "Prize" : "Prize";
        const won = Boolean(milestone && score >= milestone.points);
        return (
          <span
            key={index}
            title={milestone ? (named ? `${milestone.points} ${caption}` : "Prize") : undefined}
            className={cn(
              "relative aspect-square rounded-md border",
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
                className="absolute inset-[16%]"
                strokeWidth={2.4}
                style={{ color: won ? (filled ? ink : "#f5b942") : "#c8b89a" }}
              />
            ) : filled ? (
              <svg viewBox="0 0 12 12" className="absolute inset-[18%]" aria-hidden="true">
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
    <div>
      <p className="mb-1 text-[11px] font-extrabold tracking-[0.16em] text-[#8d1f1f] uppercase">Strikes</p>
      <div
        role="img"
        aria-label={`${label}: ${marked} strikes out of ${STRIKE_MAX}.`}
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))" }}
      >
        {Array.from({ length: STRIKE_MAX }, (_, index) => {
          const struck = index < marked;
          return (
            <span
              key={index}
              className={cn(
                "relative aspect-square rounded-md border",
                struck ? "border-[#9b1c1c] bg-[#c23b3b]/20" : "border-black/10 bg-black/5",
              )}
            >
              {struck ? (
                <svg viewBox="0 0 10 10" className="absolute inset-[18%]" aria-hidden="true">
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
  );
}
