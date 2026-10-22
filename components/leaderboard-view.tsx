"use client";

import type { ReactNode } from "react";
import { Pencil, Undo2 } from "lucide-react";
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
  onChangeScores,
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
  onChangeScores?: () => void;
  /** Reason chip sits in the bar under the class cards (right side). */
  reasonSlot?: ReactNode;
}) {
  const compact = Boolean(showScores);
  const showBar = teacherMode && Boolean(onUndo || onChangeScores);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden",
        compact ? "h-full gap-0.5 lg:gap-3" : "gap-2 lg:gap-3",
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
          "grid min-h-0 gap-1 lg:grid-cols-3 lg:gap-3",
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
        <div className="flex shrink-0 items-stretch justify-between gap-2 border-t border-black/10 pt-1 pb-[max(0.2rem,env(safe-area-inset-bottom))] lg:pt-2 lg:pb-[max(0.35rem,env(safe-area-inset-bottom))]">
          <div className="flex shrink-0 items-stretch gap-2">
            {onChangeScores ? (
              <Button
                type="button"
                aria-label="Change scores"
                onClick={onChangeScores}
                className="h-9 rounded-xl px-2.5 text-xs font-extrabold sm:h-12 sm:rounded-2xl sm:px-4 sm:text-base"
              >
                <Pencil className="size-4" aria-hidden="true" />
                <span className="sm:hidden">Scores</span>
                <span className="hidden sm:inline">Change scores</span>
              </Button>
            ) : null}
            {onUndo ? (
              <Button
                type="button"
                variant="outline"
                aria-label="Undo last click"
                disabled={!canUndo}
                onClick={onUndo}
                className="h-9 rounded-xl border-2 border-[#2a1c04] bg-[#fffdf8] px-2.5 text-xs font-extrabold shadow-[0_3px_0_#2a1c04] sm:h-12 sm:rounded-2xl sm:px-4 sm:text-base sm:shadow-[0_4px_0_#2a1c04]"
              >
                <Undo2 className="size-4" aria-hidden="true" />
                <span className="sm:hidden">Undo</span>
                <span className="hidden sm:inline">Undo last click</span>
              </Button>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 items-stretch justify-end">{reasonSlot}</div>
        </div>
      ) : null}
    </div>
  );
}
