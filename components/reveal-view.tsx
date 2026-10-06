"use client";

import { useEffect, useState } from "react";
import { remainLabel, remainParts } from "@/lib/remain";
import type { RevealDef } from "@/lib/reveals";

export function RevealView({
  reveal,
  revealAt,
  prize,
}: {
  reveal: RevealDef;
  revealAt: number | null;
  prize: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  const due = revealAt != null && now >= revealAt;
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!due) {
      setFlipped(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setFlipped(true), reduce ? 0 : 900);
    return () => window.clearTimeout(id);
  }, [due, reveal.id]);

  const remain = revealAt == null ? null : revealAt - now;
  const count = remain == null || remain <= 0 ? null : remainParts(remain);
  const line = prize.trim();

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 lg:flex-row lg:gap-10">
      <div className="min-w-0 flex-1 text-center lg:text-left">
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">Prize reveal</p>
        {count ? (
          <>
            <div
              className="mt-3 flex justify-center gap-4 sm:gap-8 lg:justify-start"
              aria-label={`${remainLabel(count)} until ${reveal.title} is revealed`}
            >
              <RevealTick n={count.days} label={count.days === 1 ? "day" : "days"} />
              <RevealTick n={count.hours} label={count.hours === 1 ? "hour" : "hours"} />
              <RevealTick n={count.minutes} label={count.minutes === 1 ? "minute" : "minutes"} />
            </div>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">
              until {reveal.title} is revealed
            </h2>
          </>
        ) : due ? (
          <>
            <p className="mt-2 text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">It is time</p>
            <h2 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{reveal.title}</h2>
            {flipped && line ? (
              <p className="mt-4 max-w-3xl text-2xl leading-snug font-extrabold sm:text-4xl">{line}</p>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{reveal.title}</h2>
            <p className="mt-3 text-xl font-extrabold text-muted-foreground">Coming soon</p>
          </>
        )}
      </div>
      <FlipCard reveal={reveal} flipped={flipped} prize={line} />
    </div>
  );
}

function FlipCard({
  reveal,
  flipped,
  prize,
}: {
  reveal: RevealDef;
  flipped: boolean;
  prize: string;
}) {
  return (
    <div
      className={reveal.wide ? "w-full max-w-[42rem] shrink-0" : "w-full max-w-[24rem] shrink-0 sm:max-w-[32rem]"}
      style={{ perspective: "1400px" }}
    >
      <div
        className={reveal.wide ? "relative aspect-[4/3] w-full" : "relative aspect-[3/4] w-full"}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] border-4 border-[#2a1c04] bg-[#cfc6b8] shadow-[0_10px_0_#6b5844]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <SilhouettePair />
        </div>
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] border-4 border-[#f5b942] bg-[#fff8ec] shadow-[0_10px_0_#c48a16]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <PrizeArt src={reveal.image} title={reveal.title} prize={prize} />
        </div>
      </div>
    </div>
  );
}

function SilhouettePair() {
  return (
    <div className="relative size-full">
      <img
        src="/mystery-teacher-a.jpg"
        alt=""
        className="absolute top-[7%] left-[2%] w-[64%] rounded-[22px] object-cover shadow-[0_14px_28px_rgba(20,12,4,0.35)]"
        style={{ aspectRatio: "3 / 4", transform: "rotate(-8deg)" }}
      />
      <img
        src="/mystery-teacher-b.jpg"
        alt=""
        className="absolute right-[2%] bottom-[7%] w-[64%] rounded-[22px] object-cover shadow-[0_16px_30px_rgba(20,12,4,0.4)]"
        style={{ aspectRatio: "3 / 4", transform: "rotate(8deg)" }}
      />
    </div>
  );
}

function PrizeArt({ src, title, prize }: { src: string; title: string; prize: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-5 text-center">
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-gold uppercase">{title}</p>
        {prize ? <p className="mt-3 font-display text-3xl leading-tight sm:text-4xl">{prize}</p> : null}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={prize || title}
      onError={() => setFailed(true)}
      className="size-full object-cover"
    />
  );
}

function RevealTick({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-5xl leading-none tabular-nums sm:text-7xl">{n}</p>
      <p className="mt-1 text-[11px] font-extrabold tracking-[0.14em] text-muted-foreground uppercase sm:text-sm">
        {label}
      </p>
    </div>
  );
}
