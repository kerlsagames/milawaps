"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { CricketTeamsView } from "@/components/cricket-teams-view";
import { CricketView } from "@/components/cricket-view";
import { EditPointsView } from "@/components/edit-points-view";
import { HighlightView } from "@/components/highlight-view";
import { LeaderboardView } from "@/components/leaderboard-view";
import { NewsView } from "@/components/news-view";
import { YardRulesView } from "@/components/yard-rules-view";
import { PinDialog } from "@/components/pin-dialog";
import { PrizesView } from "@/components/prizes-view";
import { ReasonPrompt } from "@/components/reason-prompt";
import { RevealView } from "@/components/reveal-view";
import { SiteHeader } from "@/components/site-header";
import { HighlightDialog } from "@/components/highlight-dialog";
import { StaffHud } from "@/components/staff-hud";
import { TodayColumn } from "@/components/today-column";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { clearToken, hydrateDisplay, saveToken, setKioskPref, useDeskPrefs } from "@/lib/desk-prefs";
import { kioskKeyDelta } from "@/lib/kiosk-keys";
import { emptyNews } from "@/lib/news";
import {
  dwellForScreen,
  kioskScreens,
  prizeIsPublic,
  revealById,
  revealForPoints,
  revealLabel,
  REVEALS,
  type ScreenId,
} from "@/lib/reveals";
import { tickerLine } from "@/lib/ticker";
import { type TodayItem } from "@/lib/today";
import { cn } from "@/lib/utils";
import {
  UNIT_IDS,
  VIEWS,
  actionLabel,
  staffName,
  unitById,
  type ActionId,
  type MilestoneEvent,
  type PublicBoard,
  type UnitId,
} from "@/lib/game";
import {
  activeHighlights,
  highlightScreenId,
  parseHighlightScreen,
} from "@/lib/highlights";
import { milestonesBetween } from "@/lib/scoring";
import { staffFromToken } from "@/lib/who";

async function fetchBoard(url: string): Promise<PublicBoard> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("The yard board is out of reach.");
  return response.json() as Promise<PublicBoard>;
}

type Toast = MilestoneEvent & { id: string };

export function YardBoard() {
  const { data, error, isLoading, mutate } = useSWR<PublicBoard>("/api/score", fetchBoard, {
    refreshInterval: 3000,
  });
  const prefs = useDeskPrefs();
  const { kiosk, token, dwells } = prefs;
  // Shared TV pages come from the server once an admin has saved them.
  const shown = data?.displayUpdatedAt ? data.shown : prefs.shown;
  const cricketCode = data?.displayUpdatedAt ? data.cricketCode : prefs.cricketCode;
  const dwellsRef = useRef(dwells);
  dwellsRef.current = dwells;
  const liveHighlights = useMemo(
    () => activeHighlights(data?.highlights ?? []),
    [data?.highlights],
  );
  const playlist = useMemo(() => kioskScreens(shown, liveHighlights), [shown, liveHighlights]);
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const [view, setView] = useState<ScreenId>("board");
  const [now, setNow] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [exitVisible, setExitVisible] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [highlightUnit, setHighlightUnit] = useState<UnitId | null>(null);
  const [removingHighlight, setRemovingHighlight] = useState(false);
  const [editBusyId, setEditBusyId] = useState<string | null>(null);
  const [pendingEdit, setPendingEdit] = useState(false);
  const [deskError, setDeskError] = useState<string | null>(null);
  const [reasonPrompt, setReasonPrompt] = useState<{ id: string; line: string } | null>(null);

  const displaySyncKey = data?.displayUpdatedAt
    ? `${data.displayUpdatedAt}:${data.cricketCode}:${JSON.stringify(data.shown)}:${data.newsLayout}:${JSON.stringify(data.cricketPanels)}:${JSON.stringify(data.cricketRosters)}:${data.finishAt ?? ""}:${JSON.stringify(data.dwells)}:${JSON.stringify(data.reveals)}`
    : "";
  useEffect(() => {
    if (!data?.displayUpdatedAt) return;
    hydrateDisplay(data.shown, data.cricketCode, {
      newsLayout: data.newsLayout,
      cricketPanels: data.cricketPanels,
      cricketRosters: data.cricketRosters,
      finishAt: data.finishAt,
      dwells: data.dwells,
      reveals: data.reveals,
    });
  }, [displaySyncKey, data]);

  // Desk (not kiosk): always browse News/Stars. TV show flags only gate the kiosk loop.
  const deskBrowse = !kiosk;
  // Unlocked yard-duty teacher extras on the board itself.
  const deskTeacher = Boolean(token) && !kiosk;

  useEffect(() => {
    if (view === "cricket" && (!cricketCode || !shown.cricket)) setView("board");
    if (view === "cricket-teams" && (!cricketCode || !shown["cricket-teams"])) setView("board");
    if (view === "news" && !shown.news && !deskBrowse) setView("board");
    if (view === "highlight" && !shown.highlight && !deskBrowse) setView("board");
    if (view === "edit" && !deskTeacher) setView("board");
    const highlightId = parseHighlightScreen(view);
    if (highlightId && !shown.highlight && !deskBrowse) setView("board");
    if (highlightId && !liveHighlights.some((entry) => entry.id === highlightId)) setView("board");
  }, [
    view,
    cricketCode,
    shown.cricket,
    shown["cricket-teams"],
    shown.news,
    shown.highlight,
    liveHighlights,
    deskBrowse,
    deskTeacher,
  ]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const startedRef = useRef(0);
  const viewRef = useRef<ScreenId>("board");
  const exitTimer = useRef<number | null>(null);
  const sawFullscreen = useRef(false);
  const seenUnits = useRef<Record<UnitId, number> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const revealExit = useCallback(() => {
    setExitVisible(true);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => setExitVisible(false), 2800);
  }, []);

  const leaveKiosk = useCallback(() => {
    setKioskPref(false);
    setExitVisible(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  const focusKioskRoot = useCallback(() => {
    document.getElementById("kiosk-root")?.focus({ preventScroll: true });
  }, []);

  const stepKiosk = useCallback((delta: 1 | -1) => {
    const screens = playlistRef.current;
    if (screens.length === 0) return;
    const index = screens.indexOf(viewRef.current);
    const from = index < 0 ? 0 : index;
    const next = screens[(from + delta + screens.length) % screens.length];
    const time = Date.now();
    startedRef.current = time;
    viewRef.current = next;
    setStartedAt(time);
    setNow(time);
    setView(next);
  }, []);

  const enterKiosk = useCallback(() => {
    const time = Date.now();
    startedRef.current = time;
    setStartedAt(time);
    setNow(time);
    setKioskPref(true);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
    // Fullscreen steals focus from Start Kiosk; reclaim it for arrow keys.
    window.setTimeout(focusKioskRoot, 0);
    window.setTimeout(focusKioskRoot, 120);
    window.setTimeout(focusKioskRoot, 400);
  }, [focusKioskRoot]);

  useEffect(() => {
    if (!kiosk) return;
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (startedRef.current === 0) {
        startedRef.current = time;
        setStartedAt(time);
        return;
      }
      const dwellMs = dwellForScreen(viewRef.current, dwellsRef.current) * 1000;
      if (time - startedRef.current >= dwellMs) {
        stepKiosk(1);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [kiosk, stepKiosk]);

  useEffect(() => {
    if (!kiosk) {
      sawFullscreen.current = false;
      return;
    }
    focusKioskRoot();
    const show = () => revealExit();
    const holdFocus = () => {
      revealExit();
      focusKioskRoot();
    };
    window.addEventListener("pointermove", show);
    window.addEventListener("pointerdown", holdFocus);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.code === "Escape") {
        leaveKiosk();
        return;
      }
      const delta = kioskKeyDelta(event);
      if (!delta) return;
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      stepKiosk(delta);
      revealExit();
      focusKioskRoot();
    };
    const onFullscreen = () => {
      if (document.fullscreenElement) {
        sawFullscreen.current = true;
        focusKioskRoot();
        return;
      }
      if (sawFullscreen.current) leaveKiosk();
    };
    // Capture phase: remotes/TVs often leave focus on body or a leftover button.
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("pointermove", show);
      window.removeEventListener("pointerdown", holdFocus);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
  }, [kiosk, leaveKiosk, revealExit, stepKiosk, focusKioskRoot]);

  useEffect(() => {
    if (!data) return;
    if (!seenUnits.current) {
      seenUnits.current = data.units;
      return;
    }
    const events = milestonesBetween(seenUnits.current, data.units);
    seenUnits.current = data.units;
    if (events.length) {
      setToasts((current) => {
        const additions = events.map((event) => ({
          ...event,
          id: `${event.scope}-${event.unitId ?? "vault"}-${event.points}-${data.updatedAt}`,
        }));
        return [...additions, ...current].slice(0, 3);
      });
      void celebrate(events);
    }
  }, [data]);

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => {
      setToasts((current) => current.slice(0, -1));
    }, 5200);
    return () => window.clearTimeout(id);
  }, [toasts]);

  const goToScreen = useCallback((next: ScreenId) => {
    const time = Date.now();
    startedRef.current = time;
    viewRef.current = next;
    setStartedAt(time);
    setView(next);
  }, []);

  const stepHighlight = useCallback(
    (delta: 1 | -1) => {
      if (liveHighlights.length < 2) return;
      const currentId = parseHighlightScreen(viewRef.current);
      const index = liveHighlights.findIndex((entry) => entry.id === currentId);
      const from = index < 0 ? 0 : index;
      const next = liveHighlights[(from + delta + liveHighlights.length) % liveHighlights.length];
      if (!next) return;
      goToScreen(highlightScreenId(next.id));
    },
    [liveHighlights, goToScreen],
  );

  const openChangeScores = useCallback(() => {
    if (!token) {
      setPendingEdit(true);
      setPinOpen(true);
      return;
    }
    setHudOpen(false);
    goToScreen("edit");
  }, [token, goToScreen]);

  const chooseView = useCallback(
    (next: ScreenId) => {
      if (next === "news" && !shown.news && !deskBrowse) return;
      if (next === "edit") {
        openChangeScores();
        return;
      }
      if (next === "highlight") {
        if (!shown.highlight && !deskBrowse) return;
        // Tapping the Highlights tab again moves to the next live star.
        if (parseHighlightScreen(viewRef.current) && liveHighlights.length > 1) {
          stepHighlight(1);
          return;
        }
        const first = liveHighlights[0];
        next = first ? highlightScreenId(first.id) : "highlight";
      }
      if (parseHighlightScreen(next) && !shown.highlight && !deskBrowse) return;
      goToScreen(next);
    },
    [
      shown.news,
      shown.highlight,
      deskBrowse,
      liveHighlights,
      goToScreen,
      stepHighlight,
      openChangeScores,
    ],
  );

  // Arrow keys cycle highlights whenever a highlight page is open.
  useEffect(() => {
    if (kiosk) return;
    if (liveHighlights.length < 2) return;
    if (!parseHighlightScreen(view) && view !== "highlight") return;
    const onKey = (event: KeyboardEvent) => {
      const delta = kioskKeyDelta(event);
      if (!delta) return;
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      event.preventDefault();
      stepHighlight(delta);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kiosk, liveHighlights.length, view, stepHighlight]);

  const score = useCallback(
    (action: ActionId, unitId?: UnitId) => {
      if (!token) return;
      setDeskError(null);
      chain.current = chain.current
        .then(async () => {
          const response = await fetch("/api/score", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action, unitId }),
          });
          const body = (await response.json().catch(() => ({}))) as PublicBoard & {
            error?: string;
          };
          if (response.status === 401) {
            clearToken();
            setHudOpen(false);
            setPinOpen(true);
            setDeskError("The desk locked itself. Enter the PIN again.");
            return;
          }
          if (!response.ok) {
            setDeskError(body.error ?? "That tick did not land.");
            return;
          }
          const entry = body.log?.[0];
          if (action !== "reset" && action !== "undo" && action !== "adjust" && entry?.id) {
            setReasonPrompt({ id: entry.id, line: tickerLine(entry) ?? "Points saved" });
          } else {
            setReasonPrompt(null);
          }
          await mutate(body, { revalidate: false });
        })
        .catch(() => {
          setDeskError("The yard desk lost the tick. Tap it again.");
        });
    },
    [mutate, token],
  );

  const adjustPoints = useCallback(
    (unitId: UnitId, delta: 1 | -1) => {
      if (!token) {
        setPinOpen(true);
        return;
      }
      setDeskError(null);
      setEditBusyId(`adjust:${unitId}:${delta}`);
      chain.current = chain.current
        .then(async () => {
          const response = await fetch("/api/score", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "adjust", unitId, delta }),
          });
          const body = (await response.json().catch(() => ({}))) as PublicBoard & {
            error?: string;
          };
          if (response.status === 401) {
            clearToken();
            setHudOpen(false);
            setPinOpen(true);
            setDeskError("The desk locked itself. Enter the PIN again.");
            return;
          }
          if (!response.ok) {
            setDeskError(body.error ?? "That edit did not save.");
            return;
          }
          setReasonPrompt(null);
          await mutate(body, { revalidate: false });
        })
        .catch(() => {
          setDeskError("That edit did not save. Try again.");
        })
        .finally(() => {
          setEditBusyId(null);
        });
    },
    [mutate, token],
  );

  const removeFeedItem = useCallback(
    (item: TodayItem) => {
      if (!token) {
        setPinOpen(true);
        return;
      }
      setDeskError(null);
      setEditBusyId(item.id);
      chain.current = chain.current
        .then(async () => {
          if (item.kind === "highlight") {
            const highlightId = item.id.startsWith("highlight:")
              ? item.id.slice("highlight:".length)
              : item.id;
            const response = await fetch("/api/highlight", {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ id: highlightId }),
            });
            const body = (await response.json().catch(() => ({}))) as PublicBoard & {
              error?: string;
            };
            if (response.status === 401) {
              clearToken();
              setHudOpen(false);
              setPinOpen(true);
              setDeskError("The desk locked itself. Enter the PIN again.");
              return;
            }
            if (!response.ok) {
              setDeskError(body.error ?? "That highlight did not remove.");
              return;
            }
            await mutate(body, { revalidate: false });
            return;
          }

          const response = await fetch("/api/score", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ action: "undo", logId: item.id }),
          });
          const body = (await response.json().catch(() => ({}))) as PublicBoard & {
            error?: string;
          };
          if (response.status === 401) {
            clearToken();
            setHudOpen(false);
            setPinOpen(true);
            setDeskError("The desk locked itself. Enter the PIN again.");
            return;
          }
          if (!response.ok) {
            setDeskError(body.error ?? "Those points did not remove.");
            return;
          }
          setReasonPrompt(null);
          await mutate(body, { revalidate: false });
        })
        .catch(() => {
          setDeskError(
            item.kind === "highlight"
              ? "That highlight did not remove. Try again."
              : "Those points did not remove. Try again.",
          );
        })
        .finally(() => {
          setEditBusyId(null);
        });
    },
    [mutate, token],
  );

  const dutyName = staffName(staffFromToken(token));
  const progress =
    !kiosk || startedAt === 0
      ? 0
      : Math.max(0, Math.min(1, (now - startedAt) / (dwellForScreen(view, dwells) * 1000)));
  const live = error && !data ? "offline" : data ? "live" : "loading";
  const activeReveal = revealById(view);
  const activeHighlightId = parseHighlightScreen(view);
  const activeHighlight = activeHighlightId
    ? liveHighlights.find((entry) => entry.id === activeHighlightId) ?? null
    : null;

  const scoreOrUnlock = useCallback(
    (action: ActionId, unitId?: UnitId) => {
      if (!token) {
        setPinOpen(true);
        return;
      }
      score(action, unitId);
    },
    [score, token],
  );

  return (
    <div
      id="kiosk-root"
      tabIndex={kiosk ? 0 : -1}
      className="relative flex h-dvh flex-col overflow-hidden outline-none"
    >
      <div className="yard-grid pointer-events-none fixed inset-0" />
      {!kiosk && (
        <SiteHeader
          view={view}
          tabs={[
            ...VIEWS.flatMap((item) => {
              const tab = { id: item.id as ScreenId, label: item.label, short: item.short };
              if (item.id !== "board") return [tab];
              // Phone/desk: Latest Feed sits next to the board so duty teachers can check recent ticks.
              return [
                tab,
                {
                  id: "today" as const,
                  label: "Latest Feed",
                  short: "Feed",
                  open: deskBrowse,
                },
                {
                  id: "edit" as const,
                  label: "Change scores",
                  short: "Scores",
                  open: deskBrowse,
                },
              ];
            }),
            {
              id: "news" as const,
              label: "Daily News",
              short: "News",
              open: deskBrowse || shown.news,
            },
            {
              id: "highlight" as const,
              label: "Student Highlights",
              short: "Stars",
              open: deskBrowse || shown.highlight,
            },
            ...(cricketCode && shown["cricket-teams"]
              ? [{ id: "cricket-teams" as const, label: "Cricket 1", short: "Teams" }]
              : []),
            ...(cricketCode && shown.cricket
              ? [{ id: "cricket" as const, label: "Cricket 2", short: "Ladder" }]
              : []),
            ...REVEALS.filter((item) => shown[item.id] || view === item.id).map((item) => {
              const saved = prefs.reveals[item.id];
              const label = revealLabel(item, saved?.at, now || undefined, saved?.unlocked === true);
              return { id: item.id as ScreenId, label, short: label };
            }),
          ]}
          onView={chooseView}
          authed={Boolean(token)}
          dutyName={dutyName}
          news={data?.news ?? emptyNews()}
          board={data}
          onBoard={(board) => {
            void mutate(board, { revalidate: false });
          }}
          onLockClick={() => {
            if (token) setHudOpen(true);
            else setPinOpen(true);
          }}
          onChangeScores={openChangeScores}
          live={isLoading && !data ? "loading" : live}
          onStartKiosk={enterKiosk}
        />
      )}

      {kiosk && exitVisible && (
        <button
          type="button"
          aria-label="Exit kiosk"
          onClick={leaveKiosk}
          className="fixed top-4 left-1/2 z-50 grid size-12 -translate-x-1/2 place-items-center rounded-full bg-[#2a1c04] text-[#fff7ea] shadow-[0_4px_0_#6b5844]"
        >
          <X className="size-6" />
        </button>
      )}

      {kiosk ? (
        <>
          <button
            type="button"
            aria-label="Previous kiosk screen"
            className="fixed inset-y-0 left-0 z-40 w-[min(4.5rem,12%)] cursor-w-resize bg-transparent"
            onClick={() => {
              stepKiosk(-1);
              revealExit();
            }}
          />
          <button
            type="button"
            aria-label="Next kiosk screen"
            className="fixed inset-y-0 right-0 z-40 w-[min(4.5rem,12%)] cursor-e-resize bg-transparent"
            onClick={() => {
              stepKiosk(1);
              revealExit();
            }}
          />
        </>
      ) : null}

      {kiosk ? <ScreenTimer progress={progress} epoch={startedAt} /> : null}

      <div className="pointer-events-none fixed top-28 right-3 left-3 z-40 flex flex-col items-center gap-2 sm:top-24">
        {toasts.map((toast) => {
          const unit = toast.unitId ? unitById(toast.unitId) : null;
          const tone = unit?.color ?? "#e2a01a";
          const reveal = revealForPoints(toast.points);
          const saved = reveal ? prefs.reveals[reveal.id] : null;
          const named = prizeIsPublic(saved?.at, now || undefined, saved?.unlocked === true);
          return (
            <div
              key={toast.id}
              className="pointer-events-auto w-full max-w-md rounded-2xl border-2 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(90,60,20,0.18)]"
              style={{ borderColor: tone }}
              role="status"
            >
              <p className="text-[11px] font-extrabold tracking-[0.16em] uppercase" style={{ color: tone }}>
                {unit ? unit.code : "School"} unlocked
              </p>
              <p className="font-display text-xl leading-tight">{named ? toast.title : "Secret prize"}</p>
              {named ? <p className="text-sm text-muted-foreground">{toast.detail}</p> : null}
            </div>
          );
        })}
      </div>

      <div className={cn("flex min-h-0 flex-1", kiosk ? "flex-row" : "flex-col lg:flex-row")}>
      <main
        className={cn(
          "relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col px-2 py-1 sm:px-3 sm:py-1.5 lg:px-5 lg:py-3",
          view === "prizes" || view === "yard" || Boolean(activeReveal)
            ? "overflow-y-auto lg:overflow-hidden"
            : "overflow-hidden",
          (view === "prizes" ||
            view === "board" ||
            view === "today" ||
            view === "edit" ||
            view === "cricket" ||
            view === "cricket-teams" ||
            view === "news" ||
            Boolean(activeHighlightId)) &&
            "max-w-none",
          kiosk && (prefs.timer === "blocks" ? "pt-16 pb-16" : "pt-16 pb-28"),
        )}
      >
        {error && !data && (
          <section className="rounded-[28px] border border-[#c23b3b]/30 bg-card px-5 py-8 text-center">
            <h2 className="font-display text-3xl">The board is out of reach</h2>
            <p className="mt-2 text-muted-foreground">
              The TV will keep trying every few seconds. You can nudge it now.
            </p>
            <Button className="mt-4 h-11 rounded-xl px-4" onClick={() => void mutate()}>
              Try again
            </Button>
          </section>
        )}

        {data?.storage === "memory" ? (
          <section
            className="mb-2 rounded-2xl border-2 border-[#c23b3b]/40 bg-[#c23b3b]/10 px-4 py-3 text-sm font-bold text-[#8d1f1f]"
            role="status"
          >
            Scores are not sticking on this host. Connect Blob or Upstash Redis in the Vercel
            project (Storage), then redeploy — otherwise every tick vanishes when the server
            restarts.
          </section>
        ) : null}

        {!data && !error && <BoardSkeleton />}

        {data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              className={cn(
                "relative min-h-0",
                (view === "board" ||
                  view === "today" ||
                  view === "edit" ||
                  view === "cricket" ||
                  view === "cricket-teams" ||
                  view === "news" ||
                  Boolean(activeHighlightId) ||
                  Boolean(activeReveal)) &&
                  "h-full",
                (Boolean(activeHighlightId) || Boolean(activeReveal)) && "overflow-hidden",
              )}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "today" ? (
                <TodayColumn board={data} live={live} variant="page" />
              ) : view === "edit" && deskTeacher ? (
                <EditPointsView
                  board={data}
                  busyId={editBusyId}
                  error={deskError}
                  onAdjust={adjustPoints}
                  onRemoveFeedItem={removeFeedItem}
                />
              ) : view === "cricket-teams" ? (
                <CricketTeamsView
                  code={cricketCode}
                  rosters={data.cricketRosters ?? prefs.cricketRosters}
                  fill
                />
              ) : view === "cricket" ? (
                <CricketView code={cricketCode} fill panels={prefs.cricketPanels} />
              ) : view === "news" ? (
                <NewsView news={data.news ?? emptyNews()} layout={prefs.newsLayout} />
              ) : activeHighlight ? (
                // Absolute fill — percentage height alone still let portraits grow past the TV.
                <div className="absolute inset-0 min-h-0 overflow-hidden">
                  <HighlightView
                    entry={activeHighlight}
                    index={Math.max(
                      0,
                      liveHighlights.findIndex((entry) => entry.id === activeHighlight.id),
                    )}
                    total={liveHighlights.length}
                    onPrev={liveHighlights.length > 1 ? () => stepHighlight(-1) : undefined}
                    onNext={liveHighlights.length > 1 ? () => stepHighlight(1) : undefined}
                    canRemove={Boolean(token) && !kiosk}
                    removing={removingHighlight}
                    onRemove={() => {
                      if (!token || removingHighlight) return;
                      setRemovingHighlight(true);
                      setDeskError(null);
                      void fetch("/api/highlight", {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ id: activeHighlight.id }),
                      })
                        .then(async (response) => {
                          const body = (await response.json().catch(() => ({}))) as PublicBoard & {
                            error?: string;
                          };
                          if (response.status === 401) {
                            clearToken();
                            setPinOpen(true);
                            setDeskError("The desk locked itself. Enter the PIN again.");
                            return;
                          }
                          if (!response.ok) {
                            setDeskError(body.error ?? "That highlight did not remove.");
                            return;
                          }
                          await mutate(body, { revalidate: false });
                          const remaining = activeHighlights(body.highlights ?? []).filter(
                            (entry) => entry.id !== activeHighlight.id,
                          );
                          if (remaining[0]) goToScreen(highlightScreenId(remaining[0].id));
                          else goToScreen("board");
                        })
                        .catch(() => {
                          setDeskError("That highlight did not remove. Try again.");
                        })
                        .finally(() => {
                          setRemovingHighlight(false);
                        });
                    }}
                  />
                </div>
              ) : (
                // TV kiosk scales to fit the screen; the teacher desk keeps natural layout
                // so boards fill the space beside Latest Feed (no fixed stage / scale).
                <DeskFit kiosk={kiosk}>
                  {view === "board" ? (
                    <LeaderboardView
                      board={data}
                      error={deskError}
                      onScore={scoreOrUnlock}
                      showScores={!kiosk}
                      teacherMode={deskTeacher}
                      canUndo={Boolean(
                        data.log?.length &&
                          data.log[0] &&
                          data.log[0].action !== "reset" &&
                          data.log[0].action !== "undo",
                      )}
                      onHighlight={(unitId) => setHighlightUnit(unitId)}
                      onUndo={deskTeacher ? () => scoreOrUnlock("undo") : undefined}
                      onChangeScores={deskTeacher ? openChangeScores : undefined}
                      reasonSlot={
                        reasonPrompt && token ? (
                          <ReasonPrompt
                            key={reasonPrompt.id}
                            id={reasonPrompt.id}
                            line={reasonPrompt.line}
                            placement="inline"
                            onDismiss={() => setReasonPrompt(null)}
                            onSave={async (reason) => {
                              const response = await fetch("/api/score/reason", {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ id: reasonPrompt.id, reason }),
                              });
                              const body = (await response.json().catch(() => ({}))) as PublicBoard & {
                                error?: string;
                              };
                              if (response.status === 401) {
                                clearToken();
                                setReasonPrompt(null);
                                setPinOpen(true);
                                return "The desk locked itself. Enter the PIN again.";
                              }
                              if (!response.ok) return body.error ?? "The reason did not save.";
                              await mutate(body, { revalidate: false });
                              setReasonPrompt(null);
                              return null;
                            }}
                          />
                        ) : null
                      }
                    />
                  ) : null}
                  {view === "prizes" && <PrizesView board={data} />}
                  {view === "yard" && <YardRulesView />}
                  {view === "highlight" && !activeHighlight ? (
                    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 rounded-[32px] border-4 border-[#5a3208] bg-[radial-gradient(circle_at_center,#ffe08a_0%,#f5b942_42%,#8a3b12_100%)] p-6 text-center">
                      <p className="text-[11px] font-extrabold tracking-[0.28em] text-[#5a3208] uppercase">
                        Student Highlights
                      </p>
                      <h2 className="font-display text-4xl text-[#2a1c04] sm:text-5xl">Waiting for stars</h2>
                      <p className="max-w-md text-base font-bold text-[#5a3208]">
                        No student highlights are live right now. Teachers can add one from the yard desk.
                      </p>
                    </div>
                  ) : null}
                  {activeReveal && (
                    <RevealView
                      reveal={activeReveal}
                      // Prefer school-wide board reveals so laptop kiosk matches the desk that saved them.
                      revealAt={
                        data.reveals?.[activeReveal.id]?.at ?? prefs.reveals[activeReveal.id].at
                      }
                      prize={
                        data.reveals?.[activeReveal.id]?.prize ?? prefs.reveals[activeReveal.id].prize
                      }
                      image={
                        data.reveals?.[activeReveal.id]?.image ?? prefs.reveals[activeReveal.id].image
                      }
                      label={
                        data.reveals?.[activeReveal.id]?.label ?? prefs.reveals[activeReveal.id].label
                      }
                    />
                  )}
                </DeskFit>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        <p className="sr-only" aria-live="polite">
          {data?.lastAction ? actionLabel(data.lastAction) : "Waiting for the first tick."}
        </p>
      </main>
      {view === "board" ? (
        <TodayColumn board={data} live={live} variant={kiosk ? "kiosk" : "board"} />
      ) : null}
      </div>

      <PinDialog
        open={pinOpen}
        onOpenChange={(next) => {
          setPinOpen(next);
          if (!next) setPendingEdit(false);
        }}
        onSuccess={(next, expiresAt) => {
          saveToken(next, expiresAt);
          setPinOpen(false);
          setDeskError(null);
          if (pendingEdit) {
            setPendingEdit(false);
            goToScreen("edit");
            return;
          }
          setView("board");
        }}
      />
      <StaffHud
        open={hudOpen}
        onOpenChange={setHudOpen}
        board={data}
        dutyName={dutyName}
        token={token}
        error={deskError}
        onScore={score}
        onHighlight={(unitId) => {
          setHudOpen(false);
          setHighlightUnit(unitId);
        }}
        onChangeScores={openChangeScores}
        onBoard={(board) => {
          void mutate(board, { revalidate: false });
        }}
        onLogout={() => {
          clearToken();
          setHudOpen(false);
        }}
      />
      {token ? (
        <HighlightDialog
          open={highlightUnit !== null}
          onOpenChange={(next) => {
            if (!next) setHighlightUnit(null);
          }}
          token={token}
          initialUnitId={highlightUnit}
          onSaved={(board) => {
            void mutate(board, { revalidate: false });
            setHighlightUnit(null);
            const newest = board.highlights?.[0];
            if (newest) goToScreen(highlightScreenId(newest.id));
          }}
        />
      ) : null}
    </div>
  );
}

async function celebrate(events: MilestoneEvent[]) {
  const { default: confetti } = await import("canvas-confetti");
  for (const event of events) {
    const unit = event.unitId ? unitById(event.unitId) : null;
    const colors = unit
      ? [unit.color, "#ffe08a", "#fff7e8"]
      : ["#ffe08a", "#ff5d8f", "#8b7cf7", "#ffffff"];
    const jackpot = event.secret || event.points === 80;
    void confetti({
      particleCount: jackpot ? 140 : 70,
      spread: jackpot ? 100 : 65,
      startVelocity: jackpot ? 48 : 32,
      origin: { y: 0.32 },
      colors,
      disableForReducedMotion: true,
    });
    if (jackpot) {
      void confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      void confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
    }
  }
}

function DeskFit({ kiosk, children }: { kiosk: boolean; children: ReactNode }) {
  if (!kiosk) {
    return <div className="box-border h-full min-h-0 overflow-hidden p-2 lg:p-3">{children}</div>;
  }
  return <TvFit>{children}</TvFit>;
}

function TvFit({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frameEl = frame.current;
    const innerEl = inner.current;
    if (!frameEl || !innerEl) return;
    const fit = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      if (!wide) {
        setScale(1);
        return;
      }
      // Keep a small safe band so MacBook → TV / overscan does not clip words.
      const inset = 20;
      const availableH = Math.max(0, frameEl.clientHeight - inset * 2);
      const availableW = Math.max(0, frameEl.clientWidth - inset * 2);
      const neededH = innerEl.scrollHeight;
      const neededW = innerEl.scrollWidth;
      if (availableH > 0 && neededH > 0 && availableW > 0 && neededW > 0) {
        const next = Math.min(1, availableH / neededH, availableW / neededW);
        setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next));
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frameEl);
    observer.observe(innerEl);
    window.addEventListener("resize", fit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
    };
    // ResizeObserver watches layout; do not re-bind when React children identity changes
    // (e.g. the Daily News clock ticking every second).
  }, []);

  return (
    <div ref={frame} className="box-border h-full min-h-0 overflow-hidden p-2 lg:p-3">
      <div
        ref={inner}
        className="h-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
      >
        {children}
      </div>
    </div>
  );
}

const RUNNERS = [
  { id: "runner", frames: 8, height: "3.7rem" },
  { id: "girl", frames: 8, height: "4.8rem" },
  { id: "staff", frames: 7, height: "4.8rem" },
  { id: "kid1", frames: 7, height: "3.15rem" },
  { id: "kid2", frames: 8, height: "3.4rem" },
  { id: "kid3", frames: 8, height: "3.55rem" },
  { id: "kid4", frames: 8, height: "3.25rem" },
] as const;

function pickRace() {
  const pool = RUNNERS.map((_, index) => index);
  const first = pool.splice(Math.floor(Math.random() * pool.length), 1)[0] ?? 0;
  const second = pool[Math.floor(Math.random() * pool.length)] ?? 1;
  return {
    runners: [first, second] as const,
    changes: Math.floor(Math.random() * 4),
    startWithFirst: Math.random() < 0.5,
  };
}

function raceSpots(progress: number, changes: number, startWithFirst: boolean) {
  const t = Math.min(1, Math.max(0, progress) / 0.86);
  const amplitude = 0.16;
  const wave = Math.cos(Math.PI * changes * t) * (startWithFirst ? 1 : -1);
  const average = t * (1 - amplitude / 2);
  const spots = [average + (wave * amplitude) / 2, average - (wave * amplitude) / 2].map((spot) =>
    Math.max(0, Math.min(1, spot)),
  ) as [number, number];
  return {
    spots,
    ahead: spots[0] >= spots[1] ? 0 : 1,
    finished: t >= 1,
  };
}

const BLOCK_COLORS = ["#f5b942", "#ff7a59", "#2ec9a0", "#5ec8ff", "#8b7cf7", "#ff7ab2"];

function ColourBlocks({ progress }: { progress: number }) {
  const segments = 16;
  const lit = Math.round(Math.max(0, Math.min(1, progress)) * segments);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-3" aria-hidden="true">
      <div className="flex h-7 gap-1.5 rounded-full border-[3px] border-[#2a1c04] bg-[#fff6e4] p-1.5 shadow-[0_5px_0_#6b5844,0_0_24px_rgba(255,122,89,0.45)]">
        {Array.from({ length: segments }, (_, index) => {
          const on = index < lit;
          const color = BLOCK_COLORS[index % BLOCK_COLORS.length] ?? "#f5b942";
          const tip = on && index === lit - 1;
          return (
            <span
              key={index}
              className="h-full min-w-0 flex-1 rounded-md"
              style={{
                background: on ? color : "rgba(42,28,4,0.1)",
                boxShadow: tip ? `0 0 12px ${color}` : undefined,
                transform: tip ? "scaleY(1.25)" : undefined,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function ScreenTimer({ progress, epoch }: { progress: number; epoch: number }) {
  const timer = useDeskPrefs().timer;
  const [frame, setFrame] = useState(0);
  const [race, setRace] = useState(pickRace);
  const epochRef = useRef(epoch);

  useEffect(() => {
    const id = window.setInterval(() => setFrame((current) => current + 1), 90);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (epochRef.current === epoch) return;
    const previous = epochRef.current;
    epochRef.current = epoch;
    if (previous === 0) return;
    setRace(pickRace());
  }, [epoch]);

  const { spots, ahead, finished } = raceSpots(progress, race.changes, race.startWithFirst);

  if (timer === "blocks") return <ColourBlocks progress={progress} />;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-28"
      aria-hidden="true"
      data-changes={race.changes}
      data-runners={race.runners.map((index) => RUNNERS[index]?.id).join(" ")}
      data-ahead={RUNNERS[race.runners[ahead]]?.id}
    >
      {spots.map((spot, index) => {
        const runner = RUNNERS[race.runners[index]];
        if (!runner) return null;
        return (
          <img
            key={runner.id}
            src={`/race/${runner.id}-${frame % runner.frames}.png`}
            alt=""
            className="absolute w-auto"
            style={{
              height: runner.height,
              bottom: index === 0 ? "1.35rem" : "0.55rem",
              left: `calc(${spot} * (100% - 6.5rem))`,
              zIndex: spot >= spots[1 - index] ? 2 : 1,
              filter: "drop-shadow(0 2px 0 rgba(42,28,4,0.28))",
              transform: finished && index === ahead ? "scale(1.06)" : undefined,
              transformOrigin: "bottom center",
            }}
          />
        );
      })}
      {finished ? (
        <span
          className="absolute bottom-[6.3rem] z-10 -translate-x-1/2 rounded-full bg-[#f5b942] px-3 py-0.5 font-display text-lg leading-none text-[#2a1c04] shadow-[0_3px_0_#a86a12]"
          style={{ left: `calc(${spots[ahead]} * (100% - 6.5rem) + 2.2rem)` }}
        >
          Win!
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 h-8 border-t-4 border-[#2a1c04] bg-[#e7c98a] shadow-[inset_0_4px_0_#c49a45]">
        <div className="absolute top-1/2 right-16 left-3 -translate-y-1/2 border-t-[3px] border-dashed border-white" />
        <div
          className="absolute right-4 bottom-8 h-14 w-4"
          style={{
            backgroundImage:
              "linear-gradient(45deg, #1a1208 25%, #fffdf8 25%, #fffdf8 50%, #1a1208 50%, #1a1208 75%, #fffdf8 75%)",
            backgroundSize: "8px 8px",
          }}
        />
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <p className="sr-only">Loading the yard board.</p>
      <div className="h-40 animate-pulse rounded-[28px] bg-card" aria-hidden="true" />
      <div className="grid gap-4 xl:grid-cols-3" aria-hidden="true">
        {UNIT_IDS.map((id) => (
          <div key={id} className="h-80 animate-pulse rounded-[28px] bg-card" />
        ))}
      </div>
    </div>
  );
}
