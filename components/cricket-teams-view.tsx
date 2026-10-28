"use client";

import useSWR from "swr";
import type { CricketSnapshot } from "@/lib/cricket";
import type { CricketRosters } from "@/lib/site-display";
import { cn } from "@/lib/utils";

const TEAM_TONES = ["#0d7a64", "#5146b8", "#c48a16", "#c23b3b", "#1f6f8b", "#7b4bff"];

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const body = (await response.json().catch(() => ({}))) as CricketSnapshot & { error?: string };
  if (!response.ok) throw new Error(body.error || "The cricket board is out of reach.");
  return body;
};

function mergeTeamNames(rosters: CricketRosters, ladderTeams: string[]) {
  const names = new Set<string>();
  for (const team of Object.keys(rosters)) {
    if (team.trim()) names.add(team);
  }
  for (const team of ladderTeams) {
    const value = team.replace(/\s+/g, " ").trim();
    if (value) names.add(value);
  }
  return [...names];
}

export function CricketTeamsView({
  code,
  rosters,
  fill = false,
}: {
  code: string;
  rosters: CricketRosters;
  fill?: boolean;
}) {
  const { data, error, isLoading } = useSWR<CricketSnapshot>(
    code ? `/api/cricket?code=${encodeURIComponent(code)}` : null,
    fetcher,
    { refreshInterval: 60_000 },
  );

  const ladderTeams = data?.ladder.map((row) => row.team) ?? [];
  const teams = mergeTeamNames(rosters, ladderTeams);
  const hasAnyPlayers = teams.some((team) => (rosters[team]?.length ?? 0) > 0);

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
            const players = rosters[team] ?? [];
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
