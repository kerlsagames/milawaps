"use client";

import { useEffect, useState } from "react";
import { UNITS, actionLabel, formatAgo, type PublicBoard, type ScoreAction, type UnitId } from "@/lib/game";
import { UnitCard } from "@/components/unit-card";
import { VaultMeter } from "@/components/vault-meter";

export function LeaderboardView({
  board,
  onScore,
  error,
}: {
  board: PublicBoard;
  onScore: (action: ScoreAction, unitId?: UnitId) => void;
  error: string | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <VaultMeter vault={board.vault} onTeamwork={() => onScore("teamwork")} />
      {board.lastAction && (
        <p className="truncate text-center text-xs font-bold text-ink-gold">
          {actionLabel(board.lastAction)} · {formatAgo(board.lastAction.at, now)}
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-[#c23b3b]/10 px-3 py-1.5 text-center text-sm font-semibold text-[#8d1f1f]" role="status">
          {error}
        </p>
      )}
      <div className="grid gap-2 lg:grid-cols-3">
        {UNITS.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            score={board.units[unit.id]}
            crosses={board.crosses?.[unit.id] ?? 0}
            index={index}
            onScore={onScore}
          />
        ))}
      </div>
    </div>
  );
}
