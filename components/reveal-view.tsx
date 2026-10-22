"use client";

import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { remainLabel, remainParts } from "@/lib/remain";
import type { RevealDef } from "@/lib/reveals";

export function RevealView({
  reveal,
  revealAt,
  prize,
  image,
  label,
}: {
  reveal: RevealDef;
  revealAt: number | null;
  prize: string;
  image: string | null;
  label: string;
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
  const spoken = label.trim() || reveal.title;
  const name = due ? spoken : reveal.mask;

  // Same stack on desk + student screens: title → countdown → “to go until…”, then the card.
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 overflow-y-auto px-2 py-3 sm:gap-6">
      <div className="w-full max-w-4xl shrink-0 text-center">
        <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">Prize reveal</p>
        {count ? (
          <>
            <div
              className="mt-3 flex justify-center gap-3 sm:gap-6"
              aria-label={`${remainLabel(count)} until ${name} is revealed`}
            >
              <RevealTick n={count.days} label={count.days === 1 ? "day" : "days"} />
              <RevealTick n={count.hours} label={count.hours === 1 ? "hour" : "hours"} />
              <RevealTick n={count.minutes} label={count.minutes === 1 ? "minute" : "minutes"} />
              <RevealTick n={count.seconds} label={count.seconds === 1 ? "second" : "seconds"} />
            </div>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">
              to go until {name} is revealed
            </h2>
          </>
        ) : due ? (
          <>
            <p className="mt-2 text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">It is time</p>
            <h2 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{spoken}</h2>
            {flipped && line ? (
              <p className="mx-auto mt-4 max-w-3xl text-2xl leading-snug font-extrabold sm:text-4xl">
                {line}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="mt-2 font-display text-4xl leading-tight sm:text-6xl">{name}</h2>
            <p className="mt-3 text-xl font-extrabold text-muted-foreground">Coming soon</p>
          </>
        )}
      </div>
      <FlipCard reveal={reveal} flipped={flipped} prize={line} image={image} spoken={spoken} />
    </div>
  );
}

function FlipCard({
  reveal,
  flipped,
  prize,
  image,
  spoken,
}: {
  reveal: RevealDef;
  flipped: boolean;
  prize: string;
  image: string | null;
  spoken: string;
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
          className={`absolute inset-0 overflow-hidden rounded-[32px] border-4 border-[#2a1c04] shadow-[0_10px_0_#6b5844] ${reveal.wide ? "bg-black" : "bg-[#cfc6b8]"}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {reveal.wide ? <LockSquare /> : <SilhouettePair />}
        </div>
        <div
          className="absolute inset-0 overflow-hidden rounded-[32px] border-4 border-[#f5b942] bg-[#fff8ec] shadow-[0_10px_0_#c48a16]"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-hidden={flipped ? undefined : true}
        >
          <PrizeArt
            src={image || reveal.image}
            title={flipped ? spoken : ""}
            prize={flipped ? prize : ""}
          />
        </div>
      </div>
    </div>
  );
}

function LockSquare() {
  return (
    <div className="grid size-full place-items-center bg-black">
      <div className="grid aspect-square h-[78%] place-items-center rounded-[28px] bg-black shadow-[0_0_0_8px_#ffe14a,0_0_36px_rgba(255,225,74,0.45)]">
        <LockKeyhole className="size-[46%] text-[#ffe14a]" strokeWidth={2.4} aria-hidden="true" />
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
