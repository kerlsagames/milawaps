"use client";

import { motion } from "framer-motion";
import { VAULT_TARGET } from "@/lib/game";

export function VaultMeter({ vault }: { vault: number }) {
  const width = Math.max(0, Math.min(100, (vault / VAULT_TARGET) * 100));
  const full = vault >= VAULT_TARGET;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-[#e2a01a]/35 bg-card p-4 shadow-[0_10px_0_rgba(226,160,26,0.22)] sm:p-5">
      {full && <div className="barber-stripe absolute inset-x-0 top-0 h-2" />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">
            Milawa Primary
          </p>
          <h2 className="font-display text-2xl leading-none sm:text-3xl">
            {full ? "The whole yard is glowing" : "School tidy total"}
          </h2>
        </div>
        <p className="font-display text-5xl leading-none tracking-tight text-ink-gold tabular-nums sm:text-6xl">
          {vault}
          <span className="ml-1 text-xl text-muted-foreground sm:text-2xl">/ {VAULT_TARGET}</span>
        </p>
      </div>

      <div className="relative mt-4 h-5 overflow-hidden rounded-full bg-black/10">
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

      <p className="mt-3 text-sm text-muted-foreground">
        {full
          ? "Every unit filled its 50 ticks."
          : "Three units, fifty ticks each. Prizes live on the unit cards, not up here."}
      </p>
    </section>
  );
}
