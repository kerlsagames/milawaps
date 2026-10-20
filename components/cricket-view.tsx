"use client";

import useSWR from "swr";
import {
  cricketMatchTitle,
  type CricketFixture,
  type CricketLeader,
  type CricketLeaders,
  type CricketSnapshot,
} from "@/lib/cricket";

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

export function CricketView({ code }: { code: string }) {
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

  const hasLeaders = LEADER_BOXES.some(({ key }) => data.leaders[key].length > 0);

  return (
    <div className="flex min-h-0 flex-col gap-3 lg:gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-ink-gold uppercase sm:text-sm">
            School cricket
          </p>
          <h2 className="font-display text-5xl leading-none sm:text-6xl lg:text-7xl">{data.title}</h2>
        </div>
        {data.preview ? (
          <p className="text-base font-extrabold text-[#8a5a00]">Sample page, not a live ladder.</p>
        ) : null}
      </header>

      <div className="grid gap-3 lg:grid-cols-2">
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

      {hasLeaders ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {LEADER_BOXES.map(({ key, title, tone }) => (
            <LeaderCard key={key} title={title} tone={tone} rows={data.leaders[key]} />
          ))}
        </div>
      ) : null}

      <div className="grid min-h-0 gap-3 lg:grid-cols-2 lg:gap-4">
        <section className="rounded-[28px] border-4 border-[#2ec9a0] bg-card p-4 lg:p-5">
          <h3 className="font-display text-4xl leading-none sm:text-5xl">Ladder</h3>
          {data.ladder.length === 0 ? (
            <p className="mt-3 text-lg font-bold text-muted-foreground">No ladder yet.</p>
          ) : (
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="text-sm font-extrabold tracking-wide text-muted-foreground uppercase sm:text-base">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2">Team</th>
                  <th className="py-2 text-right">P</th>
                  <th className="py-2 text-right">W</th>
                  <th className="py-2 text-right">L</th>
                  <th className="py-2 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {data.ladder.map((row, index) => (
                  <tr key={`${row.team}-${index}`} className="border-t border-black/10">
                    <td className="py-2.5 pr-2 font-display text-2xl tabular-nums sm:text-3xl">
                      {index + 1}
                    </td>
                    <td className="py-2.5 font-display text-2xl leading-tight sm:text-3xl lg:text-4xl">
                      {row.team}
                    </td>
                    <td className="py-2.5 text-right text-xl font-extrabold tabular-nums sm:text-2xl">
                      {row.played}
                    </td>
                    <td className="py-2.5 text-right text-xl font-extrabold tabular-nums sm:text-2xl">
                      {row.won}
                    </td>
                    <td className="py-2.5 text-right text-xl font-extrabold tabular-nums sm:text-2xl">
                      {row.lost}
                    </td>
                    <td className="py-2.5 text-right font-display text-3xl tabular-nums sm:text-4xl">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="rounded-[28px] border-4 border-[#8b7cf7] bg-card p-4 lg:p-5">
          <h3 className="font-display text-4xl leading-none sm:text-5xl">Draw</h3>
          {data.draw.length === 0 ? (
            <p className="mt-3 text-lg font-bold text-muted-foreground">No games on the draw yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {data.draw.map((game, index) => (
                <li
                  key={`${game.home}-${game.away}-${index}`}
                  className="rounded-2xl bg-[#f6f3ff] px-4 py-3"
                >
                  <p className="text-sm font-extrabold tracking-wide text-[#5146b8] uppercase sm:text-base">
                    {fixtureMeta(game.when, game.ground)}
                  </p>
                  <p className="font-display text-2xl leading-tight sm:text-3xl">
                    {cricketMatchTitle(game)}
                  </p>
                  {game.result ? (
                    <p className="mt-1 text-lg font-bold sm:text-xl">{game.result}</p>
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
      className="rounded-[28px] border-4 bg-card p-4 shadow-[0_8px_0_rgba(42,28,4,0.12)] lg:p-5"
      style={{ borderColor: tone }}
    >
      <p
        className="text-sm font-extrabold tracking-[0.2em] uppercase sm:text-base"
        style={{ color: tone }}
      >
        {eyebrow}
      </p>
      {!game ? (
        <p className="mt-2 text-xl font-bold text-muted-foreground sm:text-2xl">{empty}</p>
      ) : (
        <>
          <p className="mt-1 text-base font-extrabold text-muted-foreground sm:text-lg">
            {fixtureMeta(game.when, game.ground)}
          </p>
          <p className="mt-1 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
            {cricketMatchTitle(game)}
          </p>
          {game.result ? (
            <p
              className={`mt-2 text-xl font-extrabold sm:text-2xl ${resultFirst ? "" : "text-[#5146b8]"}`}
              style={resultFirst ? { color: tone } : undefined}
            >
              {game.result}
            </p>
          ) : (
            <p className="mt-2 text-xl font-extrabold text-[#5146b8] sm:text-2xl">Still to play</p>
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
  return (
    <section
      className="rounded-[28px] border-4 bg-card p-3 lg:p-4"
      style={{ borderColor: tone }}
    >
      <p className="text-sm font-extrabold tracking-[0.18em] uppercase" style={{ color: tone }}>
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-2 text-base font-bold text-muted-foreground">Waiting for scores.</p>
      ) : (
        <ol className="mt-2 flex flex-col gap-1.5">
          {rows.map((row, index) => (
            <li
              key={`${row.name}-${index}`}
              className="flex items-baseline justify-between gap-2 border-b border-black/5 pb-1 last:border-b-0"
            >
              <span className="min-w-0 truncate font-display text-xl leading-none sm:text-2xl">
                <span className="mr-1.5 text-base text-muted-foreground tabular-nums">{index + 1}.</span>
                {row.name}
              </span>
              {row.value ? (
                <span className="shrink-0 font-display text-2xl tabular-nums sm:text-3xl">
                  {row.value}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
