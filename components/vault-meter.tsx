"use client";

import { motion } from "framer-motion";
import { VAULT_TARGET } from "@/lib/game";
import { Button } from "@/components/ui/button";

export function VaultMeter({
  vault,
  onTeamwork,
}: {
  vault: number;
  onTeamwork: () => void;
}) {
  const width = Math.max(0, Math.min(100, (vault / VAULT_TARGET) * 100));
  const full = vault >= VAULT_TARGET;

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-[#e2a01a]/35 bg-card px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl leading-none sm:text-2xl">
            {full ? "The whole yard is glowing" : "School tidy total"}
          </h2>
          <p className="font-display text-3xl leading-none text-ink-gold tabular-nums">
            {vault}
            <span className="ml-1 text-base text-muted-foreground">/ {VAULT_TARGET}</span>
          </p>
        </div>
        <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-black/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              background: full
                ? "linear-gradient(90deg, #f5b942, #2ec9a0, #8b7cf7)"
                : "linear-gradient(90deg, #f5b942, #ffd56a)",
            }}
            initial={false}
            animate={{ width: `${width}%` }}
            transition={{ type: "spring", stiffness: 90, damping: 18 }}
          />
        </div>
      </div>
      <Button type="button" className="h-12 shrink-0 rounded-xl px-4 text-base" onClick={onTeamwork}>
        +2 all
      </Button>
    </section>
  );
}
