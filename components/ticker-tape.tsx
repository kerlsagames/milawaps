"use client";

import { todayTickerLines } from "@/lib/ticker";
import type { ScoreLogEntry } from "@/lib/game";

export function TickerTape({ log, now }: { log: ScoreLogEntry[]; now: number }) {
  const lines = todayTickerLines(log, now);
  const spoken = lines.length ? lines.join(". ") : "Nothing on the ticker yet today.";
  const visual = lines.length ? `${lines.join("    ✦    ")}    ✦    ` : spoken;

  return (
    <div className="overflow-hidden rounded-full border-2 border-[#e2a01a] bg-[#fff8df]">
      <p className="sr-only">{spoken}</p>
      <div
        aria-hidden="true"
        className="whitespace-nowrap px-4 py-2 text-sm font-extrabold text-[#2a1c04] sm:text-base"
      >
        {lines.length ? (
          <span className="ticker-move">
            {visual}
            {visual}
          </span>
        ) : (
          <span>{spoken}</span>
        )}
      </div>
    </div>
  );
}
