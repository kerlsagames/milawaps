"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { LeaderboardView } from "@/components/leaderboard-view";
import { YardRulesView } from "@/components/yard-rules-view";
import { PinDialog } from "@/components/pin-dialog";
import { PrizesView } from "@/components/prizes-view";
import { RevealView } from "@/components/reveal-view";
import { SiteHeader } from "@/components/site-header";
import { StaffHud } from "@/components/staff-hud";
import { Button } from "@/components/ui/button";
import { clearToken, saveToken, setKioskPref, useDeskPrefs } from "@/lib/desk-prefs";
import { kioskScreens, prizeIsPublic, revealById, revealForPoints, REVEALS, type ScreenId } from "@/lib/reveals";
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
  const { kiosk, token, dwells, shown } = prefs;
  const dwellsRef = useRef(dwells);
  dwellsRef.current = dwells;
  const playlist = kioskScreens(shown);
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const [view, setView] = useState<ScreenId>("board");
  const [now, setNow] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [exitVisible, setExitVisible] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [deskError, setDeskError] = useState<string | null>(null);
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

  const enterKiosk = useCallback(() => {
    const time = Date.now();
    startedRef.current = time;
    setStartedAt(time);
    setNow(time);
    setKioskPref(true);
    void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

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
      const dwellMs = (dwellsRef.current[viewRef.current] ?? 12) * 1000;
      if (time - startedRef.current >= dwellMs) {
        const screens = playlistRef.current;
        const index = screens.indexOf(viewRef.current);
        const next = screens[(index + 1) % screens.length];
        startedRef.current = time;
        setStartedAt(time);
        setView(next);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [kiosk]);

  useEffect(() => {
    if (!kiosk) {
      sawFullscreen.current = false;
      return;
    }
    const show = () => revealExit();
    window.addEventListener("pointermove", show);
    window.addEventListener("pointerdown", show);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") leaveKiosk();
    };
    const onFullscreen = () => {
      if (document.fullscreenElement) {
        sawFullscreen.current = true;
        return;
      }
      if (sawFullscreen.current) leaveKiosk();
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => {
      window.removeEventListener("pointermove", show);
      window.removeEventListener("pointerdown", show);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFullscreen);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
    };
  }, [kiosk, leaveKiosk, revealExit]);

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

  const chooseView = useCallback((next: ScreenId) => {
    const time = Date.now();
    startedRef.current = time;
    setStartedAt(time);
    setView(next);
  }, []);

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
          await mutate(body, { revalidate: false });
        })
        .catch(() => {
          setDeskError("The yard desk lost the tick. Tap it again.");
        });
    },
    [mutate, token],
  );

  const dutyName = staffName(staffFromToken(token));
  const progress =
    !kiosk || startedAt === 0
      ? 0
      : Math.max(0, Math.min(1, (now - startedAt) / ((dwells[view] ?? 12) * 1000)));
  const live = error && !data ? "offline" : data ? "live" : "loading";
  const activeReveal = revealById(view);

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
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <div className="yard-grid pointer-events-none fixed inset-0" />
      {!kiosk && (
        <SiteHeader
          view={view}
          tabs={[
            ...VIEWS.map((item) => ({ id: item.id, label: item.label, short: item.short })),
            ...REVEALS.filter((item) => shown[item.id] || view === item.id).map((item) => ({
              id: item.id,
              label: item.title,
              short: `#${item.n}`,
            })),
          ]}
          onView={chooseView}
          authed={Boolean(token)}
          dutyName={dutyName}
          onLockClick={() => {
            if (token) setHudOpen(true);
            else setPinOpen(true);
          }}
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

      {kiosk && <KioskStatus live={live} />}

      {kiosk && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-1 bg-black/10">
          <div
            className="h-full bg-[#e2a01a] transition-[width] duration-200 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      <div className="pointer-events-none fixed top-28 right-3 left-3 z-40 flex flex-col items-center gap-2 sm:top-24">
        {toasts.map((toast) => {
          const unit = toast.unitId ? unitById(toast.unitId) : null;
          const tone = unit?.color ?? "#e2a01a";
          const reveal = revealForPoints(toast.points);
          const named = prizeIsPublic(reveal ? prefs.reveals[reveal.id]?.at : null);
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

      <main
        className={cn(
          "relative mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-y-auto px-3 py-2 lg:overflow-hidden lg:px-4",
          view === "prizes" && "max-w-none",
          kiosk && "pt-16",
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

        {!data && !error && <BoardSkeleton />}

        {data && (
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              className="min-h-0 lg:h-full"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <TvFit>
                {view === "board" && (
                  <LeaderboardView board={data} error={deskError} onScore={scoreOrUnlock} />
                )}
                {view === "prizes" && <PrizesView board={data} />}
                {view === "yard" && <YardRulesView />}
                {activeReveal && (
                  <RevealView
                    reveal={activeReveal}
                    revealAt={prefs.reveals[activeReveal.id].at}
                    prize={prefs.reveals[activeReveal.id].prize}
                  />
                )}
              </TvFit>
            </motion.div>
          </AnimatePresence>
        )}

        <p className="sr-only" aria-live="polite">
          {data?.lastAction ? actionLabel(data.lastAction) : "Waiting for the first tick."}
        </p>
      </main>

      <PinDialog
        open={pinOpen}
        onOpenChange={setPinOpen}
        onSuccess={(next, expiresAt) => {
          saveToken(next, expiresAt);
          setPinOpen(false);
          setView("board");
          setDeskError(null);
        }}
      />
      <StaffHud
        open={hudOpen}
        onOpenChange={setHudOpen}
        board={data}
        dutyName={dutyName}
        error={deskError}
        onScore={score}
        onLogout={() => {
          clearToken();
          setHudOpen(false);
        }}
      />
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
    const jackpot = event.secret || event.points === 50;
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
      const available = frameEl.clientHeight;
      const needed = innerEl.scrollHeight;
      if (available > 0 && needed > 0) setScale(Math.min(1, available / needed));
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
  }, [children]);

  return (
    <div ref={frame} className="min-h-0 lg:h-full lg:overflow-hidden">
      <div
        ref={inner}
        className="lg:h-full"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  );
}

function KioskStatus({ live }: { live: "loading" | "live" | "offline" }) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat("en-AU", {
          weekday: "short",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date()),
      );
    };
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-1.5 text-xs font-bold shadow-[0_4px_0_rgba(42,28,4,0.12)]">
      <span
        className={cn(
          "size-2 rounded-full",
          live === "live" && "bg-[#2ec9a0] shadow-[0_0_8px_#2ec9a0]",
          live === "loading" && "bg-gold",
          live === "offline" && "bg-[#ff8b8b]",
        )}
      />
      {live === "live" ? "Live" : live === "loading" ? "Linking" : "Offline"}
      <span className="text-muted-foreground">{clock}</span>
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
