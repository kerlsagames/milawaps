"use client";

import { UNITS, type PublicBoard, type ScoreAction, type UnitId } from "@/lib/game";
import { UnitCard } from "@/components/unit-card";
import { VaultMeter } from "@/components/vault-meter";
import { cn } from "@/lib/utils";

export function LeaderboardView({
  board,
  onScore,
  error,
  showScores = true,
  teacherMode = false,
  onHighlight,
}: {
  board: PublicBoard;
  onScore: (action: ScoreAction, unitId?: UnitId) => void;
  error: string | null;
  showScores?: boolean;
  /** Unlocked yard-duty teacher: show highlight on the board itself. */
  teacherMode?: boolean;
  onHighlight?: (unitId: UnitId) => void;
}) {
  const compact = Boolean(showScores);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        compact ? "h-full gap-1.5 lg:gap-3" : "gap-2 lg:gap-3",
        // Room for the fixed Undo (and Reason) chips along the bottom edge.
        teacherMode && compact && "pb-14 sm:pb-16",
      )}
    >
      <VaultMeter vault={board.vault} onTeamwork={showScores ? () => onScore("teamwork") : undefined} />
      {error && (
        <p
          className="shrink-0 rounded-xl bg-[#c23b3b]/10 px-3 py-1 text-center text-xs font-semibold text-[#8d1f1f] lg:text-sm"
          role="status"
        >
          {error}
        </p>
      )}
      <div
        className={cn(
          "grid min-h-0 gap-1.5 lg:grid-cols-3 lg:gap-3",
          compact && "flex-1 grid-rows-3 lg:grid-rows-1",
        )}
      >
        {UNITS.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            score={board.units[unit.id]}
            crosses={board.crosses?.[unit.id] ?? 0}
            index={index}
            compact={compact}
            onScore={showScores ? onScore : undefined}
            onHighlight={teacherMode ? onHighlight : undefined}
          />
        ))}
      </div>
    </div>
  );
}
