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
    <div className="relative mt-2 grid min-h-0 flex-1 gap-2 overflow-hidden lg:mt-3 lg:grid-cols-[1.15fr_0.85fr] lg:gap-3">
      <PhotoPanel news={news} className="min-h-[28%] lg:min-h-0" />
      <ScatterBoard news={news} />
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

/** Split-view right column: bright sticky boards with loud headers (kept square so corners stay visible). */
function ScatterBoard({ news }: { news: DailyNews }) {
  return (
    <div className="relative min-h-0 overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,rgba(255,255,255,0.35)_0%,rgba(255,224,138,0.25)_45%,rgba(143,223,255,0.28)_100%)] p-2 sm:p-3">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-12deg, transparent 0 18px, rgba(31,111,139,0.06) 18px 19px)",
        }}
      />
      <div className="relative flex h-full min-h-0 flex-col justify-evenly gap-2 overflow-hidden py-1 lg:gap-3">
        <TiltCard
          title="Reminders"
          headerFrom="#ff5a3c"
          headerTo="#ff9a3c"
          rotate="0deg"
          z={3}
          bodyClass="bg-[#fff3e8]"
        >
          {news.reminders.length === 0 ? (
            <Empty line="No reminders on the board yet." />
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
              {news.reminders.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    "min-h-0 overflow-hidden rounded-lg border-2 border-[#2a1c04]/20 px-3 py-2 font-black break-words text-[#1a1206] shadow-[2px_2px_0_rgba(42,28,4,0.14)]",
                    CHIP_TONES[index % CHIP_TONES.length],
                    "text-[clamp(1.2rem,2.7vh,2rem)]",
                  )}
                >
                  <span className={lineClampFor(news.reminders.length)}>{item.text}</span>
                </li>
              ))}
            </ul>
          )}
        </TiltCard>

        <TiltCard
          title="Coming up"
          headerFrom="#00b894"
          headerTo="#55efc4"
          rotate="0deg"
          z={2}
          bodyClass="bg-[#e8fff6]"
        >
          {news.upcoming.length === 0 ? (
            <Empty line="Nothing on the calendar yet." />
          ) : (
            <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
              {news.upcoming.map((item, index) => (
                <li
                  key={item.id}
                  className={cn(
                    "min-h-0 overflow-hidden rounded-lg border-2 border-[#0d7a64]/25 px-2.5 py-1.5 shadow-[2px_2px_0_rgba(13,122,100,0.14)]",
                    UPCOMING_TONES[index % UPCOMING_TONES.length],
                  )}
                >
                  {item.when ? (
                    <p className="text-[clamp(0.8rem,1.5vh,1.05rem)] font-black tracking-[0.12em] text-[#0d5c4c] uppercase">
                      {item.when}
                    </p>
                  ) : null}
                  <p className="text-[clamp(1.2rem,2.7vh,2rem)] leading-snug font-black break-words text-[#102a36]">
                    <span className={lineClampFor(news.upcoming.length)}>{item.text}</span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TiltCard>

        {news.challenge ? (
          <TiltCard
            title="Yard challenge"
            headerFrom="#6c5ce7"
            headerTo="#a29bfe"
            rotate="0deg"
            z={4}
            grow={false}
            bodyClass="bg-[#f3eeff]"
          >
            <p className="rounded-lg border-2 border-[#6c5ce7]/35 bg-[#ffe66d] px-3 py-2.5 text-[clamp(1.2rem,2.8vh,2.1rem)] leading-snug font-black break-words text-[#1a1206] shadow-[3px_3px_0_rgba(108,92,231,0.25)]">
              <span className="line-clamp-3">{news.challenge}</span>
            </p>
          </TiltCard>
        ) : null}
      </div>
    </div>
  );
}

const CHIP_TONES = [
  "bg-[#ffd6a5]",
  "bg-[#fdffb6]",
  "bg-[#caffbf]",
  "bg-[#9bf6ff]",
  "bg-[#bdb2ff]",
  "bg-[#ffc6ff]",
] as const;

const UPCOMING_TONES = [
  "bg-[#d8f3dc]",
  "bg-[#b7e4c7]",
  "bg-[#95d5b2]",
  "bg-[#cce3de]",
] as const;

function TiltCard({
  title,
  headerFrom,
  headerTo,
  rotate,
  z,
  children,
  grow = true,
  bodyClass,
}: {
  title: string;
  headerFrom: string;
  headerTo: string;
  rotate: string;
  z: number;
  children: ReactNode;
  grow?: boolean;
  bodyClass: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border-[3px] border-[#2a1c04] shadow-[6px_6px_0_rgba(22,56,74,0.22)]",
        grow ? "flex-1" : "shrink-0",
        bodyClass,
      )}
      style={{
        transform: `rotate(${rotate})`,
        zIndex: z,
      }}
    >
      <div
        className="relative shrink-0 px-3 py-2 sm:px-3.5 sm:py-2.5"
        style={{
          background: `linear-gradient(105deg, ${headerFrom} 0%, ${headerTo} 55%, ${headerFrom} 100%)`,
        }}
      >
        <p
          className="font-display text-[clamp(1.55rem,3.9vh,2.85rem)] leading-none tracking-tight text-white"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,0.28), 2px 2px 0 rgba(0,0,0,0.18)" }}
        >
          {title}
        </p>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(90deg, #fff 0 8px, transparent 8px 14px)",
          }}
        />
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-2.5">{children}</div>
    </div>
  );
}

function RemindersPanel({ news, size }: { news: DailyNews; size: TextSize }) {
  return (
    <Panel title="Reminders" from="#ff5a3c" to="#ff9a3c" body="#fff3e8">
      {news.reminders.length === 0 ? (
        <Empty line="No reminders on the board yet." />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
          {news.reminders.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "min-h-0 overflow-hidden rounded-lg border-2 border-[#2a1c04]/20 px-3 py-2 font-black break-words text-[#1a1206] shadow-[2px_2px_0_rgba(42,28,4,0.14)]",
                CHIP_TONES[index % CHIP_TONES.length],
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
    <Panel title="Coming up" from="#00b894" to="#55efc4" body="#e8fff6">
      {news.upcoming.length === 0 ? (
        <Empty line="Nothing on the calendar yet." />
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
          {news.upcoming.map((item, index) => (
            <li
              key={item.id}
              className={cn(
                "min-h-0 overflow-hidden rounded-lg border-2 border-[#0d7a64]/25 px-3 py-2 shadow-[2px_2px_0_rgba(13,122,100,0.14)]",
                UPCOMING_TONES[index % UPCOMING_TONES.length],
              )}
            >
              {item.when ? (
                <p className="text-[clamp(0.8rem,1.5vh,1.05rem)] font-black tracking-[0.12em] text-[#0d5c4c] uppercase">
                  {item.when}
                </p>
              ) : null}
              <p className={cn("leading-snug font-black break-words text-[#102a36]", textClass(size))}>
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
    <Panel title="Yard challenge" from="#6c5ce7" to="#a29bfe" body="#f3eeff" grow={false}>
      <p
        className={cn(
          "rounded-lg border-2 border-[#6c5ce7]/35 bg-[#ffe66d] px-3 py-2 leading-snug font-black break-words text-[#2a1c04] shadow-[3px_3px_0_rgba(108,92,231,0.25)]",
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
  if (size === "xl") return "text-[clamp(1.35rem,3.1vh,2.35rem)]";
  if (size === "lg") return "text-[clamp(1.25rem,2.8vh,2.15rem)]";
  return "text-[clamp(1.2rem,2.6vh,2rem)]";
}

function lineClampFor(count: number) {
  if (count <= 2) return "line-clamp-4";
  if (count <= 4) return "line-clamp-3";
  return "line-clamp-2";
}

function Panel({
  title,
  from,
  to,
  body,
  children,
  grow = true,
}: {
  title: string;
  from: string;
  to: string;
  body: string;
  children: ReactNode;
  grow?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[22px] border-[3px] border-[#2a1c04] shadow-[5px_5px_0_rgba(22,56,74,0.18)]",
        grow ? "flex-1" : "shrink-0",
      )}
      style={{ background: body }}
    >
      <div
        className="relative shrink-0 px-3 py-2 sm:py-2.5"
        style={{
          background: `linear-gradient(105deg, ${from} 0%, ${to} 55%, ${from} 100%)`,
        }}
      >
        <p
          className="font-display text-[clamp(1.45rem,3.4vh,2.55rem)] leading-none tracking-tight text-white"
          style={{ textShadow: "0 2px 0 rgba(0,0,0,0.28), 2px 2px 0 rgba(0,0,0,0.18)" }}
        >
          {title}
        </p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2.5">{children}</div>
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return <p className="text-base font-bold text-muted-foreground">{line}</p>;
}
