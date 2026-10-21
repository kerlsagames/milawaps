"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { kidName, unitById } from "@/lib/game";
import { formatHighlightCountdown, type HighlightEntry } from "@/lib/highlights";
import { studentById } from "@/lib/students";
import { Button } from "@/components/ui/button";

const ANGLES = [-7, 5, -4, 8, -6, 3, -9, 6];

export function HighlightView({
  entry,
  canRemove = false,
  removing = false,
  onRemove,
  index = 0,
  total = 1,
  onPrev,
  onNext,
}: {
  entry: HighlightEntry;
  canRemove?: boolean;
  removing?: boolean;
  onRemove?: () => void;
  index?: number;
  total?: number;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const students = entry.students
    .map((item) => studentById(item.id))
    .filter((student): student is NonNullable<typeof student> => Boolean(student));
  const count = Math.max(1, students.length);
  const who = kidName(entry.staffId);
  const columns = count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : 3;
  const canCycle = total > 1 && Boolean(onPrev && onNext);
  const solo = count === 1;
  const nameLine = nameList(students.map((student) => student.name));

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border-4 border-[#5a3208] bg-[radial-gradient(circle_at_center,#ffe08a_0%,#f5b942_42%,#8a3b12_100%)] p-3 lg:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-conic-gradient(from 12deg at 50% 50%, rgba(255,255,255,0.14) 0deg 12deg, transparent 12deg 24deg)",
        }}
      />

      {canCycle ? (
        <div className="relative z-20 mb-2 flex shrink-0 items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Previous highlight"
            onClick={onPrev}
            className="grid size-12 place-items-center rounded-full border-2 border-[#5a3208] bg-[#fff8df] text-[#2a1c04] shadow-[0_4px_0_#6b5844] sm:size-14"
          >
            <ChevronLeft className="size-7" />
          </button>
          <div className="min-w-[7rem] rounded-full bg-[#2a1c04] px-4 py-2 text-center">
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#ffe08a] uppercase">
              Highlight
            </p>
            <p className="font-display text-xl leading-none text-[#fff8df] tabular-nums sm:text-2xl">
              {index + 1} / {total}
            </p>
          </div>
          <button
            type="button"
            aria-label="Next highlight"
            onClick={onNext}
            className="grid size-12 place-items-center rounded-full border-2 border-[#5a3208] bg-[#fff8df] text-[#2a1c04] shadow-[0_4px_0_#6b5844] sm:size-14"
          >
            <ChevronRight className="size-7" />
          </button>
        </div>
      ) : null}

      <div
        className={
          solo
            ? "relative z-10 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-stretch lg:gap-6"
            : "relative z-10 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-6"
        }
      >
        <div
          className="grid min-h-0 content-center items-center justify-items-center gap-3 overflow-hidden py-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {students.map((student, studentIndex) => {
            const unit = unitById(student.unitId);
            const angle = solo ? -3 : (ANGLES[studentIndex % ANGLES.length] ?? 0);
            const width =
              count === 1
                ? "flex h-full max-h-full w-[min(100%,40rem)] items-center justify-center"
                : count === 2
                  ? "w-[min(100%,20rem)]"
                  : count <= 4
                    ? "w-[min(100%,15rem)]"
                    : "w-[min(100%,12rem)]";
            return (
              <motion.article
                key={student.id}
                initial={{ opacity: 0, y: 18, rotate: angle - 8 }}
                animate={{ opacity: 1, y: 0, rotate: angle }}
                transition={{ delay: studentIndex * 0.08, type: "spring", stiffness: 120, damping: 14 }}
                className={width}
              >
                <div
                  className={
                    solo
                      ? "flex h-full max-h-full w-full overflow-hidden rounded-[28px] border-4 border-[#fff8df] bg-[#fff8df] p-2 sm:p-2.5"
                      : "overflow-hidden rounded-[28px] border-4 border-[#fff8df] bg-[#fff8df] p-2"
                  }
                  style={{ boxShadow: `0 14px 0 rgba(42,28,4,0.28), 0 0 0 6px ${unit.color}` }}
                >
                  <StudentPhoto
                    name={student.name}
                    image={student.image}
                    color={unit.color}
                    solo={solo}
                  />
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="relative flex min-h-0 flex-col items-center justify-center rounded-[28px] border-4 border-[#2a1c04] bg-[#fff8df]/92 px-5 py-6 pb-12 text-center shadow-[0_10px_0_#6b5844] lg:px-8 lg:py-8 lg:pb-14">
          <p className="text-sm font-extrabold tracking-[0.28em] text-[#8a5a00] uppercase sm:text-base">
            Student spotlight
          </p>
          <h2 className="mt-2 font-display text-5xl leading-none text-[#2a1c04] sm:text-6xl lg:text-7xl">
            Highlighted!
          </h2>
          <p
            className={`mt-4 font-display leading-tight text-[#2a1c04] ${
              solo ? "text-4xl sm:text-5xl lg:text-6xl" : "text-3xl sm:text-4xl lg:text-5xl"
            }`}
          >
            {nameLine}
          </p>
          <p className="mt-2 text-base font-extrabold text-[#5a3208] sm:text-xl">Spotted by {who}</p>
          <div className="mt-6 w-full max-w-xl">
            <p className="text-sm font-extrabold tracking-[0.2em] text-[#8a5a00] uppercase sm:text-base">
              Why they shone
            </p>
            <p className="mt-2 font-display text-3xl leading-tight text-[#2a1c04] sm:text-4xl lg:text-5xl xl:text-6xl">
              {entry.reason}
            </p>
          </div>

          {canRemove && onRemove ? (
            <div className="mt-6 w-full max-w-md">
              {confirm ? (
                <div className="rounded-2xl border-2 border-[#c23b3b]/40 bg-[#fff5f3] px-4 py-3 text-left">
                  <p className="text-sm font-extrabold text-[#8d1f1f]">Remove this highlight?</p>
                  <p className="mt-1 text-sm font-bold text-[#5a3208]">
                    It will leave the TV loop straight away. This cannot be undone.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-xl"
                      disabled={removing}
                      onClick={() => setConfirm(false)}
                    >
                      Keep it
                    </Button>
                    <Button
                      type="button"
                      className="h-11 rounded-xl bg-[#c23b3b] text-white hover:bg-[#a82f2f]"
                      disabled={removing}
                      onClick={onRemove}
                    >
                      {removing ? "Removing…" : "Yes, remove"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-[#c23b3b]/40 text-[#8d1f1f]"
                  onClick={() => setConfirm(true)}
                >
                  Remove highlight
                </Button>
              )}
            </div>
          ) : null}

          <SpotlightCountdown expiresAt={entry.expiresAt} />
        </div>
      </div>
    </div>
  );
}

function nameList(names: string[]) {
  if (names.length === 0) return "Students";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

function SpotlightCountdown({ expiresAt }: { expiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, expiresAt - now);
  if (left <= 0) {
    return (
      <p className="absolute right-3 bottom-3 rounded-xl bg-[#0d7a64] px-2.5 py-1.5 text-xs font-extrabold tracking-wide text-white uppercase sm:right-4 sm:bottom-4 sm:px-3 sm:py-2 sm:text-sm">
        Ending
      </p>
    );
  }

  return (
    <p
      className="absolute right-3 bottom-3 rounded-xl bg-[#0d7a64] px-2.5 py-1.5 font-display text-base leading-none tabular-nums text-white shadow-[0_2px_0_#0a5a4a] sm:right-4 sm:bottom-4 sm:px-3 sm:py-2 sm:text-lg"
      aria-label={`${formatHighlightCountdown(left)} left on this spotlight`}
      title="Time left before this spotlight leaves the TV"
    >
      {formatHighlightCountdown(left)}
    </p>
  );
}

function StudentPhoto({
  name,
  image,
  color,
  solo = false,
}: {
  name: string;
  image: string;
  color: string;
  solo?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // Full portrait — frame hugs the image so nothing is cropped or letterboxed away.
  const frame = solo
    ? "relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-[22px] bg-[#efe6d6]"
    : "relative w-full overflow-hidden rounded-[22px] bg-[#efe6d6]";

  if (failed) {
    return (
      <div
        className={`grid place-items-center p-4 text-center ${solo ? "min-h-0 w-full flex-1" : "aspect-[3/4]"}`}
        style={{ background: color }}
      >
        <div>
          <p
            className={`font-display leading-none text-[#2a1c04] ${solo ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}
          >
            {name}
          </p>
          <p className="mt-2 text-xs font-bold">Photo coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className={frame}>
      <img
        src={image}
        alt={name}
        className={
          solo
            ? "max-h-full max-w-full object-contain object-center"
            : "block h-auto w-full object-contain object-center"
        }
        onError={() => setFailed(true)}
      />
    </div>
  );
}
