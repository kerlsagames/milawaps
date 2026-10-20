"use client";

import useSWR from "swr";
import {
  cricketMatchTitle,
  fixtureIsFinished,
  type CricketFixture,
  type CricketLeader,
  type CricketLeaders,
  type CricketSnapshot,
} from "@/lib/cricket";
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
];

export function CricketView({ code, fill = false }: { code: string; fill?: boolean }) {
  const { data, error, isLoading } = useSWR<CricketSnapshot>(
    code ? `/api/cricket?code=${encodeURIComponent(code)}` : null,
    fetcher,
    { refreshInterval: 30_000 },
  );

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

  if (error || !data) {
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
  const upcoming = data.draw.filter((game) => !fixtureIsFinished(game.result)).slice(0, 2);

  return (
    <div
      className={cn(
        "flex min-h-0 w-full flex-col gap-1.5 overflow-hidden",
        fill && "h-full",
      )}
    >
      <header className="flex shrink-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.2em] text-ink-gold uppercase">
            School cricket
          </p>
          <h2 className="truncate font-display text-[clamp(1.6rem,3.8vh,3.25rem)] leading-none">
            {data.title}
          </h2>
        </div>
        {data.preview ? (
          <p className="shrink-0 text-xs font-extrabold text-[#8a5a00]">Sample page</p>
        ) : null}
      </header>

      <div className="grid shrink-0 gap-1.5 sm:grid-cols-2">
        <GameCard
          eyebrow="Last game"
          tone="#0d7a64"
          game={data.lastGame}
          empty="No finished game yet."
          resultFirst
        />
        <GameCard
          eyebrow="Next game"
          tone="#5146b8"
          game={data.nextGame}
          empty="No game coming up."
          resultFirst={false}
        />
      </div>

      <div className="grid min-h-0 shrink-0 grid-cols-2 gap-1.5 xl:grid-cols-4">
        {LEADER_BOXES.map(({ key, title, tone }) => (
          <LeaderCard key={key} title={title} tone={tone} rows={data.leaders[key]} />
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-1.5 overflow-hidden lg:grid-cols-[1.2fr_0.8fr]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 border-[#2ec9a0] bg-card p-2.5">
          <h3 className="shrink-0 font-display text-[clamp(1.25rem,2.8vh,2.25rem)] leading-none">
            Ladder
          </h3>
          {data.ladder.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">No ladder yet.</p>
          ) : (
            <table className="mt-1 w-full min-h-0 flex-1 text-left">
              <thead>
                <tr className="text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-wide text-muted-foreground uppercase">
                  <th className="py-0.5 pr-1">#</th>
                  <th className="py-0.5">Team</th>
                  <th className="py-0.5 text-right">P</th>
                  <th className="py-0.5 text-right">W</th>
                  <th className="py-0.5 text-right">L</th>
                  <th className="py-0.5 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {data.ladder.map((row, index) => (
                  <tr key={`${row.team}-${index}`} className="border-t border-black/10">
                    <td className="py-1 pr-1 font-display text-[clamp(1.1rem,2.6vh,2rem)] tabular-nums">
                      {index + 1}
                    </td>
                    <td className="py-1 font-display text-[clamp(1.1rem,2.8vh,2.35rem)] leading-tight">
                      {row.team}
                    </td>
                    <td className="py-1 text-right text-[clamp(0.95rem,2.2vh,1.6rem)] font-extrabold tabular-nums">
                      {row.played}
                    </td>
                    <td className="py-1 text-right text-[clamp(0.95rem,2.2vh,1.6rem)] font-extrabold tabular-nums">
                      {row.won}
                    </td>
                    <td className="py-1 text-right text-[clamp(0.95rem,2.2vh,1.6rem)] font-extrabold tabular-nums">
                      {row.lost}
                    </td>
                    <td className="py-1 text-right font-display text-[clamp(1.25rem,3vh,2.5rem)] tabular-nums">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border-4 border-[#8b7cf7] bg-card p-2.5">
          <h3 className="shrink-0 font-display text-[clamp(1.25rem,2.8vh,2.25rem)] leading-none">
            Coming up
          </h3>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">No games left on the draw.</p>
          ) : (
            <ul className="mt-1 flex min-h-0 flex-1 flex-col justify-evenly gap-1.5 overflow-hidden">
              {upcoming.map((game, index) => (
                <li
                  key={`${game.home}-${game.away}-${index}`}
                  className="rounded-xl bg-[#f6f3ff] px-3 py-2"
                >
                  <p className="text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-wide text-[#5146b8] uppercase">
                    {fixtureMeta(game.when, game.ground)}
                  </p>
                  <p className="font-display text-[clamp(1.05rem,2.5vh,1.85rem)] leading-tight">
                    {cricketMatchTitle(game)}
                  </p>
                  {game.result ? (
                    <p className="mt-0.5 text-[clamp(0.8rem,1.6vh,1.1rem)] font-bold">{game.result}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function GameCard({
  eyebrow,
  tone,
  game,
  empty,
  resultFirst,
}: {
  eyebrow: string;
  tone: string;
  game: CricketFixture | null;
  empty: string;
  resultFirst: boolean;
}) {
  return (
    <section
      className="overflow-hidden rounded-[20px] border-4 bg-card px-2.5 py-2 shadow-[0_5px_0_rgba(42,28,4,0.1)]"
      style={{ borderColor: tone }}
    >
      <p
        className="text-[clamp(0.65rem,1.2vh,0.8rem)] font-extrabold tracking-[0.16em] uppercase"
        style={{ color: tone }}
      >
        {eyebrow}
      </p>
      {!game ? (
        <p className="mt-0.5 text-[clamp(0.9rem,1.8vh,1.25rem)] font-bold text-muted-foreground">
          {empty}
        </p>
      ) : (
        <>
          <p className="mt-0.5 truncate text-[clamp(0.7rem,1.3vh,0.95rem)] font-extrabold text-muted-foreground">
            {fixtureMeta(game.when, game.ground)}
          </p>
          <p className="font-display text-[clamp(1.1rem,2.6vh,2rem)] leading-none">
            {cricketMatchTitle(game)}
          </p>
          {game.result ? (
            <p
              className={`mt-0.5 text-[clamp(0.85rem,1.7vh,1.2rem)] font-extrabold ${resultFirst ? "" : "text-[#5146b8]"}`}
              style={resultFirst ? { color: tone } : undefined}
            >
              {game.result}
            </p>
          ) : (
            <p className="mt-0.5 text-[clamp(0.85rem,1.7vh,1.2rem)] font-extrabold text-[#5146b8]">
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
}: {
  title: string;
  tone: string;
  rows: CricketLeader[];
}) {
  // Always paint five slots so the board is ready for full top-5 lists.
  const slots = Array.from({ length: 5 }, (_, index) => rows[index] ?? null);
  return (
    <section
      className="min-h-0 overflow-hidden rounded-[18px] border-4 bg-card px-2 py-1.5"
      style={{ borderColor: tone }}
    >
      <p
        className="text-[clamp(0.6rem,1.1vh,0.75rem)] font-extrabold tracking-[0.14em] uppercase"
        style={{ color: tone }}
      >
        {title}
      </p>
      <ol className="mt-0.5 flex flex-col">
        {slots.map((row, index) => (
          <li
            key={`${title}-${index}`}
            className="flex items-baseline justify-between gap-1 border-b border-black/5 py-0.5 last:border-b-0"
          >
            <span
              className={cn(
                "min-w-0 truncate font-display text-[clamp(0.85rem,1.9vh,1.35rem)] leading-none",
                !row && "text-muted-foreground/50",
              )}
            >
              <span className="mr-1 text-[0.7em] text-muted-foreground tabular-nums">{index + 1}.</span>
              {row?.name ?? "—"}
            </span>
            <span className="shrink-0 font-display text-[clamp(0.9rem,2vh,1.45rem)] tabular-nums">
              {row?.value ?? ""}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
