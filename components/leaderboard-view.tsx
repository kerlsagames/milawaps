"use client";

import type { ReactNode } from "react";
import { Undo2 } from "lucide-react";
import { UNITS, type PublicBoard, type ScoreAction, type UnitId } from "@/lib/game";
import { UnitCard } from "@/components/unit-card";
import { VaultMeter } from "@/components/vault-meter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LeaderboardView({
  board,
  onScore,
  error,
  showScores = true,
  teacherMode = false,
  canUndo = false,
  onHighlight,
  onUndo,
  reasonSlot,
}: {
  board: PublicBoard;
  onScore: (action: ScoreAction, unitId?: UnitId) => void;
  error: string | null;
  showScores?: boolean;
  /** Unlocked yard-duty teacher: show highlight on the board itself. */
  teacherMode?: boolean;
  canUndo?: boolean;
  onHighlight?: (unitId: UnitId) => void;
  onUndo?: () => void;
  /** Reason chip sits in the bar under the class cards (right side). */
  reasonSlot?: ReactNode;
}) {
  const compact = Boolean(showScores);
  const showBar = teacherMode && Boolean(onUndo);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        compact ? "h-full gap-1.5 lg:gap-3" : "gap-2 lg:gap-3",
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
      {showBar ? (
        <div className="mt-0.5 flex shrink-0 items-stretch justify-between gap-2 border-t border-black/10 pt-2 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            aria-label="Undo last click"
            disabled={!canUndo}
            onClick={onUndo}
            className="h-11 rounded-2xl border-2 border-[#2a1c04] bg-[#fffdf8] px-3 text-sm font-extrabold shadow-[0_4px_0_#2a1c04] sm:h-12 sm:px-4 sm:text-base"
          >
            <Undo2 className="size-4" aria-hidden="true" />
            <span className="sm:hidden">Undo</span>
            <span className="hidden sm:inline">Undo last click</span>
          </Button>
          <div className="flex min-w-0 flex-1 items-stretch justify-end">{reasonSlot}</div>
        </div>
      ) : null}
    </div>
  );
}
