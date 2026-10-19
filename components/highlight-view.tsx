"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { kidName, unitById } from "@/lib/game";
import type { HighlightEntry } from "@/lib/highlights";
import { studentById } from "@/lib/students";

const ANGLES = [-7, 5, -4, 8, -6, 3, -9, 6];

export function HighlightView({ entry }: { entry: HighlightEntry }) {
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
      <header className="relative z-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.28em] text-[#5a3208] uppercase">
            Student spotlight
          </p>
          <h2 className="font-display text-4xl leading-none text-[#2a1c04] sm:text-6xl">
            Highlighted!
          </h2>
          <p className="mt-1 text-sm font-extrabold text-[#5a3208] sm:text-lg">Spotted by {who}</p>
        </div>
        <div className="max-w-xl rounded-[24px] border-4 border-[#2a1c04] bg-[#fff8df] px-4 py-3 shadow-[0_8px_0_#6b5844]">
          <p className="text-[10px] font-extrabold tracking-[0.2em] text-[#8a5a00] uppercase">
            Why they shone
          </p>
          <p className="font-display text-2xl leading-tight text-[#2a1c04] sm:text-3xl">{entry.reason}</p>
        </div>
      </header>

      <div
        className="relative z-10 mt-3 grid min-h-0 flex-1 content-center items-center justify-items-center gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {students.map((student, index) => {
          const unit = unitById(student.unitId);
          const angle = ANGLES[index % ANGLES.length] ?? 0;
          const width =
            count === 1 ? "w-[min(100%,22rem)]" : count === 2 ? "w-[min(100%,16rem)]" : "w-[min(100%,13rem)]";
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
                  <p className="font-display text-xl leading-none text-[#2a1c04] sm:text-3xl">{student.name}</p>
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
      <div className="grid aspect-[3/4] place-items-center p-4 text-center" style={{ background: color }}>
        <div>
          <p className="font-display text-3xl leading-none text-[#2a1c04] sm:text-4xl">{name}</p>
          <p className="mt-2 text-xs font-bold">Photo coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] bg-[#efe6d6]">
      <img
        src={image}
        alt={name}
        className="size-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
