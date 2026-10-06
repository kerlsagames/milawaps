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
  const when = new Date(finishAt).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section
      className="rounded-2xl border-4 border-[#2a1c04] bg-[#2a1c04] px-3 py-2 text-[#ffe08a] shadow-[0_4px_0_#6b5844] lg:rounded-[28px] lg:px-5 lg:py-3 lg:shadow-[0_6px_0_#6b5844]"
      aria-label={done ? "Time's up" : `${remainLabel(parts)} to go`}
    >
      {done ? (
        <p className="text-center font-display text-3xl leading-none lg:text-5xl">Time's up</p>
      ) : (
        <>
          <div className="flex items-end justify-center gap-3 sm:gap-6 lg:gap-10">
            <Tick n={parts.days} label={parts.days === 1 ? "day" : "days"} />
            <Tick n={parts.hours} label={parts.hours === 1 ? "hour" : "hours"} />
            <Tick n={parts.minutes} label={parts.minutes === 1 ? "minute" : "minutes"} />
            <Tick n={parts.seconds} label={parts.seconds === 1 ? "second" : "seconds"} />
          </div>
          <p className="mt-2 text-center font-display text-xl leading-none lg:text-3xl">to go</p>
        </>
      )}
      <p className="mt-1 text-center text-xs font-bold text-[#f5b942] lg:text-sm">{when}</p>
    </section>
  );
}

function Tick({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-4xl leading-none tabular-nums lg:text-6xl">{n}</p>
      <p className="mt-1 text-[10px] font-extrabold tracking-[0.14em] uppercase lg:text-sm">{label}</p>
    </div>
  );
}
