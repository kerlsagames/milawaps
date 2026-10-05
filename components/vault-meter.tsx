"use client";

import { motion } from "framer-motion";
import { VAULT_MILESTONES, VAULT_TARGET, nextVaultMilestone } from "@/lib/game";

export function VaultMeter({ vault }: { vault: number }) {
  const width = Math.max(0, Math.min(100, (vault / VAULT_TARGET) * 100));
  const next = nextVaultMilestone(vault);
  const unlocked = vault >= VAULT_TARGET;

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-gold/30 bg-card/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] sm:p-5">
      {unlocked && <div className="barber-stripe absolute inset-x-0 top-0 h-2" />}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-gold uppercase">
            Master Vault
          </p>
          <h2 className="font-display text-2xl leading-none text-foreground sm:text-3xl">
            {unlocked ? "Jackpot haircut is open" : "Combined tidy points"}
          </h2>
        </div>
        <p className="font-display text-5xl leading-none tracking-tight text-gold tabular-nums sm:text-6xl">
          {vault}
          <span className="ml-1 text-xl text-muted-foreground sm:text-2xl">/ {VAULT_TARGET}</span>
        </p>
      </div>

      <div className="relative mt-4 h-5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: unlocked
              ? "linear-gradient(90deg, #ff5d8f, #ffe08a, #8b7cf7)"
              : "linear-gradient(90deg, #f5b942, #ffe08a)",
          }}
          initial={false}
          animate={{ width: `${width}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
        />
        {VAULT_MILESTONES.map((milestone) => (
          <span
            key={milestone.points}
            className="absolute top-0 h-full w-0.5 bg-[#070b18]/70"
            style={{ left: `${(milestone.points / VAULT_TARGET) * 100}%` }}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {VAULT_MILESTONES.map((milestone) => {
          const reached = vault >= milestone.points;
          return (
            <div
              key={milestone.points}
              className="rounded-2xl border px-3 py-2"
              style={{
                borderColor: reached ? "rgba(255, 224, 138, 0.7)" : "rgba(255,255,255,0.08)",
                background: reached ? "rgba(255, 224, 138, 0.12)" : "transparent",
              }}
            >
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                {milestone.points} pts
              </p>
              <p className="font-display text-sm text-foreground">{milestone.short}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {next
          ? `${next.points - vault} points to ${next.title}.`
          : "130 is banked. The clippers are waiting."}
      </p>
    </section>
  );
}
