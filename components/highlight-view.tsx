"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { kidName, unitById } from "@/lib/game";
import type { HighlightEntry } from "@/lib/highlights";
import { studentById } from "@/lib/students";
import { Button } from "@/components/ui/button";

const ANGLES = [-7, 5, -4, 8, -6, 3, -9, 6];

export function HighlightView({
  entry,
  canRemove = false,
  removing = false,
  onRemove,
}: {
  entry: HighlightEntry;
  canRemove?: boolean;
  removing?: boolean;
  onRemove?: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const students = entry.students
    .map((item) => studentById(item.id))
    .filter((student): student is NonNullable<typeof student> => Boolean(student));
  const count = Math.max(1, students.length);
  const who = kidName(entry.staffId);
  const columns = count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 2 : 3;

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border-4 border-[#5a3208] bg-[radial-gradient(circle_at_center,#ffe08a_0%,#f5b942_42%,#8a3b12_100%)] p-3 lg:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-conic-gradient(from 12deg at 50% 50%, rgba(255,255,255,0.14) 0deg 12deg, transparent 12deg 24deg)",
        }}
      />

      <div className="relative z-10 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-stretch lg:gap-6">
        <div
          className="grid min-h-0 content-center items-center justify-items-center gap-3 overflow-y-auto py-1"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {students.map((student, index) => {
            const unit = unitById(student.unitId);
            const angle = ANGLES[index % ANGLES.length] ?? 0;
            const width =
              count === 1
                ? "w-[min(100%,24rem)]"
                : count === 2
                  ? "w-[min(100%,17rem)]"
                  : "w-[min(100%,13.5rem)]";
            return (
              <motion.article
                key={student.id}
                initial={{ opacity: 0, y: 18, rotate: angle - 8 }}
                animate={{ opacity: 1, y: 0, rotate: angle }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 120, damping: 14 }}
                className={width}
              >
                <div
                  className="overflow-hidden rounded-[28px] border-4 border-[#fff8df] bg-[#fff8df] p-2"
                  style={{ boxShadow: `0 14px 0 rgba(42,28,4,0.28), 0 0 0 6px ${unit.color}` }}
                >
                  <StudentPhoto name={student.name} image={student.image} color={unit.color} />
                  <div className="px-2 pt-2 pb-1 text-center">
                    <p className="font-display text-xl leading-none text-[#2a1c04] sm:text-3xl">
                      {student.name}
                    </p>
                    <p
                      className="mt-1 text-xs font-extrabold tracking-[0.16em] uppercase"
                      style={{ color: unit.deep }}
                    >
                      {unit.code}
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="relative flex min-h-0 flex-col items-center justify-center rounded-[28px] border-4 border-[#2a1c04] bg-[#fff8df]/92 px-5 py-6 text-center shadow-[0_10px_0_#6b5844] lg:px-8 lg:py-8">
          <p className="text-sm font-extrabold tracking-[0.28em] text-[#8a5a00] uppercase sm:text-base">
            Student spotlight
          </p>
          <h2 className="mt-2 font-display text-5xl leading-none text-[#2a1c04] sm:text-6xl lg:text-7xl">
            Highlighted!
          </h2>
          <p className="mt-3 text-base font-extrabold text-[#5a3208] sm:text-xl">Spotted by {who}</p>
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
        </div>
      </div>
    </div>
  );
}

function StudentPhoto({
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
      <div className="grid aspect-[4/3] place-items-center p-4 text-center" style={{ background: color }}>
        <div>
          <p className="font-display text-3xl leading-none text-[#2a1c04] sm:text-4xl">{name}</p>
          <p className="mt-2 text-xs font-bold">Photo coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-[#efe6d6]">
      <img
        src={image}
        alt={name}
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
