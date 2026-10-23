"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { kidName, unitById, type UnitId } from "@/lib/game";
import { formatHighlightCountdown, type HighlightEntry } from "@/lib/highlights";
import { studentById } from "@/lib/students";
import { Button } from "@/components/ui/button";

/** F/1 campus shots are landscape; other grades are portrait. */
function photoAspect(unitId: UnitId) {
  return unitId === "f1" ? "4 / 3" : "3 / 4";
}

function isLandscape(unitId: UnitId) {
  return unitId === "f1";
}

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
  const canCycle = total > 1 && Boolean(onPrev && onNext);
  const solo = count === 1;
  const pair = count === 2;
  const trio = count === 3;
  const quartet = count === 4;
  const allLandscape = students.length > 0 && students.every((student) => isLandscape(student.unitId));
  const nameLine = nameList(students.map((student) => student.name));

  return (
    <div className="relative flex h-full max-h-full min-h-0 flex-col overflow-hidden rounded-[32px] border-4 border-[#5a3208] bg-[radial-gradient(circle_at_center,#ffe08a_0%,#f5b942_42%,#8a3b12_100%)] p-2 sm:p-3 lg:p-4">
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
            ? "relative z-10 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-stretch lg:gap-4"
            : pair || trio || quartet
              ? "relative z-10 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-stretch lg:gap-4"
              : "relative z-10 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3 overflow-hidden lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-4"
        }
      >
        <div className="relative min-h-0 overflow-hidden">
          {solo ? (
            <SoloStage students={students} />
          ) : (
            <GroupStage
              students={students}
              pair={pair}
              trio={trio}
              quartet={quartet}
              allLandscape={allLandscape}
            />
          )}
        </div>

        <div className="relative flex min-h-0 flex-col items-center justify-center overflow-y-auto rounded-[28px] border-4 border-[#2a1c04] bg-[#fff8df]/92 px-5 py-5 pb-12 text-center shadow-[0_10px_0_#6b5844] lg:px-7 lg:py-7 lg:pb-14">
          <p className="text-sm font-extrabold tracking-[0.28em] text-[#8a5a00] uppercase sm:text-base">
            Student spotlight
          </p>
          <h2 className="mt-2 font-display text-4xl leading-none text-[#2a1c04] sm:text-5xl lg:text-6xl">
            Highlighted!
          </h2>
          <p
            className={`mt-3 font-display leading-tight text-[#2a1c04] ${
              solo ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl"
            }`}
          >
            {nameLine}
          </p>
          <p className="mt-2 text-base font-extrabold text-[#5a3208] sm:text-xl">Spotted by {who}</p>
          <div className="mt-4 w-full max-w-xl">
            <p className="text-sm font-extrabold tracking-[0.2em] text-[#8a5a00] uppercase sm:text-base">
              Why they shone
            </p>
            <p className="mt-2 font-display text-2xl leading-tight text-[#2a1c04] sm:text-3xl lg:text-4xl xl:text-5xl">
              {entry.reason}
            </p>
          </div>

          {canRemove && onRemove ? (
            <div className="mt-5 w-full max-w-md">
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

function SoloStage({
  students,
}: {
  students: NonNullable<ReturnType<typeof studentById>>[];
}) {
  const student = students[0];
  if (!student) return null;
  const unit = unitById(student.unitId);
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2 py-2 sm:px-3 sm:py-3">
      <motion.article
        initial={{ opacity: 0, y: 18, rotate: -10 }}
        animate={{ opacity: 1, y: 0, rotate: -2 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
        className="flex min-h-0 max-w-full items-center justify-center"
        style={{
          height: "90%",
          maxHeight: "100%",
          width: "auto",
          aspectRatio: photoAspect(student.unitId),
        }}
      >
        <PortraitFrame color={unit.color}>
          <StudentPhoto name={student.name} image={student.image} color={unit.color} solo />
        </PortraitFrame>
      </motion.article>
    </div>
  );
}

function GroupStage({
  students,
  pair,
  trio,
  quartet,
  allLandscape,
}: {
  students: NonNullable<ReturnType<typeof studentById>>[];
  pair: boolean;
  trio: boolean;
  quartet: boolean;
  allLandscape: boolean;
}) {
  let gridClass = "absolute inset-0 grid gap-3 p-2 sm:gap-4 sm:p-3";

  if (pair) {
    // Landscape F/1: side by side. Portrait: stack so cards stay wide.
    gridClass += allLandscape ? " grid-cols-2" : " grid-rows-2";
  } else if (trio && allLandscape) {
    // F/1 trio: two on top, one centred under.
    gridClass +=
      " grid-cols-2 grid-rows-2 [&>:nth-child(3)]:col-span-2 [&>:nth-child(3)]:justify-self-center [&>:nth-child(3)]:w-[50%]";
  } else if (trio) {
    // Portrait trio (e.g. Tom, Ryley, Keshy): equal row of three.
    gridClass += " grid-cols-3";
  } else if (quartet) {
    // Four equal quarters.
    gridClass += " grid-cols-2 grid-rows-2";
  } else {
    gridClass += " grid-cols-3";
  }

  return (
    <div className={gridClass}>
      {students.map((student, studentIndex) => {
        const unit = unitById(student.unitId);
        return (
          <motion.article
            key={student.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: studentIndex * 0.08,
              type: "spring",
              stiffness: 120,
              damping: 16,
            }}
            className="relative h-full min-h-0 w-full overflow-hidden"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <GroupPhoto name={student.name} image={student.image} color={unit.color} />
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function PortraitFrame({
  color,
  children,
  className = "h-full w-full",
}: {
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border-[3px] border-[#fff8df] bg-[#fff8df] p-1 ${className}`}
      style={{
        boxShadow: `0 4px 0 rgba(42,28,4,0.28), 0 0 0 3px ${color}`,
      }}
    >
      {children}
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

function GroupPhoto({
  name,
  image,
  color,
}: {
  name: string;
  image: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="grid max-h-full max-w-full place-items-center rounded-[16px] border-[3px] border-[#fff8df] px-6 py-10 text-center"
        style={{ background: color, boxShadow: `0 4px 0 rgba(42,28,4,0.28), 0 0 0 3px ${color}` }}
      >
        <p className="font-display text-3xl leading-none text-[#2a1c04]">{name}</p>
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      className="max-h-full max-w-full rounded-[16px] border-[3px] border-[#fff8df] object-contain"
      style={{ boxShadow: `0 4px 0 rgba(42,28,4,0.28), 0 0 0 3px ${color}` }}
      onError={() => setFailed(true)}
    />
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

  if (failed) {
    return (
      <div className="grid h-full w-full place-items-center p-4 text-center" style={{ background: color }}>
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
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden rounded-[12px] bg-[#efe6d6]">
      <img
        src={image}
        alt={name}
        className="max-h-full max-w-full object-contain object-center"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
