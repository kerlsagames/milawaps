"use client";

import { motion } from "framer-motion";
import { SCHOOL_GOAL } from "@/lib/game";
import { Button } from "@/components/ui/button";

export function VaultMeter({
  vault,
  onTeamwork,
}: {
  vault: number;
  onTeamwork: () => void;
}) {
  const total = Math.max(0, vault);
  const fill = Math.max(0, Math.min(100, (total / SCHOOL_GOAL) * 100));
  const full = total >= SCHOOL_GOAL;

  return (
    <section className="flex items-center gap-3 rounded-[28px] border-4 border-[#f5b942] bg-card px-3 py-3 shadow-[0_8px_0_#c48a16] sm:gap-4 sm:px-4">
      <div
        className="grid size-24 shrink-0 place-items-center rounded-full bg-[#f5b942] text-[#2a1c04] shadow-[0_5px_0_#a86a12] sm:size-32"
        aria-label={`School tidy total ${total} out of ${SCHOOL_GOAL}`}
      >
        <div className="text-center">
          <p className="font-display text-5xl leading-none tabular-nums sm:text-6xl">{total}</p>
          <p className="text-xs font-extrabold tracking-wide">/ {SCHOOL_GOAL}</p>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-3xl leading-none sm:text-5xl">
          {full ? "The whole yard is glowing" : "School tidy total"}
        </h2>
        <div className="relative mt-3 h-5 overflow-hidden rounded-full bg-black/10 sm:h-7">
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
      <Button type="button" className="h-14 shrink-0 rounded-2xl px-4 text-lg sm:h-16 sm:px-5" onClick={onTeamwork}>
        +2 all
      </Button>
    </section>
  );
}
