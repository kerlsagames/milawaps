"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
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
  resetReveals,
  setCricketCode,
  setFinishAt,
  setRevealAt,
  setRevealImage,
  setRevealLabel,
  setRevealPrize,
  setScreenShown,
  setTimerStyle,
  setViewDwell,
  useDeskPrefs,
} from "@/lib/desk-prefs";
import { compressPrizeImage } from "@/lib/prize-image";
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
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetNote, setResetNote] = useState("");

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

  async function resetBoard() {
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    setBusy(true);
    setResetNote("");
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setResetNote("The scores did not reset.");
        return;
      }
      resetReveals();
      setConfirmReset(false);
      setResetNote("Scores and reveals are cleared.");
    } catch {
      setResetNote("The scores did not reset.");
    } finally {
      setBusy(false);
    }
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
                ? "Tick a page to put it on the TV, set the prize reveals, or reset the board."
                : "Set how long the leaderboard, prizes, and yard pages stay on the TV."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <p className="text-sm font-bold">Bottom timer</p>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Bottom timer">
              {(
                [
                  ["blocks", "Coloured rectangles"],
                  ["race", "Running race"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={prefs.timer === id}
                  onClick={() => setTimerStyle(id)}
                  className={
                    prefs.timer === id
                      ? "h-11 rounded-xl bg-[#2a1c04] text-sm font-extrabold text-[#ffe08a] shadow-[0_3px_0_#6b5844]"
                      : "h-11 rounded-xl border border-black/10 bg-white text-sm font-extrabold"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            {VIEWS.map((view) => (
              <ScreenRow
                key={view.id}
                id={view.id}
                label={view.label}
                seconds={prefs.dwells[view.id]}
                shown={admin ? prefs.shown[view.id] : undefined}
              />
            ))}
          </div>
          <label className="grid gap-1.5">
            <span className="text-sm font-bold">Cricket code</span>
            <input
              type="text"
              value={prefs.cricketCode}
              aria-label="Cricket code"
              placeholder="Short code, such as BQWA8Z"
              onChange={(event) => setCricketCode(event.target.value)}
              className="h-11 rounded-xl border border-input bg-transparent px-3 text-base font-bold"
            />
            <span className="text-xs font-semibold text-muted-foreground">
              Paste the short code from Jimmy’s cricket, or a share link. The TV adds a Cricket
              page with the ladder, the draw, and a few stats. Clear this to take the page off.
            </span>
          </label>
          {prefs.cricketCode ? (
            <ScreenRow
              id="cricket"
              label="Cricket"
              seconds={prefs.dwells.cricket}
              shown={undefined}
            />
          ) : null}
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
          <section className="grid gap-3 rounded-2xl border border-[#e2a01a]/40 bg-[#fff8df] p-3">
            <div>
              <h3 className="font-display text-xl">Prize reveals</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                Rename a reward and add a picture, so ice cream can become movie day. Before the
                date, prize stops show a lock and teacher takedowns show the silhouette. On the
                day, the card flips and that prize shows in the circle.
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
                    <MomentFields
                      at={saved.at}
                      saveLabel="Save reveal time"
                      dateLabel={`${reveal.title} date`}
                      timeLabel={`${reveal.title} time`}
                      onSave={(at) => setRevealAt(reveal.id, at)}
                    />
                    <label className="grid gap-1">
                      <span className="text-xs font-bold">TV name</span>
                      <input
                        type="text"
                        value={saved.label}
                        aria-label={`${reveal.title} TV name`}
                        placeholder="Ice cream"
                        onChange={(event) => setRevealLabel(reveal.id, event.target.value)}
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
                    <PrizeImageField
                      label={`${reveal.title} picture`}
                      image={saved.image}
                      onPick={(image) => setRevealImage(reveal.id, image)}
                    />
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
          <div className="grid gap-1.5">
            <span className="text-sm font-bold">Finish date and time</span>
            <MomentFields
              at={prefs.finishAt}
              saveLabel="Save finish time"
              dateLabel="Finish date"
              timeLabel="Finish time"
              onSave={setFinishAt}
            />
            <span className="text-xs font-semibold text-muted-foreground">
              The prizes page shows Countdown clock beside the days, hours, minutes, and seconds. Clear both fields and tap Save to hide the clock.
            </span>
          </div>
          {confirmReset ? (
            <div className="grid gap-2 rounded-2xl border border-[#c23b3b]/40 bg-[#fff1f1] p-3">
              <p className="text-sm font-bold text-[#8d1f1f]">
                This clears every class score and every prize reveal on this TV.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setConfirmReset(false)}>
                  Keep them
                </Button>
                <Button
                  type="button"
                  className="h-10 rounded-xl bg-[#8d1f1f] text-white"
                  disabled={busy}
                  onClick={() => void resetBoard()}
                >
                  Reset now
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => setConfirmReset(true)}>
              Reset scores and reveals
            </Button>
          )}
          {resetNote ? (
            <p className="text-sm font-semibold" role="status">
              {resetNote}
            </p>
          ) : null}
          </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PrizeImageField({
  label,
  image,
  onPick,
}: {
  label: string;
  image: string | null;
  onPick: (image: string | null) => boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-1">
      <span className="text-xs font-bold">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-input bg-[#fffdf8]">
          {image ? (
            <img src={image} alt="" className="size-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[10px] leading-tight font-bold text-muted-foreground">
              No picture
            </span>
          )}
        </div>
        <div className="grid gap-1">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-input px-3 text-sm font-bold">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label={label}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void compressPrizeImage(file)
                  .then((data) => {
                    const saved = onPick(data);
                    setError(saved ? null : "That picture is too big for this TV to keep.");
                  })
                  .catch((reason: unknown) => {
                    setError(reason instanceof Error ? reason.message : "Could not read that picture.");
                  });
              }}
            />
            {image ? "Change picture" : "Add picture"}
          </label>
          {image ? (
            <button
              type="button"
              className="text-left text-xs font-bold text-muted-foreground underline"
              onClick={() => {
                onPick(null);
                setError(null);
              }}
            >
              Use the original
            </button>
          ) : null}
        </div>
      </div>
      {error ? <p className="text-xs font-bold text-[#8d1f1f]">{error}</p> : null}
    </div>
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
  shown?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center gap-2">
        {shown === undefined ? null : (
          <input
            type="checkbox"
            checked={shown}
            aria-label={`Show ${label} on the TV`}
            onChange={(event) => setScreenShown(id, event.target.checked)}
            className="size-5 accent-[#e2a01a]"
          />
        )}
        <span className="min-w-0 flex-1 text-sm leading-tight font-bold">{label}</span>
        <span className="font-display text-lg tabular-nums">{seconds}s</span>
      </div>
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
    </div>
  );
}

function splitLocal(value: number | null) {
  if (!value) return { date: "", time: "" };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: "", time: "" };
  const pad = (part: number) => String(part).padStart(2, "0");
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

function formatWhen(stamp: number) {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(stamp);
}

function MomentFields({
  at,
  onSave,
  dateLabel,
  timeLabel,
  saveLabel,
}: {
  at: number | null;
  onSave: (at: number | null) => void;
  dateLabel: string;
  timeLabel: string;
  saveLabel: string;
}) {
  const saved = splitLocal(at);
  const [date, setDate] = useState(saved.date);
  const [time, setTime] = useState(saved.time);
  const [note, setNote] = useState("");

  useEffect(() => {
    const next = splitLocal(at);
    setDate(next.date);
    setTime(next.time);
  }, [at]);

  function save() {
    if (!date && !time) {
      onSave(null);
      setNote("Cleared");
      return;
    }
    if (!date || !time) {
      setNote("Choose a date and a time, then tap Save.");
      return;
    }
    const stamp = new Date(`${date}T${time}`).getTime();
    if (!Number.isFinite(stamp)) {
      setNote("That time did not save. Try again.");
      return;
    }
    onSave(stamp);
    setNote(`Saved ${formatWhen(stamp)}`);
  }

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1">
          <span className="text-xs font-bold">Date</span>
          <input
            type="date"
            value={date}
            aria-label={dateLabel}
            onChange={(event) => {
              setDate(event.target.value);
              setNote("");
            }}
            className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-xs font-bold">Time</span>
          <input
            type="time"
            value={time}
            aria-label={timeLabel}
            onChange={(event) => {
              setTime(event.target.value);
              setNote("");
            }}
            className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground" role="status">
          {note || (at ? `Set for ${formatWhen(at)}` : "Not set yet")}
        </p>
        <Button type="button" className="h-9 shrink-0 rounded-xl" onClick={save}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
