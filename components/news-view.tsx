"use client";

import type { ReactNode } from "react";
import type { DailyNews } from "@/lib/news";
import type { NewsLayoutId } from "@/lib/site-display";
import { cn } from "@/lib/utils";

export function NewsView({
  news,
  layout = "split",
}: {
  news: DailyNews;
  layout?: NewsLayoutId;
}) {
  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border-4 border-[#1f6f8b] bg-[radial-gradient(circle_at_top_left,#ffe08a_0%,#fff8df_38%,#d9f4ff_100%)] p-2.5 sm:p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0 2px, transparent 3px), radial-gradient(circle at 80% 40%, rgba(31,111,139,0.18) 0 3px, transparent 4px)",
          backgroundSize: "28px 28px, 42px 42px",
        }}
      />
      <header className="relative shrink-0 text-center">
        <p className="text-[10px] font-extrabold tracking-[0.28em] text-[#1f6f8b] uppercase sm:text-xs">
          Daily Feed
        </p>
        <h2
          className={cn(
            "font-display leading-none text-[#16384a]",
            layout === "boards"
              ? "text-[clamp(2.1rem,5.2vh,4.25rem)]"
              : "text-[clamp(1.9rem,4.6vh,3.9rem)]",
          )}
        >
          <span className="line-clamp-2">{news.headline}</span>
        </h2>
        {news.blurb ? (
          <p
            className={cn(
              "mx-auto mt-1 max-w-4xl font-bold leading-snug text-[#3d5f70]",
              layout === "boards"
                ? "text-[clamp(1rem,2.2vh,1.45rem)]"
                : "text-[clamp(0.95rem,1.9vh,1.3rem)]",
            )}
          >
            <span className="line-clamp-2">{news.blurb}</span>
          </p>
        ) : null}
      </header>

      {layout === "stack" ? (
        <StackLayout news={news} />
      ) : layout === "boards" ? (
        <BoardsLayout news={news} />
      ) : (
        <SplitLayout news={news} />
      )}
    </div>
  );
}

function SplitLayout({ news }: { news: DailyNews }) {
  return (
    <div className="relative mt-2 grid min-h-0 flex-1 gap-2 overflow-hidden lg:mt-3 lg:grid-cols-[1.25fr_0.75fr] lg:gap-3">
      <section className="flex min-h-0 flex-col gap-2 overflow-hidden">
        <RemindersPanel news={news} size="md" />
        <UpcomingPanel news={news} size="md" />
        {news.challenge ? <ChallengePanel text={news.challenge} size="md" /> : null}
      </section>
      <PhotoPanel news={news} className="hidden lg:block" />
    </div>
  );
}

function StackLayout({ news }: { news: DailyNews }) {
  return (
    <div className="relative mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:mt-3">
      <PhotoPanel news={news} className="h-[28%] max-h-48 shrink-0" />
      <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-2">
        <RemindersPanel news={news} size="lg" />
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
          <UpcomingPanel news={news} size="lg" />
          {news.challenge ? <ChallengePanel text={news.challenge} size="lg" /> : null}
        </div>
      </div>
    </div>
  );
}

function BoardsLayout({ news }: { news: DailyNews }) {
  return (
    <div className="relative mt-2 grid min-h-0 flex-1 gap-2 overflow-hidden lg:mt-3 lg:grid-cols-2 lg:gap-3">
      <RemindersPanel news={news} size="xl" />
      <div className="flex min-h-0 flex-col gap-2 overflow-hidden">
        <UpcomingPanel news={news} size="xl" />
        {news.challenge ? <ChallengePanel text={news.challenge} size="xl" /> : null}
      </div>
    </div>
  );
}

function RemindersPanel({ news, size }: { news: DailyNews; size: TextSize }) {
  return (
    <Panel title="Reminders" tone="#ff7a59">
      {news.reminders.length === 0 ? (
        <Empty line="No reminders on the board yet." />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
          {news.reminders.map((item) => (
            <li
              key={item.id}
              className={cn(
                "min-h-0 overflow-hidden rounded-xl bg-white/95 px-3 py-2 font-extrabold break-words text-[#2a1c04] shadow-[0_2px_0_rgba(42,28,4,0.12)]",
                textClass(size),
              )}
            >
              <span className={lineClampFor(news.reminders.length)}>{item.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function UpcomingPanel({ news, size }: { news: DailyNews; size: TextSize }) {
  return (
    <Panel title="Coming up" tone="#2ec9a0">
      {news.upcoming.length === 0 ? (
        <Empty line="Nothing on the calendar yet." />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
          {news.upcoming.map((item) => (
            <li
              key={item.id}
              className="min-h-0 overflow-hidden rounded-xl bg-white/95 px-3 py-2 shadow-[0_2px_0_rgba(42,28,4,0.08)]"
            >
              {item.when ? (
                <p className="text-[clamp(0.7rem,1.3vh,0.9rem)] font-extrabold tracking-[0.14em] text-[#0d7a64] uppercase">
                  {item.when}
                </p>
              ) : null}
              <p className={cn("leading-snug font-extrabold break-words text-[#2a1c04]", textClass(size))}>
                <span className={lineClampFor(news.upcoming.length)}>{item.text}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ChallengePanel({ text, size }: { text: string; size: TextSize }) {
  return (
    <Panel title="Yard challenge" tone="#7b4bff" grow={false}>
      <p
        className={cn(
          "rounded-xl bg-white/95 px-3 py-2 leading-snug font-extrabold break-words text-[#2a1c04]",
          textClass(size),
        )}
      >
        <span className="line-clamp-3">{text}</span>
      </p>
    </Panel>
  );
}

function PhotoPanel({ news, className }: { news: DailyNews; className?: string }) {
  return (
    <section
      className={cn(
        "relative min-h-0 overflow-hidden rounded-[24px] border-4 border-[#16384a] bg-[#fffdf8] shadow-[0_8px_0_#0d2430]",
        className,
      )}
    >
      {news.picture ? (
        <img src={news.picture} alt="" className="size-full object-cover" />
      ) : (
        <div className="grid size-full place-items-center bg-[linear-gradient(135deg,#ffe08a,#8fdfff)] p-4 text-center">
          <div>
            <p className="font-display text-3xl text-[#16384a]">Scoop!</p>
            <p className="mt-1 text-sm font-bold text-[#3d5f70]">
              Add a photo in Settings to make the news pop.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

type TextSize = "md" | "lg" | "xl";

function textClass(size: TextSize) {
  if (size === "xl") return "text-[clamp(1.2rem,2.8vh,2.1rem)]";
  if (size === "lg") return "text-[clamp(1.1rem,2.5vh,1.85rem)]";
  return "text-[clamp(1.05rem,2.3vh,1.7rem)]";
}

function lineClampFor(count: number) {
  if (count <= 2) return "line-clamp-4";
  if (count <= 4) return "line-clamp-3";
  return "line-clamp-2";
}

function Panel({
  title,
  tone,
  children,
  grow = true,
}: {
  title: string;
  tone: string;
  children: ReactNode;
  grow?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 bg-[#fffdf8]/95 p-2.5 shadow-[0_6px_0_rgba(22,56,74,0.16)]",
        grow ? "flex-1" : "shrink-0",
      )}
      style={{ borderColor: tone }}
    >
      <p
        className="mb-1.5 shrink-0 text-[clamp(0.7rem,1.3vh,0.9rem)] font-extrabold tracking-[0.2em] uppercase"
        style={{ color: tone }}
      >
        {title}
      </p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return <p className="text-base font-bold text-muted-foreground">{line}</p>;
}
