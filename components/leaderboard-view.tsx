"use client";

import { useEffect, useState } from "react";
import { UNITS, actionLabel, formatAgo, type PublicBoard } from "@/lib/game";
import { UnitCard } from "@/components/unit-card";
import { VaultMeter } from "@/components/vault-meter";

export function LeaderboardView({ board }: { board: PublicBoard }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <VaultMeter vault={board.vault} />
      {board.vault === 0 && (
        <p className="text-center text-sm font-semibold text-muted-foreground">
          No ticks yet. The first clean patch opens the board.
        </p>
      )}
      {board.lastAction && (
        <p className="text-center text-sm font-bold text-ink-gold">
          {actionLabel(board.lastAction)} · {formatAgo(board.lastAction.at, now)}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        {UNITS.map((unit, index) => (
          <UnitCard key={unit.id} unit={unit} score={board.units[unit.id]} index={index} />
        ))}
      </div>
    </div>
  );
}
