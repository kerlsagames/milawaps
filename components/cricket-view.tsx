"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  cricketMatchTitle,
  filterCricketLeaders,
  fixtureIsFinished,
  formatLadderPercentage,
  type CricketFixture,
  type CricketLeader,
  type CricketLeaders,
  type CricketSnapshot,
} from "@/lib/cricket";
import {
  cricketStatsScopeLabel,
  DEFAULT_CRICKET_PANELS,
  type CricketPanels,
  type CricketStatsScope,
} from "@/lib/site-display";
import { STUDENTS } from "@/lib/students";
import { cn } from "@/lib/utils";

function fixtureMeta(when: string, ground: string) {
  if (!ground) return when;
  if (when.toLowerCase().includes(ground.toLowerCase())) return when;
  return [when, ground].filter(Boolean).join(" · ");
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = (await response.json().catch(() => ({}))) as CricketSnapshot & { error?: string };
  if (!response.ok) throw new Error(body.error || "The cricket board is out of reach.");
  return body;
};

const LEADER_BOXES: { key: keyof CricketLeaders; title: string; tone: string }[] = [
  { key: "runs", title: "Most runs", tone: "#2ec9a0" },
  { key: "wickets", title: "Most wickets", tone: "#ff7a59" },
  { key: "catches", title: "Most catches", tone: "#5ec8ff" },
  { key: "highest", title: "Highest score", tone: "#e2a01a" },
  { key: "runOuts", title: "Most run outs", tone: "#c48a16" },
];

const ROTATE_SCOPES = ["all", "56", "234", "f1"] as const;

export function CricketView({
  code,
  fill = false,
  panels = DEFAULT_CRICKET_PANELS,
  statsScope = "all",
  statsRotateSec = 10,
}: {
  code: string;
  fill?: boolean;
  panels?: CricketPanels;
  statsScope?: CricketStatsScope;
  statsRotateSec?: number;
}) {
  const show = { ...DEFAULT_CRICKET_PANELS, ...panels };
  const { data, error, isLoading } = useSWR<CricketSnapshot>(
    code ? `/api/cricket?code=${encodeURIComponent(code)}` : null,
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: true },
  );
  const [rotateIndex, setRotateIndex] = useState(0);

  useEffect(() => {
    if (statsScope !== "rotate") return;
    const ms = Math.max(5, statsRotateSec) * 1000;
    const timer = window.setInterval(() => {
      setRotateIndex((index) => (index + 1) % ROTATE_SCOPES.length);
    }, ms);
    return () => window.clearInterval(timer);
  }, [statsScope, statsRotateSec]);

  const activeScope = statsScope === "rotate" ? ROTATE_SCOPES[rotateIndex]! : statsScope;
  const leaders = useMemo(() => {
    if (!data) return null;
    return filterCricketLeaders(data.leaders, activeScope, STUDENTS);
  }, [data, activeScope]);

  if (!code) {
    return (
      <section className="rounded-[28px] border border-[#e2a01a]/40 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket</h2>
        <p className="mt-2 text-lg font-bold text-muted-foreground">
          Add the code from Jimmy’s cricket in Settings.
        </p>
      </section>
    );
  }

  if (isLoading && !data) {
    return (
      <section className="rounded-[28px] border border-[#e2a01a]/40 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket</h2>
        <p className="mt-2 text-lg font-bold text-muted-foreground">Fetching the ladder and the draw.</p>
      </section>
    );
  }

  if (error || !data || !leaders) {
    return (
      <section className="rounded-[28px] border border-[#c23b3b]/30 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket</h2>
        <p className="mt-2 text-lg font-bold text-[#8d1f1f]">
          {error instanceof Error ? error.message : "The cricket board is out of reach."}
        </p>
      </section>
    );
  }

  // Keep the draw tight so the whole board fits without scroll.
  // Skip unfinished fixtures that sit before the last finished result (stuck "Under way").
  let lastFinishedIndex = -1;
  data.draw.forEach((game, index) => {
    if (fixtureIsFinished(game.result)) lastFinishedIndex = index;
  });
  const afterLast = data.draw.filter(
    (game, index) => index > lastFinishedIndex && !fixtureIsFinished(game.result),
  );
  const upcomingClean = afterLast.filter((game) => {
    const result = game.result.replace(/\s+/g, " ").trim().toLowerCase();
    return result !== "under way" && result !== "underway";
  });
  // Two coming-up rows leave room for all five ladder teams at a readable size.
  const upcoming = (upcomingClean.length > 0 ? upcomingClean : afterLast).slice(0, 2);
  const showBottom = show.ladder || show.draw;
  const showTopStrip = show.lastNext || show.leaders;
  const scopeLabel = cricketStatsScopeLabel(activeScope);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col gap-2 overflow-hidden",
        fill && "h-full",
      )}
    >
      <header className="flex shrink-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-ink-gold uppercase">
            Cricket 2 · Ladder & games
            {show.leaders ? ` · Stats ${scopeLabel}` : ""}
          </p>
          <h2 className="truncate font-display text-[clamp(1.55rem,3.4vh,2.85rem)] leading-none">
            {data.title}
          </h2>
        </div>
        {data.preview ? (
          <p className="shrink-0 text-xs font-extrabold text-[#8a5a00]">Sample page</p>
        ) : statsScope === "rotate" ? (
          <p className="shrink-0 text-xs font-extrabold text-[#8a5a00]">
            Rotating · {scopeLabel}
          </p>
        ) : null}
      </header>

      {showTopStrip ? (
        <div className="grid min-h-0 shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6 [grid-auto-rows:minmax(7.5rem,1fr)] xl:[grid-auto-rows:minmax(9.5rem,11.5rem)]">
          {show.lastNext ? (
            <GameCard
              eyebrow="Last game"
              tone="#0d7a64"
              game={data.lastGame}
              empty="No finished game yet."
              resultFirst
              compact
              ladder={data.ladder}
            />
          ) : null}
          {show.leaders
            ? LEADER_BOXES.map(({ key, title, tone }) => (
                <LeaderCard key={key} title={title} tone={tone} rows={leaders[key]} compact />
              ))
            : null}
        </div>
      ) : null}

      {showBottom ? (
        <div
          className={cn(
            "grid min-h-0 flex-1 gap-2 overflow-hidden",
            show.ladder && show.draw && "lg:grid-cols-[1.35fr_0.85fr]",
          )}
        >
          {show.ladder ? (
            <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 border-[#2ec9a0] bg-card p-2.5">
              <h3 className="shrink-0 font-display text-[clamp(1.25rem,2.7vh,2.1rem)] leading-none">
                Ladder
              </h3>
              {data.ladder.length === 0 ? (
                <p className="mt-2 text-sm font-bold text-muted-foreground">No ladder yet.</p>
              ) : (
                <div className="mt-1 flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="grid shrink-0 grid-cols-[2rem_minmax(0,1.6fr)_repeat(3,2.2rem)_repeat(2,2.8rem)_3rem_3rem] gap-x-1 text-[clamp(0.7rem,1.3vh,0.88rem)] font-extrabold tracking-wide text-muted-foreground uppercase">
                    <span className="py-1">#</span>
                    <span className="py-1">Team</span>
                    <span className="py-1 text-right">P</span>
                    <span className="py-1 text-right">W</span>
                    <span className="py-1 text-right">L</span>
                    <span className="py-1 text-right">RF</span>
                    <span className="py-1 text-right">RA</span>
                    <span className="py-1 text-right">%</span>
                    <span className="py-1 text-right">Pts</span>
                  </div>
                  <ul className="flex min-h-0 flex-1 flex-col pb-1">
                    {data.ladder.map((row, index) => (
                      <li
                        key={`${row.team}-${index}`}
                        className="grid min-h-0 flex-1 grid-cols-[2rem_minmax(0,1.6fr)_repeat(3,2.2rem)_repeat(2,2.8rem)_3rem_3rem] items-center gap-x-1 border-t border-black/10"
                      >
                        <span className="font-display text-[clamp(1rem,2.15vh,1.5rem)] tabular-nums leading-none">
                          {index + 1}
                        </span>
                        <span className="truncate font-display text-[clamp(1rem,2.25vh,1.6rem)] leading-tight">
                          {row.team}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {row.played}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {row.won}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {row.lost}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {row.runsFor > 0 || row.runsAgainst > 0 ? row.runsFor : "—"}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {row.runsFor > 0 || row.runsAgainst > 0 ? row.runsAgainst : "—"}
                        </span>
                        <span className="text-right text-[clamp(0.9rem,1.9vh,1.3rem)] font-extrabold tabular-nums leading-none">
                          {formatLadderPercentage(row.percentage)}
                        </span>
                        <span className="text-right font-display text-[clamp(1.1rem,2.4vh,1.75rem)] tabular-nums leading-none">
                          {row.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : null}
          {show.draw ? (
            <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 border-[#8b7cf7] bg-card p-2.5">
              <h3 className="shrink-0 font-display text-[clamp(1.25rem,2.7vh,2.1rem)] leading-none">
                Coming up
              </h3>
              {upcoming.length === 0 ? (
                <p className="mt-2 text-sm font-bold text-muted-foreground">No games left on the draw.</p>
              ) : (
                <ul className="mt-1.5 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
                  {upcoming.map((game, index) => (
                    <li
                      key={`${game.home}-${game.away}-${index}`}
                      className={cn(
                        "flex min-h-0 flex-1 flex-col justify-center rounded-xl px-3 py-3",
                        index === 0 ? "bg-[#efe9ff] ring-2 ring-[#5146b8]/35" : "bg-[#f6f3ff]",
                      )}
                    >
                      <p className="text-[clamp(0.72rem,1.35vh,0.9rem)] font-extrabold tracking-wide text-[#5146b8] uppercase">
                        {index === 0 ? "Next · " : ""}
                        {fixtureMeta(game.when, game.ground)}
                      </p>
                      <p className="font-display text-[clamp(1.15rem,2.6vh,1.95rem)] leading-tight">
                        {cricketMatchTitle(game)}
                      </p>
                      {game.result ? (
                        <p className="mt-1 text-[clamp(0.85rem,1.7vh,1.15rem)] font-bold">{game.result}</p>
                      ) : index === 0 ? (
                        <p className="mt-1 text-[clamp(0.85rem,1.7vh,1.15rem)] font-extrabold text-[#5146b8]">
                          Still to play
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GameCard({
  eyebrow,
  tone,
  game,
  empty,
  resultFirst,
  compact = false,
  ladder = [],
}: {
  eyebrow: string;
  tone: string;
  game: CricketFixture | null;
  empty: string;
  resultFirst: boolean;
  compact?: boolean;
  ladder?: CricketSnapshot["ladder"];
}) {
  const homeRow = game ? ladder.find((row) => row.team.toLowerCase() === game.home.toLowerCase()) : null;
  const awayRow = game ? ladder.find((row) => row.team.toLowerCase() === game.away.toLowerCase()) : null;
  const scoreLine =
    game && (game.homeScore != null || game.awayScore != null)
      ? `${game.homeScore ?? "—"} – ${game.awayScore ?? "—"}`
      : null;
  const rfRaLine =
    !scoreLine &&
    homeRow &&
    awayRow &&
    (homeRow.runsFor > 0 || homeRow.runsAgainst > 0 || awayRow.runsFor > 0 || awayRow.runsAgainst > 0)
      ? `${game!.home} ${homeRow.runsFor} · ${game!.away} ${awayRow.runsFor}`
      : null;

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden bg-card",
        compact
          ? "rounded-[14px] border-[3px] px-2 py-1.5 shadow-none"
          : "rounded-[18px] border-4 px-2.5 py-2 shadow-[0_5px_0_rgba(42,28,4,0.1)]",
      )}
      style={{ borderColor: tone }}
    >
      <p
        className={cn(
          "font-extrabold tracking-[0.12em] uppercase",
          compact ? "text-[clamp(0.55rem,1vh,0.72rem)]" : "text-[clamp(0.55rem,1vh,0.75rem)]",
        )}
        style={{ color: tone }}
      >
        {eyebrow}
      </p>
      {!game ? (
        <p
          className={cn(
            "font-bold text-muted-foreground",
            compact
              ? "mt-0.5 text-[clamp(0.75rem,1.4vh,1rem)] leading-tight"
              : "mt-0.5 text-[clamp(0.8rem,1.6vh,1.1rem)]",
          )}
        >
          {empty}
        </p>
      ) : (
        <>
          <p
            className={cn(
              "truncate font-extrabold text-muted-foreground",
              compact
                ? "mt-0.5 text-[clamp(0.58rem,1.05vh,0.75rem)] leading-tight"
                : "mt-0.5 text-[clamp(0.6rem,1.1vh,0.85rem)]",
            )}
          >
            {fixtureMeta(game.when, game.ground)}
          </p>
          <p
            className={cn(
              "font-display leading-tight",
              compact
                ? "text-[clamp(0.9rem,1.85vh,1.3rem)]"
                : "text-[clamp(0.95rem,2.1vh,1.55rem)]",
            )}
          >
            {cricketMatchTitle(game)}
          </p>
          {scoreLine ? (
            <p
              className={cn(
                "font-display tabular-nums",
                compact
                  ? "text-[clamp(0.95rem,1.9vh,1.35rem)] leading-none"
                  : "mt-0.5 text-[clamp(1rem,2.2vh,1.65rem)]",
              )}
              style={{ color: tone }}
            >
              {scoreLine}
            </p>
          ) : null}
          {rfRaLine ? (
            <p
              className={cn(
                "font-extrabold text-muted-foreground",
                compact
                  ? "text-[clamp(0.62rem,1.15vh,0.82rem)] leading-tight"
                  : "mt-0.5 text-[clamp(0.7rem,1.3vh,0.95rem)]",
              )}
            >
              RF {rfRaLine}
            </p>
          ) : null}
          {game.result ? (
            <p
              className={cn(
                "font-extrabold leading-tight",
                compact
                  ? "mt-0.5 text-[clamp(0.75rem,1.45vh,1.05rem)]"
                  : "mt-0.5 text-[clamp(0.85rem,1.8vh,1.2rem)]",
                !resultFirst && "text-[#5146b8]",
              )}
              style={resultFirst ? { color: tone } : undefined}
            >
              {game.result}
            </p>
          ) : resultFirst ? (
            <p
              className={cn(
                "font-extrabold text-muted-foreground",
                compact
                  ? "mt-0.5 text-[clamp(0.75rem,1.45vh,1.05rem)] leading-tight"
                  : "mt-0.5 text-[clamp(0.85rem,1.8vh,1.2rem)]",
              )}
            >
              Result not on the board yet
            </p>
          ) : (
            <p className="mt-0.5 text-[clamp(0.8rem,1.6vh,1.1rem)] font-extrabold text-[#5146b8]">
              Still to play
            </p>
          )}
        </>
      )}
    </section>
  );
}

function LeaderCard({
  title,
  tone,
  rows,
  compact = false,
}: {
  title: string;
  tone: string;
  rows: CricketLeader[];
  compact?: boolean;
}) {
  // Top 5 — matches Jimmy's leaders setting and leaves room for the full ladder.
  const slotCount = 5;
  const slots = Array.from({ length: slotCount }, (_, index) => rows[index] ?? null);
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-[14px] border-[3px] bg-card",
        compact ? "px-1.5 py-1" : "px-2 py-1.5",
      )}
      style={{ borderColor: tone }}
    >
      <p
        className="shrink-0 text-[clamp(0.52rem,0.95vh,0.7rem)] font-extrabold tracking-[0.08em] uppercase leading-none"
        style={{ color: tone }}
      >
        {title}
      </p>
      <ol className="mt-1 flex min-h-0 flex-1 flex-col justify-between gap-0.5">
        {slots.map((row, index) => (
          <li
            key={`${title}-${index}`}
            className="flex min-h-0 flex-1 items-center justify-between gap-1 border-b border-black/5 leading-none last:border-b-0"
          >
            <span
              className={cn(
                "min-w-0 truncate font-display leading-none",
                compact
                  ? "text-[clamp(0.72rem,1.45vh,1.05rem)]"
                  : "text-[clamp(0.85rem,1.9vh,1.35rem)]",
                !row && "text-muted-foreground/50",
              )}
            >
              <span className="mr-0.5 text-[0.7em] text-muted-foreground tabular-nums">{index + 1}.</span>
              {row?.name ?? "—"}
            </span>
            <span
              className={cn(
                "shrink-0 font-display tabular-nums leading-none",
                compact
                  ? "text-[clamp(0.75rem,1.5vh,1.1rem)]"
                  : "text-[clamp(0.9rem,2vh,1.45rem)]",
              )}
            >
              {row?.value ?? ""}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
