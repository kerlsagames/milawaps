"use client";

import { motion } from "framer-motion";
import { SCHOOL_GOAL } from "@/lib/game";
import { Button } from "@/components/ui/button";

export function VaultMeter({
  vault,
  onTeamwork,
}: {
  vault: number;
  onTeamwork?: () => void;
}) {
  const total = Math.max(0, vault);
  const fill = Math.max(0, Math.min(100, (total / SCHOOL_GOAL) * 100));
  const full = total >= SCHOOL_GOAL;

  return (
    <section className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#f5b942] bg-card px-1.5 py-1 shadow-[0_3px_0_#c48a16] lg:gap-4 lg:rounded-[28px] lg:border-4 lg:px-4 lg:py-3 lg:shadow-[0_8px_0_#c48a16]">
      <div
        className="grid size-11 shrink-0 place-items-center rounded-full bg-[#f5b942] text-[#2a1c04] shadow-[0_2px_0_#a86a12] lg:size-32 lg:shadow-[0_5px_0_#a86a12]"
        aria-label={`School total ${total} out of ${SCHOOL_GOAL}`}
      >
        <div className="text-center">
          <p className="font-display text-xl leading-none tabular-nums lg:text-6xl">{total}</p>
          <p className="text-[8px] font-extrabold tracking-wide lg:text-xs">/ {SCHOOL_GOAL}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-base leading-none lg:text-5xl">
          {full ? "The whole yard is glowing" : "School total"}
        </h2>
        <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-black/10 lg:mt-3 lg:h-7">
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
          className="h-9 shrink-0 rounded-lg px-2.5 text-sm lg:h-16 lg:rounded-2xl lg:px-5 lg:text-lg"
          onClick={onTeamwork}
        >
          +3 all
        </Button>
      ) : null}
    </section>
  );
}
