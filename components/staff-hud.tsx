"use client";

import { useState, type CSSProperties } from "react";
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const storageCopy: Record<StorageMode, string> = {
  kv: "Saving to Vercel KV",
  file: "Saving on this server",
  memory: "No shared store connected",
};

export function StaffHud({
  open,
  onOpenChange,
  board,
  error,
  onScore,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board: PublicBoard | undefined;
  error: string | null;
  onScore: (action: ActionId, unitId?: UnitId) => void;
  onLogout: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const allFull = board
    ? UNITS.every((unit) => board.units[unit.id] >= UNIT_MAX)
    : false;

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setConfirmReset(false);
        onOpenChange(next);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[88vh] gap-0 overflow-hidden rounded-t-[28px] border-white/10 p-0 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:left-auto sm:w-[440px] sm:rounded-[28px]"
      >
        <SheetHeader className="border-b border-white/10 pr-12">
          <SheetTitle className="font-display text-2xl">Yard duty desk</SheetTitle>
          <SheetDescription>
            Tap a score. The window TV picks it up on the next refresh.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-4">
          {UNITS.map((unit) => {
            const score = board?.units[unit.id] ?? 0;
            return (
              <section
                key={unit.id}
                className="rounded-2xl border p-3"
                style={{ borderColor: `${unit.color}88`, background: unit.soft }}
              >
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl leading-none" style={{ color: unit.color }}>
                      {unit.code}
                    </p>
                    <p className="mt-1 text-xs leading-snug text-muted-foreground">{unit.zoneLine}</p>
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
                    label="+3"
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
                    className="border border-[#ff8b8b]/40 bg-[#ff8b8b]/15 text-[#ffd0d0]"
                  />
                </div>
              </section>
            );
          })}

          <Button
            className="h-16 rounded-2xl text-base"
            disabled={allFull}
            onClick={() => onScore("teamwork")}
          >
            {ACTION_COPY.teamwork.short}
            <span className="text-sm font-semibold opacity-80">Teamwork</span>
          </Button>

          {error && (
            <p className="rounded-xl bg-[#ff8b8b]/15 px-3 py-2 text-sm font-semibold text-[#ffb4b4]" role="status">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{board ? storageCopy[board.storage] : "Waiting for the board"}</span>
            <Button variant="ghost" className="h-8" onClick={onLogout}>
              Lock desk
            </Button>
          </div>

          {confirmReset ? (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-11" onClick={() => setConfirmReset(false)}>
                Keep scores
              </Button>
              <Button
                variant="destructive"
                className="h-11"
                onClick={() => {
                  setConfirmReset(false);
                  onScore("reset");
                }}
              >
                Clear the board
              </Button>
            </div>
          ) : (
            <Button variant="ghost" className="h-10 text-muted-foreground" onClick={() => setConfirmReset(true)}>
              Reset the week
            </Button>
          )}
        </div>
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
