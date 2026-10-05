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
import { VIEWS } from "@/lib/game";
import {
  MAX_DWELL_SECONDS,
  MIN_DWELL_SECONDS,
  setMutedPref,
  setViewDwell,
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
              Set how long each page stays on the TV. Move the mouse or touch the screen, then tap
              the X. Esc leaves too.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            {VIEWS.map((view) => (
              <label key={view.id} className="grid grid-cols-[8.2rem_1fr_2.4rem] items-center gap-2">
                <span className="truncate text-sm font-bold">{view.label}</span>
                <input
                  type="range"
                  min={MIN_DWELL_SECONDS}
                  max={MAX_DWELL_SECONDS}
                  step={1}
                  value={prefs.dwells[view.id]}
                  aria-label={`${view.label} seconds`}
                  onChange={(event) => setViewDwell(view.id, Number(event.target.value))}
                  className="accent-[#e2a01a]"
                />
                <span className="text-right font-display text-lg tabular-nums">
                  {prefs.dwells[view.id]}s
                </span>
              </label>
            ))}
          </div>
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
