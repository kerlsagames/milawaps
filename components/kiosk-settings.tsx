"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Gift,
  Map,
  Newspaper,
  Settings,
  Sparkles,
  Trophy,
  Volleyball,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicBoard } from "@/lib/game";
import {
  MAX_DWELL_SECONDS,
  MIN_DWELL_SECONDS,
  resetReveals,
  saveSiteDisplay,
  setCricketPanelsLocal,
  setFinishAt,
  setNewsLayoutLocal,
  setRevealAt,
  setRevealImage,
  setRevealLabel,
  setRevealPrize,
  setScreenShown,
  setTimerStyle,
  setViewDwell,
  useDeskPrefs,
} from "@/lib/desk-prefs";
import { highlightsToCsv, type HighlightEntry } from "@/lib/highlights";
import { emptyNews, type DailyNews } from "@/lib/news";
import { compressPrizeImage } from "@/lib/prize-image";
import { REVEALS, type FixedScreenId, type ScreenId } from "@/lib/reveals";
import {
  NEWS_LAYOUTS,
  type CricketPanels,
  type NewsLayoutId,
} from "@/lib/site-display";
import { cn } from "@/lib/utils";

const ADMIN_KEY = "ott-admin";

type SettingsPage =
  | "home"
  | "board"
  | "prizes"
  | "yard"
  | "news"
  | "highlight"
  | "cricket"
  | "reveals";

const PAGE_BUTTONS: {
  id: SettingsPage;
  label: string;
  blurb: string;
  icon: typeof Trophy;
  tone: string;
}[] = [
  { id: "board", label: "Leaderboard", blurb: "Show time on the TV", icon: Trophy, tone: "#e2a01a" },
  { id: "prizes", label: "Prizes", blurb: "Countdown page", icon: Gift, tone: "#ff7a59" },
  { id: "yard", label: "Yard & Rules", blurb: "Yard duty rules", icon: Map, tone: "#2ec9a0" },
  { id: "news", label: "Daily News", blurb: "Layout, copy, photo", icon: Newspaper, tone: "#1f6f8b" },
  { id: "highlight", label: "Highlights", blurb: "Student star pages", icon: Sparkles, tone: "#7b4bff" },
  { id: "cricket", label: "Cricket", blurb: "Code, show, panels", icon: Volleyball, tone: "#0d7a64" },
  { id: "reveals", label: "Prize reveals", blurb: "Times, names, pictures", icon: Gift, tone: "#c48a16" },
];

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
  const [page, setPage] = useState<SettingsPage>("home");
  const [admin, setAdmin] = useState(false);
  const [asking, setAsking] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [note, setNote] = useState("");
  const [draftNews, setDraftNews] = useState<DailyNews>(news ?? emptyNews());
  const [draftCricket, setDraftCricket] = useState(prefs.cricketCode);

  useEffect(() => {
    if (!open) {
      setPage("home");
      return;
    }
    setDraftNews(news ?? emptyNews());
  }, [open, news]);

  useEffect(() => {
    if (!open) return;
    setDraftCricket(prefs.cricketCode);
  }, [open, prefs.cricketCode]);

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

  async function patchDisplay(
    patch: {
      shown?: Partial<Record<FixedScreenId, boolean>>;
      cricketCode?: string;
      newsLayout?: NewsLayoutId;
      cricketPanels?: Partial<CricketPanels>;
      finishAt?: number | null;
    },
    okNote: string,
  ) {
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    setNote("");
    const result = await saveSiteDisplay(patch, token);
    if (!result.ok) {
      setNote(result.error);
      return false;
    }
    onBoard?.(result.board);
    setNote(okNote);
    return true;
  }

  /** Flip the checkbox straight away, then save in the background. */
  async function saveShown(id: FixedScreenId, next: boolean) {
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    if (id === "cricket" && next && !prefs.cricketCode.trim()) {
      setNote("Paste a cricket code first, then turn Cricket on.");
      return;
    }
    const previous = prefs.shown[id];
    setScreenShown(id, next);
    setNote("");
    const result = await saveSiteDisplay({ shown: { [id]: next } }, token);
    if (!result.ok) {
      setScreenShown(id, previous);
      setNote(result.error);
      return;
    }
    onBoard?.(result.board);
    setNote("TV pages updated for everyone.");
  }

  async function saveCricket(codeValue: string) {
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    setNote("");
    const result = await saveSiteDisplay({ cricketCode: codeValue }, token);
    if (!result.ok) {
      setNote(result.error);
      return;
    }
    onBoard?.(result.board);
    setNote(codeValue.trim() ? "Cricket code saved for everyone." : "Cricket page cleared for everyone.");
  }

  async function resetBoard() {
    const token = window.sessionStorage.getItem(ADMIN_KEY);
    if (!token) return;
    setBusy(true);
    setNote("");
    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setNote("The scores did not reset.");
        return;
      }
      resetReveals();
      setConfirmReset(false);
      setNote("Scores and reveals are cleared.");
    } catch {
      setNote("The scores did not reset.");
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

  const title =
    page === "home"
      ? "Settings"
      : page === "reveals"
        ? "Prize reveals"
        : PAGE_BUTTONS.find((item) => item.id === page)?.label ?? "Settings";

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
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setPage("home");
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:!max-w-xl">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-8">
              <div className="flex min-w-0 items-center gap-2">
                {page !== "home" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Back to settings"
                    className="size-9 shrink-0 rounded-xl"
                    onClick={() => setPage("home")}
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                ) : null}
                <DialogTitle className="truncate font-display text-2xl">{title}</DialogTitle>
              </div>
              {admin ? (
                <Button type="button" variant="outline" className="h-9 shrink-0 rounded-xl" onClick={lockAdmin}>
                  Lock admin
                </Button>
              ) : (
                <Button type="button" className="h-9 shrink-0 rounded-xl" onClick={() => setAsking(true)}>
                  Admin
                </Button>
              )}
            </div>
            <DialogDescription>
              {page === "home"
                ? admin
                  ? "Open a page to show or hide it on every TV, and tweak that page."
                  : "Open a page to set how long it stays on the TV."
                : "Changes here apply to every milawaps screen once an admin saves them."}
            </DialogDescription>
          </DialogHeader>

          {page === "home" ? (
            <HomePanel
              admin={admin}
              asking={asking}
              busy={busy}
              code={code}
              message={message}
              note={note}
              confirmReset={confirmReset}
              prefsTimer={prefs.timer}
              prefsFinishAt={prefs.finishAt}
              onCode={(value) => {
                setCode(value);
                setMessage("");
                if (value.length === 4) void submitCode(value);
              }}
              onSubmitCode={() => {
                if (code.length === 4) void submitCode(code);
              }}
              onOpenPage={setPage}
              onTimer={setTimerStyle}
              onFinish={(at) => {
                setFinishAt(at);
                void patchDisplay(
                  { finishAt: at },
                  at
                    ? "Finish time saved for every TV."
                    : "Finish time cleared on every TV.",
                );
              }}
              onConfirmReset={setConfirmReset}
              onReset={() => void resetBoard()}
            />
          ) : null}

          {page === "board" || page === "prizes" || page === "yard" ? (
            <BasicPagePanel
              id={page}
              label={title}
              seconds={prefs.dwells[page]}
              shown={prefs.shown[page]}
              admin={admin}
              onShown={(next) => void saveShown(page, next)}
              onPreview={() => {
                setOpen(false);
                onPreview(page);
              }}
            />
          ) : null}

          {page === "highlight" ? (
            <HighlightPagePanel
              seconds={prefs.dwells.highlight}
              shown={prefs.shown.highlight}
              admin={admin}
              onShown={(next) => void saveShown("highlight", next)}
              onPreview={() => {
                setOpen(false);
                onPreview("highlight");
              }}
              onNote={setNote}
            />
          ) : null}

          {page === "news" ? (
            <NewsPagePanel
              admin={admin}
              shown={prefs.shown.news}
              seconds={prefs.dwells.news}
              layout={prefs.newsLayout}
              news={draftNews}
              busy={busy}
              onShown={(next) => void saveShown("news", next)}
              onLayout={(layout) => {
                const previous = prefs.newsLayout;
                setNewsLayoutLocal(layout);
                void patchDisplay({ newsLayout: layout }, "Daily News layout saved for everyone.").then(
                  (ok) => {
                    if (ok === false) setNewsLayoutLocal(previous);
                  },
                );
              }}
              onChange={setDraftNews}
              onPreview={() => {
                setOpen(false);
                onPreview("news");
              }}
              onSave={async () => {
                const token = window.sessionStorage.getItem(ADMIN_KEY);
                if (!token) return;
                setBusy(true);
                setNote("");
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
                    setNote(body.error ?? "The news page did not save.");
                    return;
                  }
                  onBoard?.(body);
                  setDraftNews(body.news);
                  setNote("Daily News saved.");
                } catch {
                  setNote("The news page did not save.");
                } finally {
                  setBusy(false);
                }
              }}
            />
          ) : null}

          {page === "cricket" ? (
            <CricketPagePanel
              admin={admin}
              shown={prefs.shown.cricket}
              seconds={prefs.dwells.cricket}
              draftCode={admin ? draftCricket : prefs.cricketCode}
              panels={prefs.cricketPanels}
              onShown={(next) => void saveShown("cricket", next)}
              onDraftCode={setDraftCricket}
              onSaveCode={() => {
                if (!admin) return;
                void saveCricket(draftCricket);
              }}
              onPanel={(key, value) => {
                const previous = prefs.cricketPanels;
                const next = { ...previous, [key]: value };
                setCricketPanelsLocal(next);
                void patchDisplay(
                  { cricketPanels: { [key]: value } },
                  "Cricket panels updated for everyone.",
                ).then((ok) => {
                  if (ok === false) setCricketPanelsLocal(previous);
                });
              }}
              onPreview={() => {
                setOpen(false);
                onPreview("cricket");
              }}
            />
          ) : null}

          {page === "reveals" && admin ? (
            <RevealsPanel
              prefs={prefs}
              onShown={(id, next) => void saveShown(id, next)}
              onPreview={(id) => {
                setOpen(false);
                onPreview(id);
              }}
            />
          ) : null}

          {page === "reveals" && !admin ? (
            <p className="text-sm font-semibold text-muted-foreground">
              Unlock Admin to edit prize reveal times, names, and pictures.
            </p>
          ) : null}

          {note && page !== "home" ? (
            <p className="text-sm font-semibold" role="status">
              {note}
            </p>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function HomePanel({
  admin,
  asking,
  busy,
  code,
  message,
  note,
  confirmReset,
  prefsTimer,
  prefsFinishAt,
  onCode,
  onSubmitCode,
  onOpenPage,
  onTimer,
  onFinish,
  onConfirmReset,
  onReset,
}: {
  admin: boolean;
  asking: boolean;
  busy: boolean;
  code: string;
  message: string;
  note: string;
  confirmReset: boolean;
  prefsTimer: "race" | "blocks";
  prefsFinishAt: number | null;
  onCode: (value: string) => void;
  onSubmitCode: () => void;
  onOpenPage: (page: SettingsPage) => void;
  onTimer: (timer: "race" | "blocks") => void;
  onFinish: (at: number | null) => void;
  onConfirmReset: (value: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm font-bold">Pages</p>
        <div className="grid grid-cols-2 gap-2">
          {PAGE_BUTTONS.map((item) => {
            const Icon = item.icon;
            if (item.id === "reveals" && !admin) return null;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenPage(item.id)}
                className="flex items-start gap-2 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-[0_3px_0_rgba(42,28,4,0.08)] transition hover:-translate-y-0.5"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-[#2a1c04]"
                  style={{ background: item.tone }}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold">{item.label}</span>
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    {item.blurb}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
              aria-pressed={prefsTimer === id}
              onClick={() => onTimer(id)}
              className={
                prefsTimer === id
                  ? "h-11 rounded-xl bg-[#2a1c04] text-sm font-extrabold text-[#ffe08a] shadow-[0_3px_0_#6b5844]"
                  : "h-11 rounded-xl border border-black/10 bg-white text-sm font-extrabold"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {admin ? (
        <div className="grid gap-1.5">
          <span className="text-sm font-bold">Finish date and time</span>
          <p className="text-xs font-semibold text-muted-foreground">
            Saves to every milawaps TV — the prize-path countdown uses this clock.
          </p>
          <MomentFields
            at={prefsFinishAt}
            saveLabel="Save finish time"
            dateLabel="Finish date"
            timeLabel="Finish time"
            onSave={onFinish}
          />
        </div>
      ) : null}

      {!admin && asking ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitCode();
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
                onCode(event.target.value.replace(/\D/g, "").slice(0, 4));
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
      ) : null}

      {admin ? (
        confirmReset ? (
          <div className="grid gap-2 rounded-2xl border border-[#c23b3b]/40 bg-[#fff1f1] p-3">
            <p className="text-sm font-bold text-[#8d1f1f]">
              This clears every class score and every prize reveal on this TV.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onConfirmReset(false)}>
                Keep them
              </Button>
              <Button
                type="button"
                className="h-10 rounded-xl bg-[#8d1f1f] text-white"
                disabled={busy}
                onClick={onReset}
              >
                Reset now
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={() => onConfirmReset(true)}>
            Reset scores and reveals
          </Button>
        )
      ) : null}

      {note ? (
        <p className="text-sm font-semibold" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function BasicPagePanel({
  id,
  label,
  seconds,
  shown,
  admin,
  onShown,
  onPreview,
}: {
  id: FixedScreenId;
  label: string;
  seconds: number;
  shown: boolean;
  admin: boolean;
  onShown: (next: boolean) => void;
  onPreview: () => void;
}) {
  return (
    <div className="grid gap-3">
      {admin ? (
        <ShowToggle
          label={`Show ${label} on every TV`}
          checked={shown}
          onChange={onShown}
        />
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">
          An admin turns this page on or off for the whole school.
        </p>
      )}
      <DwellSlider id={id} label={label} seconds={seconds} />
      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onPreview}>
        Preview {label}
      </Button>
    </div>
  );
}

function HighlightPagePanel({
  seconds,
  shown,
  admin,
  onShown,
  onPreview,
  onNote,
}: {
  seconds: number;
  shown: boolean;
  admin: boolean;
  onShown: (next: boolean) => void;
  onPreview: () => void;
  onNote: (note: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function downloadSpreadsheet() {
    setBusy(true);
    onNote("");
    try {
      const response = await fetch("/api/highlight", { cache: "no-store" });
      const body = (await response.json().catch(() => ({}))) as {
        highlights?: HighlightEntry[];
        error?: string;
      };
      if (!response.ok) {
        onNote(body.error ?? "Could not load spotlights.");
        return;
      }
      const rows = body.highlights ?? [];
      if (rows.length === 0) {
        onNote("No student spotlights saved yet.");
        return;
      }
      const csv = highlightsToCsv(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `milawaps-spotlights-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      onNote(`Downloaded ${rows.length} spotlight${rows.length === 1 ? "" : "s"}.`);
    } catch {
      onNote("Could not download spotlights.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      {admin ? (
        <ShowToggle label="Show Student Highlights on every TV" checked={shown} onChange={onShown} />
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">
          An admin turns this page on or off for the whole school.
        </p>
      )}
      <DwellSlider id="highlight" label="Highlights" seconds={seconds} />
      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onPreview}>
        Preview Highlights
      </Button>
      <div className="rounded-2xl border border-black/10 bg-[#fff8df] px-3 py-3">
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          Each spotlight stays on the TV for 25 hours, then leaves on its own.
        </p>
        <p className="mt-3 text-sm font-extrabold text-[#2a1c04]">Spotlight spreadsheet</p>
        <p className="mt-1 text-xs font-semibold text-muted-foreground">
          Download every saved student spotlight (live and recent history) as a CSV for Excel or
          Sheets.
        </p>
        <Button
          type="button"
          className="mt-3 h-10 w-full rounded-xl"
          disabled={busy}
          onClick={() => void downloadSpreadsheet()}
        >
          {busy ? "Preparing…" : "Download spotlights CSV"}
        </Button>
      </div>
    </div>
  );
}

function NewsPagePanel({
  admin,
  shown,
  seconds,
  layout,
  news,
  busy,
  onShown,
  onLayout,
  onChange,
  onPreview,
  onSave,
}: {
  admin: boolean;
  shown: boolean;
  seconds: number;
  layout: NewsLayoutId;
  news: DailyNews;
  busy: boolean;
  onShown: (next: boolean) => void;
  onLayout: (layout: NewsLayoutId) => void;
  onChange: (news: DailyNews) => void;
  onPreview: () => void;
  onSave: () => Promise<void>;
}) {
  return (
    <div className="grid gap-3">
      {admin ? (
        <ShowToggle label="Show Daily News on every TV" checked={shown} onChange={onShown} />
      ) : null}
      <DwellSlider id="news" label="Daily News" seconds={seconds} />
      {admin ? (
        <>
          <div className="grid gap-2">
            <p className="text-sm font-bold">Layout</p>
            <div className="grid gap-2">
              {NEWS_LAYOUTS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={layout === item.id}
                  onClick={() => onLayout(item.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left",
                    layout === item.id
                      ? "border-[#1f6f8b] bg-[#eef9ff] shadow-[0_3px_0_#1f6f8b66]"
                      : "border-black/10 bg-white",
                  )}
                >
                  <span className="block text-sm font-extrabold">{item.label}</span>
                  <span className="block text-xs font-semibold text-muted-foreground">{item.blurb}</span>
                </button>
              ))}
            </div>
          </div>
          <NewsEditor news={news} busy={busy} onChange={onChange} onSave={onSave} />
        </>
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">
          Unlock Admin to edit the Daily News layout and writing.
        </p>
      )}
      <Button type="button" variant="outline" className="h-10 rounded-xl" onClick={onPreview}>
        Preview Daily News
      </Button>
    </div>
  );
}

function CricketPagePanel({
  admin,
  shown,
  seconds,
  draftCode,
  panels,
  onShown,
  onDraftCode,
  onSaveCode,
  onPanel,
  onPreview,
}: {
  admin: boolean;
  shown: boolean;
  seconds: number;
  draftCode: string;
  panels: CricketPanels;
  onShown: (next: boolean) => void;
  onDraftCode: (value: string) => void;
  onSaveCode: () => void;
  onPanel: (key: keyof CricketPanels, value: boolean) => void;
  onPreview: () => void;
}) {
  return (
    <div className="grid gap-3">
      {admin ? (
        <ShowToggle
          label="Show Cricket on every TV"
          checked={shown}
          onChange={onShown}
          hint={!draftCode.trim() ? "Paste a Jimmy cricket code below before turning this on." : undefined}
        />
      ) : (
        <p className="text-xs font-semibold text-muted-foreground">
          {draftCode
            ? shown
              ? "Cricket is on for the whole school."
              : "Cricket code is saved, but the page is hidden until an admin turns it on."
            : "Ask an admin to paste the Jimmy cricket code."}
        </p>
      )}
      <DwellSlider id="cricket" label="Cricket" seconds={seconds} />
      <label className="grid gap-1.5">
        <span className="text-sm font-bold">Cricket code</span>
        <input
          type="text"
          value={draftCode}
          aria-label="Cricket code"
          placeholder="Short code, such as BQWA8Z"
          readOnly={!admin}
          onChange={(event) => {
            if (!admin) return;
            onDraftCode(event.target.value);
          }}
          onBlur={() => {
            if (!admin) return;
            onSaveCode();
          }}
          className="h-11 rounded-xl border border-input bg-transparent px-3 text-base font-bold read-only:opacity-70"
        />
      </label>
      {admin ? (
        <div className="grid gap-2 rounded-2xl border border-[#0d7a64]/25 bg-[#eefaf6] p-3">
          <p className="text-sm font-bold">What to show</p>
          {(
            [
              ["lastNext", "Last game + next game"],
              ["leaders", "Leader boxes"],
              ["ladder", "Ladder"],
              ["draw", "Coming up draw"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm font-bold">
              <input
                type="checkbox"
                checked={panels[key]}
                onChange={(event) => onPanel(key, event.target.checked)}
                className="size-5 accent-[#0d7a64]"
              />
              {label}
            </label>
          ))}
        </div>
      ) : null}
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-xl"
        disabled={!draftCode.trim()}
        onClick={onPreview}
      >
        Preview Cricket
      </Button>
    </div>
  );
}

function RevealsPanel({
  prefs,
  onShown,
  onPreview,
}: {
  prefs: ReturnType<typeof useDeskPrefs>;
  onShown: (id: FixedScreenId, next: boolean) => void;
  onPreview: (id: FixedScreenId) => void;
}) {
  return (
    <section className="grid gap-3">
      <p className="text-xs font-semibold text-muted-foreground">
        Change what a prize says, and upload a picture if ice cream becomes movie day. Before the
        date, prize stops show a lock. On the day, the card flips.
      </p>
      {REVEALS.map((reveal) => {
        const saved = prefs.reveals[reveal.id];
        return (
          <div key={reveal.id} className="grid gap-2 rounded-xl border border-[#e2a01a]/30 bg-[#fff8df] p-3">
            <ShowToggle
              label={`Show ${reveal.title} on the TV`}
              checked={prefs.shown[reveal.id]}
              onChange={(next) => onShown(reveal.id, next)}
            />
            <DwellSlider id={reveal.id} label={reveal.title} seconds={prefs.dwells[reveal.id]} />
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
            <Button type="button" variant="outline" className="h-9 rounded-xl" onClick={() => onPreview(reveal.id)}>
              Preview
            </Button>
          </div>
        );
      })}
    </section>
  );
}

function ShowToggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="grid gap-1">
      <label className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2.5">
        <input
          type="checkbox"
          checked={checked}
          aria-label={label}
          onChange={(event) => onChange(event.target.checked)}
          className="size-6 accent-[#e2a01a]"
        />
        <span className="text-sm font-extrabold">{label}</span>
      </label>
      {hint ? <p className="text-xs font-semibold text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DwellSlider({
  id,
  label,
  seconds,
}: {
  id: FixedScreenId;
  label: string;
  seconds: number;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">Time on TV</span>
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
        <h3 className="font-display text-xl">Writing</h3>
        <p className="text-xs font-semibold text-muted-foreground">
          Keep lines short so they fit the TV boards.
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
      <label className="grid gap-1">
        <span className="text-xs font-bold">Yard challenge (optional)</span>
        <input
          type="text"
          value={news.challenge}
          aria-label="Yard challenge"
          placeholder="e.g. Find the hidden duck — 2+ points"
          onChange={(event) => onChange({ ...news, challenge: event.target.value.slice(0, 160) })}
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
      <UpcomingList rows={news.upcoming} onChange={(upcoming) => onChange({ ...news, upcoming })} />
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
  const [fieldNote, setFieldNote] = useState("");

  useEffect(() => {
    const next = splitLocal(at);
    setDate(next.date);
    setTime(next.time);
  }, [at]);

  function save() {
    if (!date && !time) {
      onSave(null);
      setFieldNote("Cleared");
      return;
    }
    if (!date || !time) {
      setFieldNote("Choose a date and a time, then tap Save.");
      return;
    }
    const stamp = new Date(`${date}T${time}`).getTime();
    if (!Number.isFinite(stamp)) {
      setFieldNote("That time did not save. Try again.");
      return;
    }
    onSave(stamp);
    setFieldNote(`Saved ${formatWhen(stamp)}`);
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
              setFieldNote("");
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
              setFieldNote("");
            }}
            className="h-10 rounded-xl border border-input bg-transparent px-3 text-sm font-bold"
          />
        </label>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground" role="status">
          {fieldNote || (at ? `Set for ${formatWhen(at)}` : "Not set yet")}
        </p>
        <Button type="button" className="h-9 shrink-0 rounded-xl" onClick={save}>
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
