"use client";

import type { ReactNode } from "react";
import type { DailyNews } from "@/lib/news";

export function NewsView({ news }: { news: DailyNews }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden rounded-[28px] border-4 border-[#1f6f8b] bg-[radial-gradient(circle_at_top_left,#ffe08a_0%,#fff8df_38%,#d9f4ff_100%)] p-2.5 sm:gap-3 sm:p-4">
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
        <h2 className="font-display text-[clamp(1.75rem,4.2vh,3.75rem)] leading-none text-[#16384a]">
          {news.headline}
        </h2>
        {news.blurb ? (
          <p className="mx-auto mt-1 max-w-3xl text-[clamp(0.8rem,1.6vh,1.15rem)] font-bold leading-snug text-[#3d5f70]">
            {news.blurb}
          </p>
        ) : null}
      </header>

      <div className="relative grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[1.3fr_0.7fr] lg:gap-3">
        <section className="flex min-h-0 flex-col gap-2 overflow-hidden">
          <Panel title="Reminders" tone="#ff7a59">
            {news.reminders.length === 0 ? (
              <Empty line="No reminders on the board yet." />
            ) : (
              <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5">
                {news.reminders.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl bg-white/95 px-3 py-2 text-[clamp(0.95rem,2.1vh,1.55rem)] leading-snug font-extrabold break-words text-[#2a1c04] shadow-[0_2px_0_rgba(42,28,4,0.12)]"
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
              <ul className="flex min-h-0 flex-1 flex-col justify-evenly gap-1.5">
                {news.upcoming.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl bg-white/95 px-3 py-2 shadow-[0_2px_0_rgba(42,28,4,0.08)]"
                  >
                    {item.when ? (
                      <p className="text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-[0.14em] text-[#0d7a64] uppercase">
                        {item.when}
                      </p>
                    ) : null}
                    <p className="text-[clamp(0.95rem,2.1vh,1.55rem)] leading-snug font-extrabold break-words text-[#2a1c04]">
                      {item.text}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          {news.challenge ? (
            <Panel title="Yard challenge" tone="#7b4bff" grow={false}>
              <p className="rounded-xl bg-white/95 px-3 py-2 text-[clamp(0.95rem,2.1vh,1.55rem)] leading-snug font-extrabold break-words text-[#2a1c04]">
                {news.challenge}
              </p>
            </Panel>
          ) : null}
        </section>
        <section className="relative hidden min-h-0 overflow-hidden rounded-[24px] border-4 border-[#16384a] bg-[#fffdf8] shadow-[0_8px_0_#0d2430] lg:block">
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
      </div>
    </div>
  );
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
      className={`flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 bg-[#fffdf8]/95 p-2.5 shadow-[0_6px_0_rgba(22,56,74,0.16)] ${grow ? "flex-1" : "shrink-0"}`}
      style={{ borderColor: tone }}
    >
      <p
        className="mb-1.5 shrink-0 text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-[0.2em] uppercase"
        style={{ color: tone }}
      >
        {title}
      </p>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function Empty({ line }: { line: string }) {
  return <p className="text-sm font-bold text-muted-foreground">{line}</p>;
}
