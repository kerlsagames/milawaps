"use client";

import { type CSSProperties } from "react";
import { Pencil, Sparkles, Undo2 } from "lucide-react";
import {
  ACTION_COPY,
  UNIT_MAX,
  UNITS,
  type ActionId,
  type PublicBoard,
  type StorageMode,
  type UnitId,
} from "@/lib/game";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const storageCopy: Record<StorageMode, string> = {
  kv: "Scores are saving",
  file: "Saving on this server",
  memory: "Scores will not stick — storage missing",
};

export function StaffHud({
  open,
  onOpenChange,
  board,
  dutyName,
  token,
  error,
  onScore,
  onHighlight,
  onChangeScores,
  onBoard: _onBoard,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: PublicBoard | undefined;
  dutyName: string | null;
  token: string | null;
  error: string | null;
  onScore: (action: ActionId, unitId?: UnitId) => void;
  onHighlight: (unitId: UnitId) => void;
  onChangeScores?: () => void;
  onBoard: (board: PublicBoard) => void;
  onLogout: () => void;
}) {
  const allFull = board
    ? UNITS.every((unit) => board.units[unit.id] >= UNIT_MAX)
    : false;
  const canUndo = Boolean(
    board?.log?.length &&
      board.log[0] &&
      board.log[0].action !== "reset" &&
      board.log[0].action !== "undo",
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] gap-0 overflow-hidden rounded-t-[28px] border-black/10 p-0 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:left-auto sm:w-[440px] sm:rounded-[28px]"
      >
        <SheetHeader className="shrink-0 border-b border-black/10 pr-12">
          <SheetTitle className="font-display text-2xl">
            {dutyName ? `${dutyName} on duty` : "Yard duty desk"}
          </SheetTitle>
          <SheetDescription>Tap a class to add points. Keep it quick.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
          <div className="flex flex-col gap-3">
            {UNITS.map((unit) => {
              const score = board?.units[unit.id] ?? 0;
              return (
                <section
                  key={unit.id}
                  className="rounded-2xl border p-3"
                  style={{ borderColor: `${unit.color}88`, background: unit.soft }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-display text-2xl leading-none" style={{ color: unit.color }}>
                        {unit.code}
                      </p>
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                        {unit.zoneLine}
                      </p>
                    </div>
                    <p className="font-display text-3xl leading-none tabular-nums">
                      {score}
                      <span className="text-base text-muted-foreground">/{UNIT_MAX}</span>
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <ScoreButton
                      label="+1"
                      hint="Tick"
                      disabled={score >= UNIT_MAX}
                      onClick={() => onScore("spot", unit.id)}
                      style={{ background: unit.color, color: unit.ink }}
                    />
                    <ScoreButton
                      label="+2"
                      hint="Surge"
                      disabled={score >= UNIT_MAX}
                      onClick={() => onScore("surge", unit.id)}
                      style={{ background: unit.deep, color: "#fff7ea" }}
                    />
                    <ScoreButton
                      label="−1"
                      hint="Strike"
                      disabled={score <= 0}
                      onClick={() => onScore("strike", unit.id)}
                      className="border border-[#c23b3b]/30 bg-[#c23b3b]/10 text-[#8d1f1f]"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-11 w-full rounded-xl border-[#e2a01a] bg-[#fff8df] text-sm font-extrabold"
                    disabled={!token}
                    onClick={() => onHighlight(unit.id)}
                  >
                    <Sparkles className="size-4" aria-hidden="true" />
                    Student highlight
                  </Button>
                </section>
              );
            })}

            <Button
              className="h-14 rounded-2xl text-base"
              disabled={allFull}
              onClick={() => onScore("teamwork")}
            >
              {ACTION_COPY.teamwork.short}
              <span className="text-sm font-semibold opacity-80">Teamwork</span>
            </Button>

            {error ? (
              <p
                className="rounded-xl bg-[#c23b3b]/10 px-3 py-2 text-sm font-semibold text-[#8d1f1f]"
                role="status"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t border-black/10 bg-[#fffdf8] p-3">
          {onChangeScores ? (
            <Button
              type="button"
              className="h-12 w-full rounded-2xl text-base font-extrabold"
              onClick={onChangeScores}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Change scores
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-2xl text-base font-extrabold"
            disabled={!canUndo}
            onClick={() => onScore("undo")}
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Undo last tick
          </Button>
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{board ? storageCopy[board.storage] : "Waiting for the board"}</span>
            <Button variant="ghost" className="h-8" onClick={onLogout}>
              Lock desk
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ScoreButton({
  label,
  hint,
  onClick,
  disabled,
  className,
  style,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={`h-16 flex-col gap-0 rounded-2xl border-transparent text-base ${className ?? ""}`}
    >
      <span className="font-display text-xl leading-none">{label}</span>
      <span className="text-[11px] font-bold tracking-wide uppercase opacity-80">{hint}</span>
    </Button>
  );
}
