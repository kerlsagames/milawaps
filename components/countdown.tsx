"use client";

import { useEffect, useState } from "react";
import { useDeskPrefs } from "@/lib/desk-prefs";
import { remainLabel, remainParts } from "@/lib/remain";

export function Countdown() {
  const { finishAt } = useDeskPrefs();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!finishAt) return null;

  const remain = finishAt - now;
  const done = remain <= 0;
  const parts = remainParts(remain);

  return (
    <section
      className="w-full max-w-3xl shrink-0 rounded-2xl border-4 border-[#2a1c04] bg-[#2a1c04] px-3 py-2 text-[#ffe08a] shadow-[0_4px_0_#6b5844] lg:rounded-[28px] lg:px-8 lg:py-3 lg:shadow-[0_6px_0_#6b5844]"
      aria-label={done ? "Countdown clock. Time's up" : `Countdown clock. ${remainLabel(parts)}`}
    >
      <div className="flex items-center justify-center gap-3 lg:gap-10">
        <p className="shrink-0 font-display text-sm leading-none lg:text-3xl">
          <span className="lg:hidden">Clock</span>
          <span className="hidden lg:inline">Countdown clock</span>
        </p>
        {done ? (
          <p className="font-display text-2xl leading-none lg:text-5xl">Time's up</p>
        ) : (
          <div className="flex items-end gap-2 lg:gap-6">
            <Tick n={parts.days} label={parts.days === 1 ? "day" : "days"} />
            <Tick n={parts.hours} label={parts.hours === 1 ? "hour" : "hours"} />
            <Tick n={parts.minutes} label={parts.minutes === 1 ? "minute" : "minutes"} />
            <Tick n={parts.seconds} label={parts.seconds === 1 ? "second" : "seconds"} />
          </div>
        )}
      </div>
    </section>
  );
}

function Tick({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-xl leading-none tabular-nums lg:text-5xl">{n}</p>
      <p className="mt-0.5 text-[9px] font-extrabold tracking-[0.12em] uppercase lg:mt-1 lg:text-sm">{label}</p>
    </div>
  );
}
