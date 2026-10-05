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
  },
  {
    action: "surge" as const,
    icon: Zap,
    tone: "#2ec9a0",
    title: "Amazing work",
  },
  {
    action: "strike" as const,
    icon: CircleMinus,
    tone: "#ff8b8b",
    title: "Crosses",
  },
  {
    action: "teamwork" as const,
    icon: Users,
    tone: "#8b7cf7",
    title: "Cross-class teamwork",
  },
];

function pointsLabel(action: keyof typeof ACTION_COPY) {
  const delta = ACTION_COPY[action].delta;
  if (action === "teamwork") return `+${delta} all`;
  if (delta < 0) return `−${Math.abs(delta)}`;
  return `+${delta}`;
}

export function RulesView({ paired = false }: { paired?: boolean }) {
  return (
    <div className={paired ? "grid h-full grid-cols-2 gap-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
      {rules.map((rule, index) => {
        const Icon = rule.icon;
        const copy = ACTION_COPY[rule.action];
        return (
          <motion.article
            key={rule.action}
            initial={{ opacity: 1, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="flex h-full flex-col justify-center rounded-[28px] border-[3px] bg-white p-4"
            style={{ borderColor: rule.tone, boxShadow: `0 7px 0 ${rule.tone}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <span
                className="grid size-12 place-items-center rounded-2xl"
                style={{ background: rule.tone, color: "#1a1408" }}
              >
                <Icon className="size-6" />
              </span>
              <span className="font-display text-3xl text-[#2a2218] tabular-nums">{pointsLabel(rule.action)}</span>
            </div>
            <h3 className="mt-3 font-display text-2xl leading-tight">{copy.label}</h3>
            <p className="mt-1 text-sm font-bold tracking-wide uppercase" style={{ color: rule.tone }}>
              {rule.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.detail}</p>
          </motion.article>
        );
      })}
    </div>
  );
}
