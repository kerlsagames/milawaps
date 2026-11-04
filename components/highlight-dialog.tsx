"use client";

import { useEffect, useMemo, useState } from "react";
import { UNITS, type PublicBoard, type UnitId } from "@/lib/game";
import {
  HIGHLIGHT_STUDENT_MAX,
  HIGHLIGHT_VALUES,
  classHighlightId,
  highlightReasonFromValue,
  isClassHighlightId,
  type HighlightStudent,
  type HighlightValue,
  wholeClassLabel,
} from "@/lib/highlights";
import { studentById, studentsForUnit } from "@/lib/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const POINT_CHOICES = [0, 1, 2, 3] as const;

const VALUE_TONES: Record<HighlightValue, { bg: string; ink: string; border: string }> = {
  Engage: { bg: "#2ec9a0", ink: "#08352b", border: "#0d7a64" },
  Respect: { bg: "#5ec8ff", ink: "#0a3a55", border: "#1f6f8b" },
  Create: { bg: "#ffe08a", ink: "#5a3208", border: "#c48a16" },
  Connect: { bg: "#ff9ec8", ink: "#5a1030", border: "#c23b6b" },
};

export function HighlightDialog({
  open,
  onOpenChange,
  token,
  onSaved,
  initialUnitId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onSaved: (board: PublicBoard) => void;
  initialUnitId?: UnitId | null;
}) {
  const [unitId, setUnitId] = useState<UnitId | null>(null);
  const [picked, setPicked] = useState<HighlightStudent[]>([]);
  const [points, setPoints] = useState(1);
  const [value, setValue] = useState<HighlightValue | null>(null);
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const students = useMemo(() => (unitId ? studentsForUnit(unitId) : []), [unitId]);
  const wholeClassPick = useMemo(
    () => picked.find((item) => isClassHighlightId(item.id)) ?? null,
    [picked],
  );
  const pickedDetails = useMemo(
    () =>
      picked.flatMap((item) => {
        if (isClassHighlightId(item.id)) {
          return [{ id: item.id, unitId: item.unitId, name: wholeClassLabel(item.unitId) }];
        }
        const student = studentById(item.id);
        return student ? [student] : [];
      }),
    [picked],
  );

  function reset(nextUnit: UnitId | null = null) {
    setUnitId(nextUnit);
    setPicked([]);
    setPoints(1);
    setValue(null);
    setDetail("");
    setMessage("");
    setBusy(false);
  }

  useEffect(() => {
    if (open) reset(initialUnitId);
  }, [open, initialUnitId]);

  function pickWholeClass(target: UnitId) {
    setPicked([{ id: classHighlightId(target), unitId: target }]);
    setMessage("");
  }

  function toggleStudent(student: { id: string; unitId: UnitId }) {
    setPicked((current) => {
      const withoutClass = current.filter((item) => !isClassHighlightId(item.id));
      const on = withoutClass.some((item) => item.id === student.id);
      if (on) return withoutClass.filter((item) => item.id !== student.id);
      if (withoutClass.length >= HIGHLIGHT_STUDENT_MAX) {
        setMessage(`Pick up to ${HIGHLIGHT_STUDENT_MAX} students.`);
        return withoutClass;
      }
      setMessage("");
      return [...withoutClass, { id: student.id, unitId: student.unitId }];
    });
  }

  async function submit() {
    if (picked.length === 0 || !value) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/highlight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: highlightReasonFromValue(value, detail),
          students: picked,
          points,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as PublicBoard & { error?: string };
      if (!response.ok) {
        setMessage(body.error ?? "That highlight did not save.");
        return;
      }
      onSaved(body);
      reset();
      onOpenChange(false);
    } catch {
      setMessage("That highlight did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="!flex h-[min(90dvh,40rem)] max-h-[min(90dvh,40rem)] w-full max-w-[calc(100%-1rem)] flex-col gap-2 overflow-hidden p-3 top-[2dvh] translate-y-0 sm:h-auto sm:max-h-[min(92dvh,40rem)] sm:!max-w-xl sm:top-[50%] sm:translate-y-[-50%] sm:p-4"
      >
        <DialogHeader className="shrink-0 gap-0 pr-8">
          <DialogTitle className="font-display text-xl sm:text-2xl">Student highlight</DialogTitle>
          <DialogDescription className="sr-only">
            Choose a school value, points, a class, students, and an optional note.
          </DialogDescription>
        </DialogHeader>

        {/* Fixed top: school values + points always visible on phone. */}
        <div className="grid shrink-0 gap-2">
          <div className="grid grid-cols-2 gap-1.5" role="group" aria-label="School value">
            {HIGHLIGHT_VALUES.map((item) => {
              const on = value === item;
              const tone = VALUE_TONES[item];
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setValue(item)}
                  className="h-12 rounded-xl text-sm font-black tracking-wide uppercase"
                  style={
                    on
                      ? { background: tone.bg, color: tone.ink, border: `3px solid ${tone.border}` }
                      : {
                          background: "#fff",
                          color: "#2a1c04",
                          border: `2px solid ${tone.border}`,
                        }
                  }
                >
                  {item}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Highlight points">
            {POINT_CHOICES.map((choice) => {
              const label = choice === 0 ? "0" : `+${choice}`;
              const on = points === choice;
              return (
                <button
                  key={choice}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPoints(choice)}
                  className={
                    on
                      ? "h-11 rounded-xl bg-[#2a1c04] text-lg font-black text-[#ffe08a]"
                      : "h-11 rounded-xl border-2 border-[#2a1c04] bg-[#fff8df] text-lg font-black text-[#2a1c04]"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {UNITS.map((unit) => {
              const count = picked.filter((item) => item.unitId === unit.id).length;
              const wholeOn = wholeClassPick?.unitId === unit.id;
              return (
                <button
                  key={unit.id}
                  type="button"
                  aria-pressed={unitId === unit.id}
                  onClick={() => setUnitId(unit.id)}
                  className="relative h-11 rounded-xl text-sm font-extrabold"
                  style={{
                    background: unitId === unit.id ? unit.color : "#fff",
                    color: unitId === unit.id ? unit.ink : "#2a1c04",
                    border: `2px solid ${unit.color}`,
                  }}
                >
                  {unit.code}
                  {count > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-[#2a1c04] text-[10px] font-black text-[#ffe08a]">
                      {wholeOn ? "★" : count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle scrolls: selected chips + roster only. */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain">
          {pickedDetails.length > 0 ? (
            <div className="grid gap-1.5">
              <p className="text-sm font-bold">Selected ({pickedDetails.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {pickedDetails.map((student) => {
                  const unit = UNITS.find((item) => item.id === student.unitId);
                  const whole = isClassHighlightId(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() =>
                        whole
                          ? setPicked((current) =>
                              current.filter((item) => !isClassHighlightId(item.id)),
                            )
                          : toggleStudent(student)
                      }
                      className="rounded-full border-2 border-[#2a1c04] bg-[#fff8df] px-2.5 py-1 text-xs font-extrabold text-[#2a1c04]"
                      title="Tap to remove"
                    >
                      {student.name}
                      {!whole ? <span className="ml-1 opacity-60">{unit?.code}</span> : null}
                      <span className="ml-1" aria-hidden="true">
                        ×
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {unitId ? (
            <div className="grid gap-2">
              <button
                type="button"
                aria-pressed={wholeClassPick?.unitId === unitId}
                onClick={() => {
                  if (wholeClassPick?.unitId === unitId) {
                    setPicked((current) => current.filter((item) => !isClassHighlightId(item.id)));
                  } else {
                    pickWholeClass(unitId);
                  }
                }}
                className={
                  wholeClassPick?.unitId === unitId
                    ? "h-11 rounded-xl bg-[#2a1c04] px-3 text-left text-sm font-extrabold text-[#ffe08a]"
                    : "h-11 rounded-xl border-2 border-[#2a1c04] bg-[#fff8df] px-3 text-left text-sm font-extrabold text-[#2a1c04]"
                }
              >
                Whole class — {UNITS.find((unit) => unit.id === unitId)?.code}
              </button>
              {students.length === 0 ? (
                <p className="rounded-xl bg-[#fff8df] px-3 py-2 text-sm font-bold text-[#8a5a00]">
                  Photos for this class are not on the board yet.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {students.map((student) => {
                    const on =
                      !wholeClassPick && picked.some((item) => item.id === student.id);
                    return (
                      <button
                        key={student.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleStudent(student)}
                        className={
                          on
                            ? "rounded-xl bg-[#2a1c04] px-2 py-2 text-left text-sm font-bold text-[#ffe08a]"
                            : "rounded-xl border border-black/10 bg-white px-2 py-2 text-left text-sm font-bold"
                        }
                      >
                        {student.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-muted-foreground">Tap a class above.</p>
          )}
        </div>

        {/* Fixed bottom: optional note + submit. */}
        <div className="grid shrink-0 gap-2 border-t border-black/10 pt-2">
          <label className="grid gap-1">
            <span className="text-sm font-bold">Note (optional)</span>
            <textarea
              value={detail}
              rows={2}
              aria-label="Optional highlight note"
              placeholder="Helped pack the sports shed without being asked"
              onChange={(event) => setDetail(event.target.value.slice(0, 120))}
              className="rounded-xl border border-input bg-transparent px-3 py-2 text-sm font-bold"
            />
          </label>

          {message ? (
            <p className="text-sm font-semibold text-[#8d1f1f]" role="status">
              {message}
            </p>
          ) : null}

          <Button
            type="button"
            className="h-11 rounded-xl"
            disabled={busy || picked.length === 0 || !value}
            onClick={() => void submit()}
          >
            {wholeClassPick ? "Put the class on the spotlight" : "Put them on the spotlight"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
