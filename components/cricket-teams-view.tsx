"use client";

import useSWR from "swr";
import {
  cricketMatchTitle,
  type CricketSnapshot,
  type CricketTeam,
} from "@/lib/cricket";
import type { CricketRosters, CricketTeamsMode } from "@/lib/site-display";
import { cn } from "@/lib/utils";

const TEAM_TONES = ["#0d7a64", "#5146b8", "#c48a16", "#c23b3b", "#1f6f8b", "#7b4bff"];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = (await response.json().catch(() => ({}))) as CricketSnapshot & { error?: string };
  if (!response.ok) throw new Error(body.error || "The cricket board is out of reach.");
  return body;
};

function mergeRosters(saved: CricketRosters, boardTeams: CricketTeam[]): CricketRosters {
  const out: CricketRosters = { ...saved };
  for (const team of boardTeams) {
    const name = team.name.replace(/\s+/g, " ").trim();
    if (!name) continue;
    // Prefer teacher-edited lists when present; otherwise use Jimmy’s team sheet.
    if ((out[name]?.length ?? 0) > 0) continue;
    out[name] = team.players;
  }
  return out;
}

function mergeTeamNames(rosters: CricketRosters, ladderTeams: string[], boardTeams: CricketTeam[]) {
  const names = new Set<string>();
  for (const team of boardTeams) {
    const value = team.name.replace(/\s+/g, " ").trim();
    if (value) names.add(value);
  }
  for (const team of Object.keys(rosters)) {
    if (team.trim()) names.add(team);
  }
  for (const team of ladderTeams) {
    const value = team.replace(/\s+/g, " ").trim();
    if (value) names.add(value);
  }
  return [...names];
}

function playersFor(rosters: CricketRosters, team: string) {
  if (rosters[team]?.length) return rosters[team]!;
  const needle = team.toLowerCase();
  for (const [name, players] of Object.entries(rosters)) {
    if (name.toLowerCase() === needle) return players;
  }
  return [];
}

export function CricketTeamsView({
  code,
  rosters,
  mode = "all",
  fill = false,
}: {
  code: string;
  rosters: CricketRosters;
  mode?: CricketTeamsMode;
  fill?: boolean;
}) {
  const { data, error, isLoading } = useSWR<CricketSnapshot>(
    code ? `/api/cricket?code=${encodeURIComponent(code)}` : null,
    fetcher,
    { refreshInterval: 15_000, revalidateOnFocus: true },
  );

  const boardTeams = data?.teams ?? [];
  const effectiveRosters = mergeRosters(rosters, boardTeams);
  const ladderTeams = data?.ladder.map((row) => row.team) ?? [];
  const teams = mergeTeamNames(effectiveRosters, ladderTeams, boardTeams);
  const hasAnyPlayers = teams.some((team) => playersFor(effectiveRosters, team).length > 0);

  if (!code) {
    return (
      <section className="rounded-[28px] border border-[#0d7a64]/40 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket teams</h2>
        <p className="mt-2 text-lg font-bold text-muted-foreground">
          Add the code from Jimmy’s cricket in Settings.
        </p>
      </section>
    );
  }

  if (isLoading && !data && teams.length === 0) {
    return (
      <section className="rounded-[28px] border border-[#0d7a64]/40 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket teams</h2>
        <p className="mt-2 text-lg font-bold text-muted-foreground">Loading the teams…</p>
      </section>
    );
  }

  if ((error || !data) && teams.length === 0) {
    return (
      <section className="rounded-[28px] border border-[#c23b3b]/30 bg-card px-6 py-10 text-center">
        <h2 className="font-display text-4xl">Cricket teams</h2>
        <p className="mt-2 text-lg font-bold text-[#8d1f1f]">
          {error instanceof Error ? error.message : "The cricket board is out of reach."}
        </p>
      </section>
    );
  }

  if (mode === "next") {
    return (
      <NextGameMode
        title={data?.title ?? "School cricket"}
        nextGame={data?.nextGame ?? null}
        rosters={effectiveRosters}
        fill={fill}
      />
    );
  }

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
            Cricket 1 · Find your team
          </p>
          <h2 className="truncate font-display text-[clamp(1.6rem,3.8vh,3.25rem)] leading-none">
            {data?.title ?? "School cricket"}
          </h2>
        </div>
        {!hasAnyPlayers ? (
          <p className="shrink-0 text-xs font-extrabold text-[#8a5a00]">
            Add player names in Settings → Cricket
          </p>
        ) : null}
      </header>

      {teams.length === 0 ? (
        <section className="grid flex-1 place-items-center rounded-[28px] border border-[#0d7a64]/30 bg-card px-6 py-10 text-center">
          <p className="text-lg font-bold text-muted-foreground">
            Team names will appear once the ladder loads, or add them in Settings.
          </p>
        </section>
      ) : (
        <div
          className={cn(
            "grid min-h-0 flex-1 gap-2 overflow-hidden",
            teams.length <= 2 && "grid-cols-1 sm:grid-cols-2",
            teams.length === 3 && "grid-cols-1 sm:grid-cols-3",
            teams.length >= 4 && "grid-cols-2 xl:grid-cols-4",
          )}
        >
          {teams.map((team, index) => {
            const players = playersFor(effectiveRosters, team);
            const tone = TEAM_TONES[index % TEAM_TONES.length]!;
            return (
              <section
                key={team}
                className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border-4 bg-card p-3"
                style={{ borderColor: tone }}
              >
                <h3
                  className="shrink-0 font-display text-[clamp(1.35rem,3.2vh,2.5rem)] leading-none"
                  style={{ color: tone }}
                >
                  {team}
                </h3>
                {players.length === 0 ? (
                  <p className="mt-3 text-sm font-bold text-muted-foreground">
                    Names coming soon — ask a teacher.
                  </p>
                ) : (
                  <ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden">
                    {players.map((player) => (
                      <li
                        key={`${team}-${player}`}
                        className="truncate font-display text-[clamp(1.05rem,2.6vh,2rem)] leading-tight"
                      >
                        {player}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NextGameMode({
  title,
  nextGame,
  rosters,
  fill,
}: {
  title: string;
  nextGame: CricketSnapshot["nextGame"];
  rosters: CricketRosters;
  fill: boolean;
}) {
  const home = nextGame?.home?.trim() || "";
  const away = nextGame?.away?.trim() || "";
  const homePlayers = home ? playersFor(rosters, home) : [];
  const awayPlayers = away ? playersFor(rosters, away) : [];
  const when = nextGame?.when?.trim() || "";
  const ground = nextGame?.ground?.trim() || "";
  const meta = [when, ground && !when.toLowerCase().includes(ground.toLowerCase()) ? ground : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col gap-2 overflow-hidden",
        fill && "h-full",
      )}
    >
      <header className="shrink-0">
        <p className="text-[10px] font-bold tracking-[0.2em] text-ink-gold uppercase">
          Cricket 1 · Next game
        </p>
        <h2 className="truncate font-display text-[clamp(1.4rem,3.2vh,2.75rem)] leading-none">
          {title}
        </h2>
      </header>

      {!nextGame || (!home && !away) ? (
        <section className="grid flex-1 place-items-center rounded-[28px] border border-[#0d7a64]/30 bg-card px-6 py-10 text-center">
          <p className="font-display text-3xl">No game coming up</p>
          <p className="mt-2 text-lg font-bold text-muted-foreground">
            Flip back to all teams in Settings, or wait for the next fixture on Jimmy’s board.
          </p>
        </section>
      ) : (
        <div className="grid min-h-0 flex-1 gap-2 overflow-hidden lg:grid-cols-[1fr_1.15fr_1fr]">
          <TeamSheet team={home || "Home"} players={homePlayers} tone={TEAM_TONES[0]!} side="Home" />
          <section className="flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-[28px] border-4 border-[#c48a16] bg-[radial-gradient(circle_at_center,#fff8df_0%,#ffe08a_55%,#f5d27a_100%)] px-3 py-4 text-center">
            <p className="text-[clamp(0.7rem,1.4vh,0.95rem)] font-extrabold tracking-[0.22em] text-[#8a5a00] uppercase">
              Next match
            </p>
            <p className="mt-2 font-display text-[clamp(1.6rem,5.5vh,4.5rem)] leading-[0.95] text-[#2a1c04]">
              {cricketMatchTitle(nextGame)}
            </p>
            {meta ? (
              <p className="mt-3 font-display text-[clamp(1.2rem,3.4vh,2.6rem)] leading-tight text-[#5a3208]">
                {meta}
              </p>
            ) : null}
            {nextGame.result && nextGame.result.toLowerCase() !== "still to play" ? (
              <p className="mt-2 text-[clamp(0.95rem,2vh,1.35rem)] font-extrabold text-[#0d7a64]">
                {nextGame.result}
              </p>
            ) : null}
          </section>
          <TeamSheet team={away || "Away"} players={awayPlayers} tone={TEAM_TONES[1]!} side="Away" />
        </div>
      )}
    </div>
  );
}

function TeamSheet({
  team,
  players,
  tone,
  side,
}: {
  team: string;
  players: string[];
  tone: string;
  side: string;
}) {
  return (
    <section
      className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border-4 bg-card p-3 text-center"
      style={{ borderColor: tone }}
    >
      <p
        className="text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-[0.18em] uppercase"
        style={{ color: tone }}
      >
        {side}
      </p>
      <h3 className="font-display text-[clamp(1.5rem,3.6vh,2.75rem)] leading-none" style={{ color: tone }}>
        {team}
      </h3>
      {players.length === 0 ? (
        <p className="mt-3 text-sm font-bold text-muted-foreground">Team list coming soon.</p>
      ) : (
        <ul className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-evenly gap-0 overflow-hidden">
          {players.map((player) => (
            <li
              key={`${team}-${player}`}
              className="w-full truncate px-1 text-center font-display text-[clamp(1.55rem,4vh,3rem)] leading-[1.05]"
            >
              {player}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
