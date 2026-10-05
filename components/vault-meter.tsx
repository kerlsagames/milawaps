"use client";

import { motion } from "framer-motion";
import { VAULT_TARGET } from "@/lib/game";
import { Button } from "@/components/ui/button";

const DISPLAY_MAX = 100;

export function VaultMeter({
  vault,
  onTeamwork,
}: {
  vault: number;
  onTeamwork: () => void;
}) {
  const percent = Math.max(0, Math.min(DISPLAY_MAX, Math.round((vault / VAULT_TARGET) * DISPLAY_MAX)));
  const full = percent >= DISPLAY_MAX;

  return (
    <section className="flex items-center gap-3 rounded-[28px] border-4 border-[#f5b942] bg-card px-3 py-3 shadow-[0_8px_0_#c48a16] sm:gap-4 sm:px-4">
      <div
        className="grid size-24 shrink-0 place-items-center rounded-full bg-[#f5b942] text-[#2a1c04] shadow-[0_5px_0_#a86a12] sm:size-32"
        aria-label={`School tidy total ${percent} out of ${DISPLAY_MAX}`}
      >
        <div className="text-center">
          <p className="font-display text-5xl leading-none tabular-nums sm:text-6xl">{percent}</p>
          <p className="text-xs font-extrabold tracking-wide">/ {DISPLAY_MAX}</p>
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
            animate={{ width: `${percent}%` }}
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
