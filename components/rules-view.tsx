"use client";

import { motion } from "framer-motion";
import { ScanSearch, Users, Zap, CircleMinus } from "lucide-react";
import { ACTION_COPY } from "@/lib/game";

const rules = [
  {
    action: "spot" as const,
    icon: ScanSearch,
    tone: "#f5b942",
    title: "Spot checks",
    points: "+1",
  },
  {
    action: "surge" as const,
    icon: Zap,
    tone: "#2ec9a0",
    title: "Deep cleans",
    points: "+3",
  },
  {
    action: "strike" as const,
    icon: CircleMinus,
    tone: "#ff8b8b",
    title: "Crosses",
    points: "−1",
  },
  {
    action: "teamwork" as const,
    icon: Users,
    tone: "#8b7cf7",
    title: "Cross-class teamwork",
    points: "+2 all",
  },
];

export function RulesView() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">How a tick lands</p>
        <h2 className="font-display text-4xl leading-none sm:text-5xl">Yard rules, loud and clear</h2>
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          Staff on duty tap the desk. The window TV shows the whole school how the yard is going.
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {rules.map((rule, index) => {
          const Icon = rule.icon;
          const copy = ACTION_COPY[rule.action];
          return (
            <motion.article
              key={rule.action}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              className="rounded-[28px] border bg-card p-5"
              style={{ borderColor: `${rule.tone}55`, boxShadow: `0 6px 0 ${rule.tone}33` }}
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className="grid size-12 place-items-center rounded-2xl"
                  style={{ background: rule.tone, color: "#1a1408" }}
                >
                  <Icon className="size-6" />
                </span>
                <span className="font-display text-3xl tabular-nums" style={{ color: rule.tone }}>
                  {rule.points}
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl">{copy.label}</h3>
              <p className="mt-1 text-sm font-bold tracking-wide uppercase" style={{ color: rule.tone }}>
                {rule.title}
              </p>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{copy.detail}</p>
            </motion.article>
          );
        })}
      </div>
      <p className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        Each unit has 75 squares. Laser tag waits at 20 and ice cream at 35. Teacher takedowns at
        25, 30, 40, 45, and 50 stay a secret until the day. A cross marks a strike on the sheet.
        A full track stays full. A strike cannot push a unit below zero.
      </p>
    </div>
  );
}
