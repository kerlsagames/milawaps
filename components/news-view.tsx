"use client";

import { memo, useEffect, useState, type ReactNode } from "react";
import type { DailyNews } from "@/lib/news";

const dateFmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const timeFmt = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Melbourne",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

/** Own timer so the rest of Daily News does not re-render (or re-scale) every second. */
const LiveClock = memo(function LiveClock() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="rounded-[24px] border-4 border-[#16384a] bg-[#16384a] px-4 py-3 text-[#ffe08a] shadow-[0_8px_0_#0d2430]">
      <p className="text-[10px] font-extrabold tracking-[0.22em] uppercase">Live clock</p>
      <p className="font-display text-lg leading-none sm:text-2xl">{dateFmt.format(now)}</p>
      <p className="mt-1 font-display text-2xl leading-none tabular-nums sm:text-4xl">
        {timeFmt.format(now)}
      </p>
    </div>
  );
});

export function NewsView({ news }: { news: DailyNews }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden rounded-[32px] border-4 border-[#1f6f8b] bg-[radial-gradient(circle_at_top_left,#ffe08a_0%,#fff8df_38%,#d9f4ff_100%)] p-3 lg:gap-4 lg:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.7) 0 2px, transparent 3px), radial-gradient(circle at 80% 40%, rgba(31,111,139,0.18) 0 3px, transparent 4px)",
          backgroundSize: "28px 28px, 42px 42px",
        }}
      />
      <header className="relative flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.28em] text-[#1f6f8b] uppercase">
            Daily News
          </p>
          <h2 className="font-display text-4xl leading-none text-[#16384a] sm:text-6xl">
            {news.headline}
          </h2>
          {news.blurb ? (
            <p className="mt-2 max-w-3xl text-base font-bold text-[#3d5f70] sm:text-xl">{news.blurb}</p>
          ) : null}
        </div>
        <LiveClock />
      </header>

      <div className="relative grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex min-h-0 flex-col gap-3">
          <Panel title="Reminders" tone="#ff7a59">
            {news.reminders.length === 0 ? (
              <Empty line="No reminders on the board yet." />
            ) : (
              <ul className="grid gap-2">
                {news.reminders.map((item, index) => (
                  <li
                    key={item.id}
                    className="rounded-2xl bg-white/90 px-3 py-2 text-base font-extrabold text-[#2a1c04] shadow-[0_3px_0_rgba(42,28,4,0.12)]"
                    style={{ transform: `rotate(${index % 2 === 0 ? -0.8 : 0.8}deg)` }}
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Coming up" tone="#2ec9a0">
            {news.upcoming.length === 0 ? (
              <Empty line="Nothing on the calendar yet." />
            ) : (
              <ul className="grid gap-2">
                {news.upcoming.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-white/90 px-3 py-2">
                    {item.when ? (
                      <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#0d7a64] uppercase">
                        {item.when}
                      </p>
                    ) : null}
                    <p className="text-base font-extrabold text-[#2a1c04]">{item.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {news.challenge ? (
            <Panel title="Yard challenge" tone="#7b4bff">
              <p className="rounded-2xl bg-white/90 px-3 py-3 text-base font-extrabold text-[#2a1c04] shadow-[0_3px_0_rgba(42,28,4,0.12)]">
                {news.challenge}
              </p>
            </Panel>
          ) : null}
        </section>
        <section className="relative min-h-[14rem] overflow-hidden rounded-[28px] border-4 border-[#16384a] bg-[#fffdf8] shadow-[0_10px_0_#0d2430]">
          {news.picture ? (
            <img src={news.picture} alt="" className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-[linear-gradient(135deg,#ffe08a,#8fdfff)] p-6 text-center">
              <div>
                <p className="font-display text-4xl text-[#16384a]">Scoop!</p>
                <p className="mt-2 text-lg font-bold text-[#3d5f70]">
                  Add a photo in Settings to make the news pop.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Panel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto rounded-[28px] border-4 bg-[#fffdf8]/95 p-3 shadow-[0_8px_0_rgba(22,56,74,0.18)]"
      style={{ borderColor: tone }}
    >
      <p className="mb-2 text-[11px] font-extrabold tracking-[0.22em] uppercase" style={{ color: tone }}>
        {title}
      </p>
      {children}
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return <p className="text-sm font-bold text-muted-foreground">{line}</p>;
}
