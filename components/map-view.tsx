"use client";

import Image from "next/image";
import { UNITS, UNIT_MAX, type PublicBoard, type UnitId } from "@/lib/game";

const chipPlace: Record<UnitId, string> = {
  f1: "top-[8%] right-[8%]",
  "234": "top-[36%] left-[16%]",
  "56": "top-[63%] right-[10%]",
};

export function MapView({ board }: { board: PublicBoard }) {
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">
            Milawa Primary
          </p>
          <h2 className="font-display text-4xl leading-none sm:text-5xl">The real yard</h2>
        </div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Same ground the kids can see from the window. The little badges show live ticks.
        </p>
      </header>

      <div className="relative mx-auto overflow-hidden rounded-[28px] border border-black/10 bg-[#d7c49a] shadow-[0_16px_40px_rgba(90,60,20,0.18)] lg:max-h-[calc(100dvh-9rem)]">
        <Image
          src="/milawa-yard.jpg"
          alt="Aerial of Milawa Primary School. Gold is F/1 Oval and Construction, teal is 2/3/4 BER Deck, Toilets and Playground, purple is 5/6 Courts, Bin Area and Grass Playground."
          width={1888}
          height={2222}
          priority
          className="h-auto w-full lg:max-h-[calc(100dvh-9rem)] lg:object-contain"
        />
        {UNITS.map((unit) => (
          <MapChip key={unit.id} unitId={unit.id} score={board.units[unit.id]} />
        ))}
      </div>
    </div>
  );
}

function MapChip({ unitId, score }: { unitId: UnitId; score: number }) {
  const unit = UNITS.find((item) => item.id === unitId);
  if (!unit) return null;
  return (
    <div
      className={`absolute rounded-2xl border-2 px-2.5 py-1.5 shadow-[0_6px_0_rgba(42,28,4,0.25)] ${chipPlace[unitId]}`}
      style={{ background: unit.color, borderColor: unit.ink, color: unit.ink }}
    >
      <p className="font-display text-[clamp(0.85rem,1.8vw,1.35rem)] leading-none tabular-nums">
        {score}
        <span className="text-[0.7em] opacity-70">/{UNIT_MAX}</span>
      </p>
    </div>
  );
}
