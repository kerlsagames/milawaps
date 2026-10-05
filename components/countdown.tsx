"use client";

import { useEffect, useState } from "react";
import { useDeskPrefs } from "@/lib/desk-prefs";

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

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
  const days = Math.floor(remain / DAY);
  const hours = Math.floor((remain % DAY) / HOUR);
  const minutes = Math.floor((remain % HOUR) / MINUTE);
  const big = done ? "0" : days >= 1 ? String(days) : hours >= 1 ? String(hours) : String(Math.max(0, minutes));
  const label = done
    ? "Time's up"
    : days >= 1
      ? days === 1
        ? "day to go"
        : "days to go"
      : hours >= 1
        ? hours === 1
          ? "hour to go"
          : "hours to go"
        : minutes === 1
          ? "minute to go"
          : "minutes to go";
  const extra = !done && days >= 1 && hours > 0 ? `${hours} ${hours === 1 ? "hour" : "hours"} left after that` : null;
  const when = new Date(finishAt).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <section
      className="flex items-center justify-center gap-3 rounded-2xl border-4 border-[#2a1c04] bg-[#2a1c04] px-3 py-2 text-[#ffe08a] shadow-[0_4px_0_#6b5844] lg:gap-6 lg:rounded-[28px] lg:px-4 lg:py-4 lg:shadow-[0_6px_0_#6b5844]"
      aria-label={done ? "Time's up" : `${big} ${label}`}
    >
      <p className="font-display text-4xl leading-none tabular-nums lg:text-7xl">{big}</p>
      <div className="min-w-0">
        <p className="font-display text-xl leading-none lg:text-4xl">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-[#f5b942]">{extra ?? when}</p>
      </div>
    </section>
  );
}
