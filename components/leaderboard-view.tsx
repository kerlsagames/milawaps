"use client";

import { useEffect, useState } from "react";
import { UNITS, type PublicBoard, type ScoreAction, type UnitId } from "@/lib/game";
import { TickerTape } from "@/components/ticker-tape";
import { UnitCard } from "@/components/unit-card";
import { VaultMeter } from "@/components/vault-meter";

export function LeaderboardView({
  board,
  onScore,
  error,
  showScores = true,
}: {
  board: PublicBoard;
  onScore: (action: ScoreAction, unitId?: UnitId) => void;
  error: string | null;
  showScores?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2 lg:gap-3">
      <TickerTape log={board.log ?? []} now={now} />
      <VaultMeter vault={board.vault} onTeamwork={showScores ? () => onScore("teamwork") : undefined} />
      {error && (
        <p className="rounded-xl bg-[#c23b3b]/10 px-3 py-1.5 text-center text-sm font-semibold text-[#8d1f1f]" role="status">
          {error}
        </p>
      )}
      <div className="grid gap-2 lg:grid-cols-3 lg:gap-3">
        {UNITS.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            score={board.units[unit.id]}
            crosses={board.crosses?.[unit.id] ?? 0}
            index={index}
            onScore={showScores ? onScore : undefined}
          />
        ))}
      </div>
    </div>
  );
}
