"use client";

import { useEffect, useState } from "react";
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
  setFinishAt,
  setMutedPref,
  setRevealAt,
  setRevealPrize,
  setScreenShown,
  setViewDwell,
  useDeskPrefs,
} from "@/lib/desk-prefs";
import { REVEALS, type ScreenId } from "@/lib/reveals";

const ADMIN_KEY = "ott-admin";

export function KioskSettings({ onPreview }: { onPreview: (screen: ScreenId) => void }) {
  const prefs = useDeskPrefs();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) {
      setAdmin(false);
      return;
    }
    void fetch("/api/admin", { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => response.json())
      .then((body: { admin?: boolean }) => {
        if (body.admin) setAdmin(true);
        else {
          window.sessionStorage.removeItem(ADMIN_KEY);
          setAdmin(false);
        }
      })
      .catch(() => setAdmin(false));
  }, [open]);

  function lockAdmin() {
    window.sessionStorage.removeItem(ADMIN_KEY);
    setAdmin(false);
    setAsking(false);
    setCode("");
    setMessage("");
  }

  async function submitCode(next: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: next }),
      });
      const body = (await response.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!response.ok || !body.token) {
        setCode("");
        setMessage(body.error ?? "That code is not the admin code.");
        return;
      }
      window.sessionStorage.setItem(ADMIN_KEY, body.token);
      setAdmin(true);
      setAsking(false);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

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
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:!max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-8">
              <DialogTitle className="font-display text-2xl">Settings</DialogTitle>
              {admin ? (
                <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={lockAdmin}>
                  Lock admin
                </Button>
              ) : (
                <Button type="button" className="h-9 rounded-xl" onClick={() => setAsking(true)}>
                  Admin
                </Button>
              )}
            </div>
            <DialogDescription>
              {admin
                ? "Tick a page to put it on the TV. Set how long it stays, and when each prize is revealed."
                : "Only the admin can change the TV and the prize reveals."}
            </DialogDescription>
          </DialogHeader>
          {!admin ? (
            asking ? (
              <form
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (code.length === 4) void submitCode(code);
                }}
              >
                <label className="grid gap-1">
                  <span className="text-sm font-bold">Admin code</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={code}
                    aria-label="Admin code"
                    disabled={busy}
                    onChange={(event) => {
                      const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                      setCode(next);
                      setMessage("");
                      if (next.length === 4) void submitCode(next);
                    }}
                    className="h-12 rounded-xl border border-input bg-transparent px-3 text-center font-display text-2xl tracking-[0.4em]"
                  />
                </label>
                {message ? (
                  <p className="text-sm font-semibold text-[#8d1f1f]" role="status">
                    {message}
                  </p>
                ) : null}
              </form>
            ) : null
          ) : (
          <>
          <div className="grid gap-3">
            {VIEWS.map((view) => (
              <ScreenRow
                key={view.id}
                id={view.id}
                label={view.label}
                seconds={prefs.dwells[view.id]}
                shown={prefs.shown[view.id]}
              />
            ))}
          </div>
          <section className="grid gap-3 rounded-2xl border border-[#e2a01a]/40 bg-[#fff8df] p-3">
            <div>
              <h3 className="font-display text-xl">Prize reveals</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                One page for each teacher takedown. Before the date, the TV counts down on the
                silhouette. On the day, the card flips and shows the prize.
              </p>
            </div>
            {REVEALS.map((reveal) => {
                const saved = prefs.reveals[reveal.id];
                return (
                  <div key={reveal.id} className="grid gap-2 rounded-xl bg-white/80 p-3">
                    <ScreenRow
                      id={reveal.id}
                      label={reveal.title}
                      seconds={prefs.dwells[reveal.id]}
                      shown={prefs.shown[reveal.id]}
                    />
                    <label className="grid gap-1">
                      <span className="text-xs font-bold">Reveal date and time</span>
                      <input
                        type="datetime-local"
                        value={toLocalInput(saved.at)}
                        aria-label={`${reveal.title} reveal date`}
                        onChange={(event) => {
                          const value = event.target.value;
                          setRevealAt(reveal.id, value ? new Date(value).getTime() : null);
                        }}
                        className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-bold">Prize line</span>
                      <input
                        type="text"
                        value={saved.prize}
                        aria-label={`${reveal.title} prize line`}
                        placeholder="Dress a teacher in clothes of your choice for a day"
                        onChange={(event) => setRevealPrize(reveal.id, event.target.value)}
                        className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 rounded-xl"
                      onClick={() => {
                        setOpen(false);
                        onPreview(reveal.id);
                      }}
                    >
                      Preview
                    </Button>
                  </div>
                );
              })}
          </section>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Finish date and time</span>
            <input
              type="datetime-local"
              value={toLocalInput(prefs.finishAt)}
              aria-label="Finish date and time"
              onChange={(event) => {
                const value = event.target.value;
                setFinishAt(value ? new Date(value).getTime() : null);
              }}
              className="h-11 rounded-xl border border-input bg-transparent px-3 text-base font-bold"
            />
            <span className="text-xs font-semibold text-muted-foreground">
              The board counts the days until this moment. Clear the field to hide the clock.
            </span>
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
          </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ScreenRow({
  id,
  label,
  seconds,
  shown,
}: {
  id: ScreenId;
  label: string;
  seconds: number;
  shown: boolean;
}) {
  return (
    <div className="grid grid-cols-[1.4rem_minmax(0,1fr)_2.6rem] items-center gap-2">
      <input
        type="checkbox"
        checked={shown}
        aria-label={`Show ${label} on the TV`}
        onChange={(event) => setScreenShown(id, event.target.checked)}
        className="size-5 accent-[#e2a01a]"
      />
      <label className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
        <span className="truncate text-sm font-bold">{label}</span>
        <input
          type="range"
          min={MIN_DWELL_SECONDS}
          max={MAX_DWELL_SECONDS}
          step={1}
          value={seconds}
          aria-label={`${label} seconds`}
          onChange={(event) => setViewDwell(id, Number(event.target.value))}
          className="accent-[#e2a01a]"
        />
      </label>
      <span className="text-right font-display text-lg tabular-nums">{seconds}s</span>
    </div>
  );
}

function toLocalInput(value: number | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
