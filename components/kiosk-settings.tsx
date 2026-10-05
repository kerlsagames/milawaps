"use client";

import { useState } from "react";
import { Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MAX_DWELL_SECONDS,
  MIN_DWELL_SECONDS,
  setDwellSeconds,
  setMutedPref,
  useDeskPrefs,
} from "@/lib/desk-prefs";

export function KioskSettings({ onStart }: { onStart: () => void }) {
  const prefs = useDeskPrefs();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Settings"
        className="size-10 rounded-xl"
        onClick={() => setOpen(true)}
      >
        <Settings />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Kiosk</DialogTitle>
            <DialogDescription>
              The TV walks through the board, prizes, yard map, and rules. Move the mouse or touch
              the screen, then tap the X at the top. Esc leaves too.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2">
            <span className="flex items-baseline justify-between gap-3 font-bold">
              Each page stays on
              <span className="font-display text-2xl tabular-nums">{prefs.dwellSeconds}s</span>
            </span>
            <input
              type="range"
              min={MIN_DWELL_SECONDS}
              max={MAX_DWELL_SECONDS}
              step={1}
              value={prefs.dwellSeconds}
              aria-label="Seconds each page stays on"
              onChange={(event) => setDwellSeconds(Number(event.target.value))}
              className="accent-[#e2a01a]"
            />
          </label>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">Sounds</p>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              aria-pressed={!prefs.muted}
              onClick={() => setMutedPref(!prefs.muted)}
            >
              {prefs.muted ? <VolumeX /> : <Volume2 />}
              {prefs.muted ? "Muted" : "On"}
            </Button>
          </div>
          <Button
            type="button"
            className="h-11 rounded-xl text-base"
            onClick={() => {
              setOpen(false);
              onStart();
            }}
          >
            Start kiosk
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
