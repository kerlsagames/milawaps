"use client";

import { useEffect, useState } from "react";
import { Check, Gift, Sparkles, X } from "lucide-react";
import { useDeskPrefs, type RevealMap } from "@/lib/desk-prefs";
import type { PublicBoard } from "@/lib/game";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";
import { TODAY_PAGE_LIMIT, todayFeed, type TodayKind } from "@/lib/today";
import { cn } from "@/lib/utils";

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

function KindMark({ kind }: { kind: TodayKind }) {
  if (kind === "tick") {
    return (
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-[#0d7a64] text-white shadow-[0_2px_0_#0a5a4a]"
        aria-label="Tick"
        title="Tick"
      >
        <Check className="size-4 stroke-[3]" aria-hidden="true" />
      </span>
    );
  }
  if (kind === "strike") {
    return (
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-[#c23b3b] bg-white text-[#c23b3b] shadow-[0_2px_0_#8d1f1f33]"
        aria-label="Strike"
        title="Strike"
      >
        <X className="size-4 stroke-[3]" aria-hidden="true" />
      </span>
    );
  }
  if (kind === "highlight") {
    return (
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-[#7b4bff] text-white shadow-[0_2px_0_#4c2d9e]"
        aria-label="Highlight"
        title="Highlight"
      >
        <Sparkles className="size-3.5 stroke-[2.5]" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e2a01a] text-[#2a1c04] shadow-[0_2px_0_#8a5a00]"
      aria-label="Prize"
      title="Prize"
    >
      <Gift className="size-3.5 stroke-[2.5]" aria-hidden="true" />
    </span>
  );
}

export function TodayColumn({
  board,
  live,
  variant = "kiosk",
}: {
  board: PublicBoard | undefined;
  live?: "loading" | "live" | "offline";
  /** `page` is the phone/desk Today tab; `board` is the desktop sidebar. */
  variant?: "kiosk" | "board" | "page";
}) {
  const prefs = useDeskPrefs();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const items = board
    ? todayFeed(
        board,
        now,
        (points, title) => prizeName(points, title, prefs.reveals, now),
        variant === "page" ? TODAY_PAGE_LIMIT : undefined,
      )
    : [];

  return (
    <aside
      aria-label="Today"
      className={cn(
        "flex min-h-0 flex-col gap-2 bg-[#fffdf8] px-3",
        variant === "kiosk" &&
          cn(
            "w-[min(24rem,46vw)] shrink-0 border-l-4 border-[#e2a01a] pt-4",
            prefs.timer === "blocks" ? "pb-16" : "pb-28",
          ),
        // Phones: hide sidebar so the leaderboard gets the full screen.
        // Desktop (lg+): keep the sidebar beside the board.
        variant === "board" &&
          "hidden lg:flex lg:w-96 lg:shrink-0 lg:border-l-4 lg:border-[#e2a01a] lg:py-4",
        variant === "page" &&
          "h-full w-full flex-1 rounded-[28px] border-4 border-[#e2a01a] px-3 py-4 sm:px-4",
      )}
    >
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-4xl leading-none">Today</h2>
          {variant === "page" ? (
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              What has been given on yard duty today.
            </p>
          ) : null}
        </div>
        {variant === "kiosk" && live ? <KioskStatus live={live} /> : null}
        {variant === "page" && live ? <KioskStatus live={live} /> : null}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-white px-3 py-3 text-sm font-bold text-muted-foreground">
          No ticks, strikes, highlights, or prizes yet today.
        </p>
      ) : (
        <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-2.5 rounded-2xl border border-black/5 bg-white px-3 py-2"
            >
              <KindMark kind={item.kind} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm leading-snug font-bold sm:text-base">
                    {item.text}
                    {item.kind === "highlight" && item.points ? (
                      <span
                        className="ml-1.5 inline-block translate-y-[-1px] rounded-md bg-[#0d7a64] px-1.5 py-0.5 align-middle text-[10px] font-black tracking-wide text-white"
                        aria-label={`Plus ${item.points} ${item.points === 1 ? "point" : "points"}`}
                      >
                        +{item.points}
                      </span>
                    ) : null}
                  </p>
                  <p className="shrink-0 pt-0.5 text-[10px] font-bold text-muted-foreground sm:text-xs">
                    {eventTime(item.at)}
                  </p>
                </div>
              </div>
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
