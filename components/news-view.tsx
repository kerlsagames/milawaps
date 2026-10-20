"use client";

import type { ReactNode } from "react";
import type { DailyNews } from "@/lib/news";

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
      <header className="relative shrink-0 text-center">
        <p className="text-[11px] font-extrabold tracking-[0.28em] text-[#1f6f8b] uppercase sm:text-sm">
          Daily Feed
        </p>
        <h2 className="font-display text-4xl leading-none text-[#16384a] sm:text-5xl lg:text-6xl xl:text-7xl">
          {news.headline}
        </h2>
        {news.blurb ? (
          <p className="mx-auto mt-2 max-w-3xl text-base font-bold text-[#3d5f70] sm:text-xl">
            {news.blurb}
          </p>
        ) : null}
      </header>

      <div className="relative grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[1.25fr_0.75fr] lg:gap-4">
        <section className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <Panel title="Reminders" tone="#ff7a59">
            {news.reminders.length === 0 ? (
              <Empty line="No reminders on the board yet." />
            ) : (
              <ul className="grid gap-2.5">
                {news.reminders.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl bg-white/90 px-4 py-3 text-lg font-extrabold text-[#2a1c04] shadow-[0_3px_0_rgba(42,28,4,0.12)] sm:text-xl lg:text-2xl"
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
              <ul className="grid gap-2.5">
                {news.upcoming.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-white/90 px-4 py-3">
                    {item.when ? (
                      <p className="text-xs font-extrabold tracking-[0.16em] text-[#0d7a64] uppercase sm:text-sm">
                        {item.when}
                      </p>
                    ) : null}
                    <p className="text-lg font-extrabold text-[#2a1c04] sm:text-xl lg:text-2xl">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {news.challenge ? (
            <Panel title="Yard challenge" tone="#7b4bff">
              <p className="rounded-2xl bg-white/90 px-4 py-3 text-lg font-extrabold text-[#2a1c04] shadow-[0_3px_0_rgba(42,28,4,0.12)] sm:text-xl lg:text-2xl">
                {news.challenge}
              </p>
            </Panel>
          ) : null}
        </section>
        <section className="relative min-h-0 overflow-hidden rounded-[28px] border-4 border-[#16384a] bg-[#fffdf8] shadow-[0_10px_0_#0d2430]">
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
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border-4 bg-[#fffdf8]/95 p-3 shadow-[0_8px_0_rgba(22,56,74,0.18)] sm:p-4"
      style={{ borderColor: tone }}
    >
      <p
        className="mb-2 shrink-0 text-xs font-extrabold tracking-[0.22em] uppercase sm:text-sm"
        style={{ color: tone }}
      >
        {title}
      </p>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return <p className="text-base font-bold text-muted-foreground sm:text-lg">{line}</p>;
}
