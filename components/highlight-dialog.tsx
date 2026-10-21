"use client";

import { useEffect, useMemo, useState } from "react";
import { UNITS, type PublicBoard, type UnitId } from "@/lib/game";
import { HIGHLIGHT_POINT_MAX, type HighlightStudent } from "@/lib/highlights";
import { studentById, studentsForUnit } from "@/lib/students";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const students = useMemo(() => (unitId ? studentsForUnit(unitId) : []), [unitId]);
  const pickedDetails = useMemo(
    () =>
      picked
        .map((item) => studentById(item.id))
        .filter((student): student is NonNullable<typeof student> => Boolean(student)),
    [picked],
  );

  function reset(nextUnit: UnitId | null = null) {
    setUnitId(nextUnit);
    setPicked([]);
    setReason("");
    setMessage("");
    setBusy(false);
  }

  useEffect(() => {
    if (open) reset(initialUnitId);
  }, [open, initialUnitId]);

  function toggleStudent(student: { id: string; unitId: UnitId }) {
    setPicked((current) => {
      const on = current.some((item) => item.id === student.id);
      if (on) return current.filter((item) => item.id !== student.id);
      if (current.length >= HIGHLIGHT_POINT_MAX) {
        setMessage(`Pick up to ${HIGHLIGHT_POINT_MAX} students — one point each.`);
        return current;
      }
      setMessage("");
      return [...current, { id: student.id, unitId: student.unitId }];
    });
  }

  async function submit() {
    if (picked.length === 0 || reason.trim().length === 0) return;
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
          reason,
          students: picked,
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
      <DialogContent className="max-h-[88dvh] overflow-y-auto sm:!max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Student highlight</DialogTitle>
          <DialogDescription>
            Pick up to {HIGHLIGHT_POINT_MAX} students across classes, tap who shone, and write why. Each
            student earns +1 for their class (max {HIGHLIGHT_POINT_MAX}). Picks stay when you switch
            classes. The spotlight page stays on the TV for two days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <p className="text-sm font-bold">Class</p>
          <div className="grid grid-cols-3 gap-2">
            {UNITS.map((unit) => {
              const count = picked.filter((item) => item.unitId === unit.id).length;
              return (
                <button
                  key={unit.id}
                  type="button"
                  aria-pressed={unitId === unit.id}
                  onClick={() => setUnitId(unit.id)}
                  className="relative h-12 rounded-xl text-sm font-extrabold"
                  style={{
                    background: unitId === unit.id ? unit.color : "#fff",
                    color: unitId === unit.id ? unit.ink : "#2a1c04",
                    border: `2px solid ${unit.color}`,
                  }}
                >
                  {unit.code}
                  {count > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-[#2a1c04] text-[10px] font-black text-[#ffe08a]">
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {pickedDetails.length > 0 ? (
          <div className="grid gap-1.5">
            <p className="text-sm font-bold">Selected ({pickedDetails.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {pickedDetails.map((student) => {
                const unit = UNITS.find((item) => item.id === student.unitId);
                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => toggleStudent(student)}
                    className="rounded-full border-2 border-[#2a1c04] bg-[#fff8df] px-2.5 py-1 text-xs font-extrabold text-[#2a1c04]"
                    title="Tap to remove"
                  >
                    {student.name}
                    <span className="ml-1 opacity-60">{unit?.code}</span>
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
            <p className="text-sm font-bold">Students</p>
            {students.length === 0 ? (
              <p className="rounded-xl bg-[#fff8df] px-3 py-2 text-sm font-bold text-[#8a5a00]">
                Photos for this class are not on the board yet.
              </p>
            ) : (
              <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                {students.map((student) => {
                  const on = picked.some((item) => item.id === student.id);
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
        ) : null}

        <label className="grid gap-1">
          <span className="text-sm font-bold">Reason</span>
          <textarea
            value={reason}
            rows={3}
            aria-label="Highlight reason"
            placeholder="Helped pack the sports shed without being asked"
            onChange={(event) => setReason(event.target.value.slice(0, 140))}
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
          className="h-12 rounded-xl"
          disabled={busy || picked.length === 0 || reason.trim().length === 0}
          onClick={() => void submit()}
        >
          Put them on the spotlight
        </Button>
      </DialogContent>
    </Dialog>
  );
}
