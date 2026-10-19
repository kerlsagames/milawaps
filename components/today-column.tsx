"use client";

import { useEffect, useState } from "react";
import { useDeskPrefs, type RevealMap } from "@/lib/desk-prefs";
import type { PublicBoard } from "@/lib/game";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";
import { todayFeed, type TodayKind } from "@/lib/today";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<TodayKind, string> = {
  tick: "Tick",
  strike: "Strike",
  unlock: "Prize",
};

function prizeName(points: number, title: string, reveals: RevealMap, now: number) {
  const reveal = revealForPoints(points);
  if (!reveal) return title;
  const saved = reveals[reveal.id];
  if (!prizeIsPublic(saved?.at, now)) {
    return reveal.wide ? "a secret prize" : "a teacher takedown";
  }
  return saved?.label?.trim() || title;
}

function eventTime(at: number) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "numeric",
    minute: "2-digit",
  }).format(at);
}

export function TodayColumn({
  board,
  live,
  variant = "kiosk",
}: {
  board: PublicBoard | undefined;
  live?: "loading" | "live" | "offline";
  variant?: "kiosk" | "board";
}) {
  const prefs = useDeskPrefs();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const items = board
    ? todayFeed(board, now, (points, title) => prizeName(points, title, prefs.reveals, now))
    : [];

  return (
    <aside
      aria-label="Today"
      className={cn(
        "flex min-h-0 flex-col gap-2 bg-[#fffdf8] px-3",
        variant === "kiosk"
          ? cn(
              "w-[min(19rem,40vw)] shrink-0 border-l-4 border-[#e2a01a] pt-4",
              prefs.timer === "blocks" ? "pb-16" : "pb-28",
            )
          : "order-1 max-h-56 w-full overflow-hidden border-b-4 border-[#e2a01a] py-3 lg:order-2 lg:max-h-none lg:w-[19rem] lg:shrink-0 lg:border-b-0 lg:border-l-4 lg:py-4",
      )}
    >
      <div className="flex items-end justify-between gap-2">
        <h2 className="font-display text-4xl leading-none">Today</h2>
        {variant === "kiosk" && live ? <KioskStatus live={live} /> : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white px-3 py-3 text-sm font-bold text-muted-foreground">
          No ticks, strikes, or prizes yet today.
        </p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-black/5 bg-white px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-[10px] font-extrabold tracking-[0.16em] uppercase",
                    item.kind === "tick" && "text-[#0d7a64]",
                    item.kind === "strike" && "text-[#8d1f1f]",
                    item.kind === "unlock" && "text-[#8a5a00]",
                  )}
                >
                  {KIND_LABEL[item.kind]}
                </p>
                <p className="text-[10px] font-bold text-muted-foreground">{eventTime(item.at)}</p>
              </div>
              <p className="text-sm leading-snug font-bold">{item.text}</p>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function KioskStatus({ live }: { live: "loading" | "live" | "offline" }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat("en-AU", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] font-bold">
      <span
        className={cn(
          "size-2 rounded-full",
          live === "live" && "bg-[#2ec9a0] shadow-[0_0_8px_#2ec9a0]",
          live === "loading" && "bg-gold",
          live === "offline" && "bg-[#ff8b8b]",
        )}
      />
      {live === "live" ? "Live" : live === "loading" ? "Linking" : "Offline"}
      <span className="text-muted-foreground">{clock}</span>
    </div>
  );
}
