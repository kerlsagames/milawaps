"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useDeskPrefs, type RevealMap } from "@/lib/desk-prefs";
import { UNIT_MAX, UNITS, type PublicBoard, type UnitId } from "@/lib/game";
import { prizeIsPublic, revealForPoints } from "@/lib/reveals";
import { feedEventStamp, todayFeed, type TodayItem } from "@/lib/today";
import { Button } from "@/components/ui/button";
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

function canRemoveItem(item: TodayItem, board: PublicBoard) {
  if (item.kind === "unlock") return false;
  if (item.kind === "highlight") return true;
  return board.log.some(
    (entry) =>
      entry.id === item.id &&
      (entry.action === "spot" ||
        entry.action === "surge" ||
        entry.action === "strike" ||
        entry.action === "teamwork" ||
        entry.action === "adjust"),
  );
}

export function EditPointsView({
  board,
  busyId,
  error,
  onAdjust,
  onRemoveFeedItem,
}: {
  board: PublicBoard;
  busyId: string | null;
  error: string | null;
  onAdjust: (unitId: UnitId, delta: 1 | -1) => void;
  onRemoveFeedItem: (item: TodayItem) => void;
}) {
  const prefs = useDeskPrefs();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const items = todayFeed(
    board,
    now,
    (points, title) => prizeName(points, title, prefs.reveals, now),
    20,
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden lg:flex-row lg:gap-4">
      <section className="flex shrink-0 flex-col gap-2 rounded-[28px] border-4 border-[#2a1c04] bg-[#fffdf8] p-3 lg:w-[22rem] lg:p-4">
        <div>
          <h2 className="font-display text-3xl leading-none">Change scores</h2>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            Fix a mistaken tally without adding a strike. −1 only lowers the score.
          </p>
        </div>
        <div className="grid gap-2">
          {UNITS.map((unit) => {
            const score = board.units[unit.id] ?? 0;
            return (
              <div
                key={unit.id}
                className="flex items-center gap-2 rounded-2xl border-2 px-2 py-2"
                style={{ borderColor: unit.color, background: unit.soft }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl leading-none" style={{ color: unit.deep }}>
                    {unit.code}
                  </p>
                  <p className="font-display text-3xl leading-none tabular-nums">
                    {score}
                    <span className="text-base text-muted-foreground">/{UNIT_MAX}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  aria-label={`Lower ${unit.code} by one`}
                  disabled={busyId !== null || score <= 0}
                  onClick={() => onAdjust(unit.id, -1)}
                  className="size-12 rounded-xl border-[#c23b3b]/40 bg-white text-[#8d1f1f]"
                >
                  <Minus className="size-5" />
                </Button>
                <Button
                  type="button"
                  aria-label={`Raise ${unit.code} by one`}
                  disabled={busyId !== null || score >= UNIT_MAX}
                  onClick={() => onAdjust(unit.id, 1)}
                  className="size-12 rounded-xl"
                  style={{ background: unit.color, color: unit.ink }}
                >
                  <Plus className="size-5" />
                </Button>
              </div>
            );
          })}
        </div>
        {error ? (
          <p
            className="rounded-xl bg-[#c23b3b]/10 px-3 py-2 text-sm font-semibold text-[#8d1f1f]"
            role="status"
          >
            {error}
          </p>
        ) : null}
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2 rounded-[28px] border-4 border-[#e2a01a] bg-[#fffdf8] p-3 lg:p-4">
        <div>
          <h2 className="font-display text-3xl leading-none">Latest Feed</h2>
          <p className="mt-1 text-sm font-bold text-muted-foreground">
            Remove a tick to take those points back off the board.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white px-3 py-3 text-sm font-bold text-muted-foreground">
            No ticks to edit yet.
          </p>
        ) : (
          <ol className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {items.map((item) => {
              const removable = canRemoveItem(item, board);
              const busy = busyId === item.id;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2 rounded-2xl border border-black/5 bg-white px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-bold sm:text-base">{item.text}</p>
                    <p className="mt-0.5 text-[11px] font-bold text-muted-foreground">
                      {feedEventStamp(item.at, now)}
                      {item.kind === "highlight" ? " · highlight" : ""}
                    </p>
                  </div>
                  {removable ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busyId !== null}
                      onClick={() => onRemoveFeedItem(item)}
                      className={cn(
                        "h-10 shrink-0 rounded-xl border-[#c23b3b]/40 px-2.5 text-[#8d1f1f]",
                        busy && "opacity-70",
                      )}
                    >
                      <Trash2 className="size-4" />
                      {busy ? "…" : item.kind === "highlight" ? "Remove" : "Remove points"}
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
