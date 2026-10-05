"use client";

import { motion } from "framer-motion";
import { CakeSlice, Droplets, Lock, PartyPopper, Scissors, Shirt, Timer } from "lucide-react";
import {
  CLASS_MILESTONES,
  UNITS,
  VAULT_MILESTONES,
  type PublicBoard,
} from "@/lib/game";

const classIcons = [Timer, PartyPopper, CakeSlice];
const vaultIcons = [Shirt, Droplets, Scissors];

export function PrizesView({ board }: { board: PublicBoard }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-bold tracking-[0.22em] text-gold uppercase">Prize cabinet</p>
        <h2 className="font-display text-4xl leading-none sm:text-5xl">What the tidy track buys</h2>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Each unit chases its own perks. The vault adds every point together until the staff
          pranks fall.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        {UNITS.map((unit, unitIndex) => (
          <motion.section
            key={unit.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: unitIndex * 0.06 }}
            className="rounded-[28px] border bg-card/90 p-4"
            style={{ borderColor: `${unit.color}66` }}
          >
            <p className="font-display text-2xl" style={{ color: unit.color }}>
              {unit.code}
            </p>
            <p className="text-sm text-muted-foreground">{unit.zoneLine}</p>
            <div className="mt-4 flex flex-col gap-3">
              {CLASS_MILESTONES.map((milestone, index) => {
                const reached = board.units[unit.id] >= milestone.points;
                const Icon = classIcons[index] ?? PartyPopper;
                return (
                  <article
                    key={milestone.points}
                    className="rounded-2xl border p-3"
                    style={{
                      borderColor: reached ? unit.color : "rgba(255,255,255,0.08)",
                      background: reached ? unit.soft : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="grid size-10 shrink-0 place-items-center rounded-xl"
                        style={{
                          background: reached ? unit.color : "rgba(255,255,255,0.06)",
                          color: reached ? unit.ink : "#b7c0d6",
                        }}
                      >
                        {reached ? <Icon className="size-5" /> : <Lock className="size-4" />}
                      </span>
                      <div>
                        <p className="text-[11px] font-extrabold tracking-wide text-muted-foreground uppercase">
                          {milestone.points} points
                        </p>
                        <h3 className="font-display text-lg leading-tight">{milestone.title}</h3>
                        <p className="mt-1 text-sm leading-snug text-muted-foreground">
                          {milestone.detail}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </motion.section>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="font-display text-2xl">Grand finale · staff pranks</h3>
        <div className="grid gap-3 lg:grid-cols-3">
          {VAULT_MILESTONES.map((milestone, index) => {
            const reached = board.vault >= milestone.points;
            const Icon = vaultIcons[index] ?? Scissors;
            const jackpot = milestone.points === 130;
            return (
              <motion.article
                key={milestone.points}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.06 }}
                className="relative overflow-hidden rounded-[28px] border p-4"
                style={{
                  borderColor: reached ? "rgba(255,224,138,0.8)" : "rgba(255,255,255,0.08)",
                  background: reached ? "rgba(255,224,138,0.1)" : "rgba(20,26,46,0.9)",
                }}
              >
                {jackpot && reached && <div className="barber-stripe absolute inset-x-0 top-0 h-2" />}
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-gold text-[#241a08]">
                    {reached ? <Icon className="size-6" /> : <Lock className="size-5" />}
                  </span>
                  <div>
                    <p className="text-[11px] font-extrabold tracking-wide text-gold uppercase">
                      Vault {milestone.points}
                    </p>
                    <h3 className="font-display text-xl leading-tight">{milestone.title}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-snug text-muted-foreground">{milestone.detail}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
