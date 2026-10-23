"use client";

import { motion } from "framer-motion";
import { SCHOOL_GOAL } from "@/lib/game";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VaultMeter({
  vault,
  onTeamwork,
  dense = false,
}: {
  vault: number;
  onTeamwork?: () => void;
  /** Teacher desk: shorter bar so class +1 buttons keep vertical room. */
  dense?: boolean;
}) {
  const total = Math.max(0, vault);
  const fill = Math.max(0, Math.min(100, (total / SCHOOL_GOAL) * 100));
  const full = total >= SCHOOL_GOAL;

  return (
    <section
      className={cn(
        "flex shrink-0 items-center bg-card",
        dense
          ? "gap-2 rounded-2xl border-2 border-[#f5b942] px-2 py-1 shadow-[0_3px_0_#c48a16] lg:gap-3 lg:px-3 lg:py-1.5"
          : "gap-1.5 rounded-xl border-2 border-[#f5b942] px-1.5 py-0.5 shadow-[0_3px_0_#c48a16] lg:gap-4 lg:rounded-[28px] lg:border-4 lg:px-4 lg:py-3 lg:shadow-[0_8px_0_#c48a16]",
      )}
    >
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-[#f5b942] text-[#2a1c04]",
          dense
            ? "size-11 shadow-[0_2px_0_#a86a12] lg:size-14"
            : "size-9 shadow-[0_2px_0_#a86a12] lg:size-32 lg:shadow-[0_5px_0_#a86a12]",
        )}
        aria-label={`School total ${total} out of ${SCHOOL_GOAL}`}
      >
        <div className="text-center">
          <p
            className={cn(
              "font-display leading-none tabular-nums",
              dense ? "text-xl lg:text-2xl" : "text-lg lg:text-6xl",
            )}
          >
            {total}
          </p>
          <p
            className={cn(
              "font-extrabold tracking-wide",
              dense ? "text-[8px] lg:text-[10px]" : "text-[7px] lg:text-xs",
            )}
          >
            / {SCHOOL_GOAL}
          </p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            "font-display leading-none",
            dense ? "text-lg lg:text-2xl" : "text-sm lg:text-5xl",
          )}
        >
          {full ? "The whole yard is glowing" : "School total"}
        </h2>
        <div
          className={cn(
            "relative overflow-hidden rounded-full bg-black/10",
            dense ? "mt-1 h-2.5 lg:h-3" : "mt-0.5 h-1.5 lg:mt-3 lg:h-7",
          )}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: "linear-gradient(90deg, #f5b942, #2ec9a0, #8b7cf7)",
            }}
            initial={false}
            animate={{ width: `${fill}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
        </div>
      </div>
      {onTeamwork ? (
        <Button
          type="button"
          className={cn(
            "shrink-0",
            dense
              ? "h-10 rounded-xl px-3 text-sm lg:h-11 lg:px-4 lg:text-base"
              : "h-8 rounded-lg px-2 text-sm lg:h-16 lg:rounded-2xl lg:px-5 lg:text-lg",
          )}
          onClick={onTeamwork}
        >
          +3 all
        </Button>
      ) : null}
    </section>
  );
}
