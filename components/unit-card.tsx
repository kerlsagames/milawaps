"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { UNIT_MAX, type ScoreAction, type UnitId, type UnitTheme } from "@/lib/game";
import { BlockMatrix, StrikeMatrix } from "@/components/block-matrix";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UnitCard({
  unit,
  score,
  crosses,
  index,
  compact = false,
  onScore,
  onHighlight,
}: {
  unit: UnitTheme;
  score: number;
  crosses: number;
  index: number;
  /** Phone yard desk: shrink so F/1, 2/3/4 and 5/6 all fit. */
  compact?: boolean;
  onScore?: (action: ScoreAction, unitId: UnitId) => void;
  onHighlight?: (unitId: UnitId) => void;
}) {
  const percent = Math.max(0, Math.min(100, (score / UNIT_MAX) * 100));
  const fillActions = Boolean(compact && (onScore || onHighlight));

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "@container relative flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card lg:rounded-3xl",
        compact && "min-h-0",
      )}
      style={{
        borderColor: `${unit.color}66`,
        boxShadow: `0 4px 0 ${unit.deep}`,
      }}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-between gap-2",
          compact ? "px-2 py-1.5 lg:px-4 lg:py-4" : "px-3 py-2.5 lg:px-4 lg:py-4",
        )}
        style={{ background: unit.color, color: unit.ink }}
      >
        <div className="min-w-0">
          <p
            className={cn(
              "font-display leading-none whitespace-nowrap",
              compact
                ? "text-[1.85rem] lg:text-[length:min(8.5rem,calc((100cqi-8rem)/3))] lg:leading-[0.78]"
                : "text-[2.65rem] lg:text-[length:min(8.5rem,calc((100cqi-8rem)/3))] lg:leading-[0.78]",
            )}
            style={{
              letterSpacing: "-0.04em",
              textShadow: `0 3px 0 ${unit.deep}`,
            }}
          >
            {unit.code}
          </p>
        </div>
        <div
          className={cn(
            "grid shrink-0 place-items-center rounded-full bg-[#fffdf8]",
            compact
              ? "size-10 shadow-[0_2px_0_rgba(42,28,4,0.28)] lg:size-24 lg:shadow-[0_4px_0_rgba(42,28,4,0.28)]"
              : "size-14 shadow-[0_3px_0_rgba(42,28,4,0.28)] lg:size-24 lg:shadow-[0_4px_0_rgba(42,28,4,0.28)]",
          )}
          aria-label={`${unit.code} tally ${score}`}
        >
          <p
            className={cn(
              "font-display leading-none tabular-nums",
              compact ? "text-2xl lg:text-5xl" : "text-3xl lg:text-5xl",
            )}
          >
            {score}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          compact
            ? onScore || onHighlight
              ? "relative px-1.5 pt-1 pb-1.5 lg:p-3 lg:pt-2"
              : "p-1.5 pt-1 lg:p-3 lg:pt-2"
            : "p-2 pt-2 lg:p-3 lg:pt-2",
        )}
      >
        {/* Phone desk: skip the thin bar so +1/+2/−1 can fill the class rectangle. */}
        <div
          className={cn(
            "shrink-0 overflow-hidden rounded-full bg-black/10",
            compact ? "hidden h-2 lg:block" : "h-1.5 lg:h-2",
            !compact && "mt-0",
          )}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: unit.color }}
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 18 }}
          />
        </div>

        <div className="mt-2 hidden min-h-0 flex-1 flex-col gap-2 lg:flex">
          <BlockMatrix score={score} color={unit.color} ink={unit.ink} label={unit.code} />
          <StrikeMatrix count={crosses} label={unit.code} />
        </div>

        {crosses > 0 ? (
          <p className={cn("shrink-0 truncate text-muted-foreground lg:hidden", compact ? "absolute top-1 right-1 rounded bg-white/90 px-1 text-[10px]" : "mt-1.5 text-xs")}>
            {crosses} strike{crosses === 1 ? "" : "s"}
          </p>
        ) : null}

        {(onScore || onHighlight) ? (
          <div
            className={cn(
              "flex flex-col",
              fillActions
                ? "min-h-0 flex-1 gap-1 lg:mt-2 lg:flex-none lg:gap-1.5"
                : "mt-auto gap-1.5",
            )}
          >
            {onScore ? (
              <div
                className={cn(
                  "grid grid-cols-3",
                  fillActions ? "min-h-0 flex-[3] gap-1 lg:flex-none lg:gap-1.5" : "gap-1.5",
                )}
              >
                <Button
                  type="button"
                  className={cn(
                    "rounded-xl",
                    fillActions
                      ? "h-full min-h-0 text-lg lg:h-12 lg:text-base"
                      : "h-14 text-lg lg:h-12 lg:text-base",
                  )}
                  style={{ background: unit.color, color: unit.ink }}
                  disabled={score >= UNIT_MAX}
                  onClick={() => onScore("spot", unit.id)}
                >
                  +1
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "rounded-xl",
                    fillActions
                      ? "h-full min-h-0 text-lg lg:h-12 lg:text-base"
                      : "h-14 text-lg lg:h-12 lg:text-base",
                  )}
                  style={{ background: unit.deep, color: "#fff7ea" }}
                  disabled={score >= UNIT_MAX}
                  onClick={() => onScore("surge", unit.id)}
                >
                  +2
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "rounded-xl border-[#c23b3b]/40 bg-[#c23b3b]/10 text-[#8d1f1f]",
                    fillActions
                      ? "h-full min-h-0 text-lg lg:h-12 lg:text-base"
                      : "h-14 text-lg lg:h-12 lg:text-base",
                  )}
                  disabled={score <= 0}
                  onClick={() => onScore("strike", unit.id)}
                >
                  −1
                </Button>
              </div>
            ) : null}

            {onHighlight ? (
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full rounded-xl border-[#e2a01a] bg-[#fff8df] font-extrabold",
                  fillActions
                    ? "h-auto min-h-0 flex-[1.15] text-xs lg:h-11 lg:flex-none lg:text-sm"
                    : "h-12 text-sm lg:h-11",
                )}
                onClick={() => onHighlight(unit.id)}
              >
                <Sparkles className={cn(compact ? "size-3.5 lg:size-4" : "size-4")} aria-hidden="true" />
                Student highlight
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}
