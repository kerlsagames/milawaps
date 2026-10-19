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
import { VIEWS, type PublicBoard } from "@/lib/game";
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
import { emptyNews, type DailyNews } from "@/lib/news";
import { compressPrizeImage } from "@/lib/prize-image";
import { REVEALS, type FixedScreenId, type ScreenId } from "@/lib/reveals";

const ADMIN_KEY = "ott-admin";

export function KioskSettings({
  onPreview,
  news,
  onBoard,
}: {
  onPreview: (screen: ScreenId) => void;
  news?: DailyNews;
  onBoard?: (board: PublicBoard) => void;
}) {
  const prefs = useDeskPrefs();
  const [open, setOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetNote, setResetNote] = useState("");
  const [draftNews, setDraftNews] = useState<DailyNews>(news ?? emptyNews());

  useEffect(() => {
    if (!open) return;
    setDraftNews(news ?? emptyNews());
  }, [open, news]);

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
            <ScreenRow
              id="news"
              label="Daily News"
              seconds={prefs.dwells.news}
              shown={admin ? prefs.shown.news : undefined}
            />
            <ScreenRow
              id="highlight"
              label="Student Highlight pages"
              seconds={prefs.dwells.highlight}
              shown={admin ? prefs.shown.highlight : undefined}
            />
            <p className="text-xs font-semibold text-muted-foreground">
              Daily News and Student Highlight stay off the kiosk until a teacher ticks them here.
              Each new highlight becomes its own TV page for two days.
            </p>
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
          <NewsEditor
            news={draftNews}
            busy={busy}
            onChange={setDraftNews}
            onSave={async () => {
              const token = window.sessionStorage.getItem(ADMIN_KEY);
              if (!token) return;
              setBusy(true);
              setResetNote("");
              try {
                const response = await fetch("/api/news", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(draftNews),
                });
                const body = (await response.json().catch(() => ({}))) as PublicBoard & {
                  error?: string;
                };
                if (!response.ok) {
                  setResetNote(body.error ?? "The news page did not save.");
                  return;
                }
                onBoard?.(body);
                setDraftNews(body.news);
                setResetNote("Daily News saved.");
              } catch {
                setResetNote("The news page did not save.");
              } finally {
                setBusy(false);
              }
            }}
          />
          <section className="grid gap-3 rounded-2xl border border-[#e2a01a]/40 bg-[#fff8df] p-3">
            <div>
              <h3 className="font-display text-xl">Prize reveals</h3>
              <p className="text-xs font-semibold text-muted-foreground">
                Change what a prize says, and upload a picture if ice cream becomes movie day. The
                thumbnail is the picture this TV will use. Before the date, prize stops show a lock
                and teacher takedowns show the silhouette. On the day, the card flips and that
                prize shows in the circle.
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
                    <PrizeWords
                      reveal={reveal}
                      says={saved.label}
                      line={saved.prize}
                      image={saved.image}
                      onSays={(value) => setRevealLabel(reveal.id, value)}
                      onLine={(value) => setRevealPrize(reveal.id, value)}
                      onImage={(image) => setRevealImage(reveal.id, image)}
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

function PrizeWords({
  reveal,
  says,
  line,
  image,
  onSays,
  onLine,
  onImage,
}: {
  reveal: (typeof REVEALS)[number];
  says: string;
  line: string;
  image: string | null;
  onSays: (value: string) => void;
  onLine: (value: string) => void;
  onImage: (image: string | null) => boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const thumb = image || reveal.image;
  const caption = says.trim() || reveal.title;

  return (
    <div className="grid gap-2">
      <div className="flex items-start gap-3">
        <img
          src={thumb}
          alt=""
          className="size-16 shrink-0 rounded-xl border border-input object-cover"
        />
        <div className="grid min-w-0 flex-1 gap-2">
          <label className="grid gap-1">
            <span className="text-xs font-bold">Says</span>
            <input
              type="text"
              value={says}
              aria-label={`${reveal.mask} says`}
              placeholder={reveal.title}
              onChange={(event) => onSays(event.target.value)}
              className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-input px-3 text-sm font-bold">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label={`${caption} picture`}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  void compressPrizeImage(file)
                    .then((data) => {
                      const saved = onImage(data);
                      setError(saved ? null : "That picture is too big for this TV to keep.");
                    })
                    .catch((reason: unknown) => {
                      setError(reason instanceof Error ? reason.message : "Could not read that picture.");
                    });
                }}
              />
              {image ? "Change picture" : "Upload picture"}
            </label>
            {image ? (
              <button
                type="button"
                className="text-xs font-bold text-muted-foreground underline"
                onClick={() => {
                  onImage(null);
                  setError(null);
                }}
              >
                Use the original
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-bold">Prize line</span>
        <input
          type="text"
          value={line}
          aria-label={`${reveal.mask} prize line`}
          placeholder={reveal.prize}
          onChange={(event) => onLine(event.target.value)}
          className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
        />
      </label>
      {error ? <p className="text-xs font-bold text-[#8d1f1f]">{error}</p> : null}
    </div>
  );
}

function NewsEditor({
  news,
  busy,
  onChange,
  onSave,
}: {
  news: DailyNews;
  busy: boolean;
  onChange: (news: DailyNews) => void;
  onSave: () => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="grid gap-3 rounded-2xl border border-[#1f6f8b]/30 bg-[#eef9ff] p-3">
      <div>
        <h3 className="font-display text-xl">Daily News</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Write the headline kids will check, add reminders and coming-up lines, and upload a photo.
        </p>
      </div>
      <label className="grid gap-1">
        <span className="text-xs font-bold">Headline</span>
        <input
          type="text"
          value={news.headline}
          aria-label="News headline"
          onChange={(event) => onChange({ ...news, headline: event.target.value.slice(0, 80) })}
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm font-bold"
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-bold">Blurb</span>
        <input
          type="text"
          value={news.blurb}
          aria-label="News blurb"
          onChange={(event) => onChange({ ...news, blurb: event.target.value.slice(0, 200) })}
          className="h-10 rounded-xl border border-input bg-white px-3 text-sm font-bold"
        />
      </label>
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-input bg-white">
          {news.picture ? (
            <img src={news.picture} alt="" className="size-full object-cover" />
          ) : (
            <span className="px-1 text-center text-[10px] font-bold text-muted-foreground">No pic</span>
          )}
        </div>
        <div className="grid gap-1">
          <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-input bg-white px-3 text-sm font-bold">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="News picture"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void compressPrizeImage(file)
                  .then((data) => {
                    onChange({ ...news, picture: data });
                    setError(null);
                  })
                  .catch((reason: unknown) => {
                    setError(reason instanceof Error ? reason.message : "Could not read that picture.");
                  });
              }}
            />
            {news.picture ? "Change picture" : "Upload picture"}
          </label>
          {news.picture ? (
            <button
              type="button"
              className="text-left text-xs font-bold text-muted-foreground underline"
              onClick={() => onChange({ ...news, picture: null })}
            >
              Clear picture
            </button>
          ) : null}
        </div>
      </div>
      <LineList
        title="Reminders"
        lines={news.reminders.map((item) => item.text)}
        onChange={(lines) =>
          onChange({
            ...news,
            reminders: lines.map((text, index) => ({
              id: news.reminders[index]?.id || `reminder-${index}`,
              text,
            })),
          })
        }
      />
      <UpcomingList
        rows={news.upcoming}
        onChange={(upcoming) => onChange({ ...news, upcoming })}
      />
      {error ? <p className="text-xs font-bold text-[#8d1f1f]">{error}</p> : null}
      <Button type="button" className="h-10 rounded-xl" disabled={busy} onClick={() => void onSave()}>
        Save Daily News
      </Button>
    </section>
  );
}

function LineList({
  title,
  lines,
  onChange,
}: {
  title: string;
  lines: string[];
  onChange: (lines: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">{title}</span>
        <button
          type="button"
          className="text-xs font-bold underline"
          onClick={() => onChange([...lines, ""].slice(0, 8))}
        >
          Add
        </button>
      </div>
      {lines.map((line, index) => (
        <div key={index} className="flex gap-2">
          <input
            type="text"
            value={line}
            aria-label={`${title} ${index + 1}`}
            onChange={(event) => {
              const next = [...lines];
              next[index] = event.target.value.slice(0, 120);
              onChange(next);
            }}
            className="h-10 min-w-0 flex-1 rounded-xl border border-input bg-white px-3 text-sm font-bold"
          />
          <button
            type="button"
            className="text-xs font-bold text-muted-foreground underline"
            onClick={() => onChange(lines.filter((_, item) => item !== index))}
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function UpcomingList({
  rows,
  onChange,
}: {
  rows: DailyNews["upcoming"];
  onChange: (rows: DailyNews["upcoming"]) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">Coming up</span>
        <button
          type="button"
          className="text-xs font-bold underline"
          onClick={() =>
            onChange([...rows, { id: `upcoming-${rows.length}`, when: "", text: "" }].slice(0, 8))
          }
        >
          Add
        </button>
      </div>
      {rows.map((row, index) => (
        <div key={row.id} className="grid gap-1 rounded-xl bg-white/80 p-2">
          <input
            type="text"
            value={row.when}
            aria-label={`Coming up when ${index + 1}`}
            placeholder="Fri recess"
            onChange={(event) => {
              const next = [...rows];
              next[index] = { ...row, when: event.target.value.slice(0, 40) };
              onChange(next);
            }}
            className="h-9 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={row.text}
              aria-label={`Coming up text ${index + 1}`}
              placeholder="Assembly in the hall"
              onChange={(event) => {
                const next = [...rows];
                next[index] = { ...row, text: event.target.value.slice(0, 120) };
                onChange(next);
              }}
              className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
            />
            <button
              type="button"
              className="text-xs font-bold text-muted-foreground underline"
              onClick={() => onChange(rows.filter((_, item) => item !== index))}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScreenRow({
  id,
  label,
  seconds,
  shown,
}: {
  id: FixedScreenId;
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
