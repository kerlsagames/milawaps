"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import { LeaderboardView } from "@/components/leaderboard-view";
import { MapView } from "@/components/map-view";
import { PinDialog } from "@/components/pin-dialog";
import { PrizesView } from "@/components/prizes-view";
import { RulesView } from "@/components/rules-view";
import { SiteHeader } from "@/components/site-header";
import { StaffHud } from "@/components/staff-hud";
import { Button } from "@/components/ui/button";
import { playAction, playChime, playError, playFanfare } from "@/lib/audio";
import { clearToken, saveToken, setKioskPref, setMutedPref, useDeskPrefs } from "@/lib/desk-prefs";
import {
  UNIT_IDS,
  VIEWS,
  actionLabel,
  unitById,
  type ActionId,
  type MilestoneEvent,
  type PublicBoard,
  type UnitId,
  type ViewId,
} from "@/lib/game";
import { milestonesBetween } from "@/lib/scoring";

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
  const { kiosk, muted, token } = prefs;
  const [view, setView] = useState<ViewId>("board");
  const [pausedUntil, setPausedUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [pinOpen, setPinOpen] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [deskError, setDeskError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const startedRef = useRef(0);
  const viewRef = useRef<ViewId>("board");
  const pausedRef = useRef(0);
  const seenUnits = useRef<Record<UnitId, number> | null>(null);
  const seenAction = useRef<number | null>(null);
  const selfStamp = useRef<number | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    pausedRef.current = pausedUntil;
  }, [pausedUntil]);

  useEffect(() => {
    if (!kiosk) return;
    const pause = () => setPausedUntil(Date.now() + 30_000);
    window.addEventListener("pointerdown", pause);
    return () => window.removeEventListener("pointerdown", pause);
  }, [kiosk]);

  useEffect(() => {
    if (!kiosk) return;
    let holding = false;
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (startedRef.current === 0) {
        startedRef.current = time;
        setStartedAt(time);
        return;
      }
      if (time < pausedRef.current) {
        startedRef.current = time;
        holding = true;
        return;
      }
      if (holding) {
        holding = false;
        startedRef.current = time;
        setStartedAt(time);
        return;
      }
      const slide = VIEWS.find((item) => item.id === viewRef.current) ?? VIEWS[0];
      if (time - startedRef.current >= slide.ms) {
        const index = VIEWS.findIndex((item) => item.id === viewRef.current);
        const next = VIEWS[(index + 1) % VIEWS.length];
        startedRef.current = time;
        setStartedAt(time);
        setView(next.id);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [kiosk]);

  useEffect(() => {
    if (!data) return;
    if (!seenUnits.current) {
      seenUnits.current = data.units;
      seenAction.current = data.lastAction?.at ?? null;
      return;
    }
    const events = milestonesBetween(seenUnits.current, data.units);
    seenUnits.current = data.units;
    const actionAt = data.lastAction?.at ?? null;
    const actionChanged = actionAt !== null && actionAt !== seenAction.current;
    if (actionAt !== null) seenAction.current = actionAt;
    if (events.length) {
      setToasts((current) => {
        const additions = events.map((event) => ({
          ...event,
          id: `${event.scope}-${event.unitId ?? "vault"}-${event.points}-${data.updatedAt}`,
        }));
        return [...additions, ...current].slice(0, 3);
      });
      void celebrate(events);
      playFanfare(events.some((event) => event.scope === "vault" && event.points === 130));
    } else if (actionChanged && actionAt !== selfStamp.current) {
      playChime();
    }
  }, [data]);

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => {
      setToasts((current) => current.slice(0, -1));
    }, 5200);
    return () => window.clearTimeout(id);
  }, [toasts]);

  const chooseView = useCallback((next: ViewId) => {
    const time = Date.now();
    startedRef.current = time;
    setStartedAt(time);
    setView(next);
  }, []);

  const toggleKiosk = useCallback(() => {
    if (kiosk) {
      setKioskPref(false);
      return;
    }
    const time = Date.now();
    startedRef.current = time;
    setStartedAt(time);
    setNow(time);
    setPausedUntil(time + 30_000);
    setKioskPref(true);
  }, [kiosk]);

  const score = useCallback(
    (action: ActionId, unitId?: UnitId) => {
      if (!token) return;
      playAction(action);
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
            playError();
            return;
          }
          if (!response.ok) {
            setDeskError(body.error ?? "That tick did not land.");
            playError();
            return;
          }
          if (body.lastAction?.at) selfStamp.current = body.lastAction.at;
          await mutate(body, { revalidate: false });
        })
        .catch(() => {
          setDeskError("The yard desk lost the tick. Tap it again.");
        });
    },
    [mutate, token],
  );

  const slide = VIEWS.find((item) => item.id === view) ?? VIEWS[0];
  const paused = kiosk && now < pausedUntil;
  const progress =
    !kiosk || paused || startedAt === 0
      ? 0
      : Math.max(0, Math.min(1, (now - startedAt) / slide.ms));
  const pausedSeconds = paused ? Math.max(1, Math.ceil((pausedUntil - now) / 1000)) : 0;
  const live = error && !data ? "offline" : data ? "live" : "loading";

  return (
    <div className="relative min-h-dvh">
      <div className="yard-grid pointer-events-none fixed inset-0" />
      <SiteHeader
        view={view}
        onView={chooseView}
        kiosk={kiosk}
        onToggleKiosk={toggleKiosk}
        pausedSeconds={pausedSeconds}
        progress={progress}
        authed={Boolean(token)}
        onLockClick={() => {
          if (token) setHudOpen(true);
          else setPinOpen(true);
        }}
        muted={muted}
        onToggleMute={() => setMutedPref(!muted)}
        live={isLoading && !data ? "loading" : live}
      />

      {data && data.vault >= 130 && (
        <div className="barber-stripe px-4 py-2 text-center text-sm font-extrabold tracking-wide text-[#1a1020]">
          Jackpot open · The Principal Haircut & Wild Style
        </div>
      )}

      <div className="pointer-events-none fixed top-28 right-3 left-3 z-40 flex flex-col items-center gap-2 sm:top-24">
        {toasts.map((toast) => {
          const tone = toast.unitId ? unitById(toast.unitId).color : "#ffe08a";
          return (
            <div
              key={toast.id}
              className="pointer-events-auto w-full max-w-md rounded-2xl border bg-[#171e34]/95 px-4 py-3 shadow-2xl"
              style={{ borderColor: tone }}
              role="status"
            >
              <p className="text-[11px] font-extrabold tracking-[0.16em] uppercase" style={{ color: tone }}>
                {toast.scope === "vault" ? "Master Vault" : unitById(toast.unitId as UnitId).code} unlocked
              </p>
              <p className="font-display text-xl leading-tight">{toast.title}</p>
              <p className="text-sm text-muted-foreground">{toast.detail}</p>
            </div>
          );
        })}
      </div>

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:px-5 sm:py-6">
        {error && !data && (
          <section className="rounded-[28px] border border-[#ff8b8b]/40 bg-card px-5 py-8 text-center">
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
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {view === "board" && <LeaderboardView board={data} />}
              {view === "prizes" && <PrizesView board={data} />}
              {view === "map" && <MapView board={data} />}
              {view === "rules" && <RulesView />}
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
          setHudOpen(true);
          setDeskError(null);
        }}
      />
      <StaffHud
        open={hudOpen}
        onOpenChange={setHudOpen}
        board={data}
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
    const jackpot = event.scope === "vault" && event.points === 130;
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
