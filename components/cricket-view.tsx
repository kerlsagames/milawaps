"use client";

import useSWR from "swr";
import type { CricketSnapshot } from "@/lib/cricket";

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

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-ink-gold uppercase">School cricket</p>
          <h2 className="font-display text-4xl leading-none sm:text-5xl">{data.title}</h2>
        </div>
        {data.preview ? (
          <p className="text-sm font-extrabold text-[#8a5a00]">Sample page, not a live ladder.</p>
        ) : null}
      </header>
      {data.stats.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {data.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#e2a01a]/40 bg-[#fff8df] px-3 py-2 text-center"
            >
              <p className="font-display text-2xl leading-none sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs font-extrabold tracking-wide text-[#8a5a00] uppercase">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-[28px] border-4 border-[#2ec9a0] bg-card p-3">
          <h3 className="font-display text-2xl">Ladder</h3>
          {data.ladder.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">No ladder yet.</p>
          ) : (
            <table className="mt-2 w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
                  <th className="py-1">Team</th>
                  <th className="py-1 text-right">P</th>
                  <th className="py-1 text-right">W</th>
                  <th className="py-1 text-right">L</th>
                  <th className="py-1 text-right">Pts</th>
                </tr>
              </thead>
              <tbody>
                {data.ladder.map((row, index) => (
                  <tr key={`${row.team}-${index}`} className="border-t border-black/5 font-bold">
                    <td className="py-1.5">{row.team}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.played}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.won}</td>
                    <td className="py-1.5 text-right tabular-nums">{row.lost}</td>
                    <td className="py-1.5 text-right font-display text-lg tabular-nums">{row.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="rounded-[28px] border-4 border-[#8b7cf7] bg-card p-3">
          <h3 className="font-display text-2xl">Draw</h3>
          {data.draw.length === 0 ? (
            <p className="mt-2 text-sm font-bold text-muted-foreground">No games on the draw yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {data.draw.map((game, index) => (
                <li key={`${game.home}-${game.away}-${index}`} className="rounded-2xl bg-[#f6f3ff] px-3 py-2">
                  <p className="text-xs font-extrabold tracking-wide text-[#5146b8] uppercase">
                    {fixtureMeta(game.when, game.ground)}
                  </p>
                  <p className="font-display text-xl leading-tight">
                    {game.away ? `${game.home} vs ${game.away}` : game.home}
                  </p>
                  {game.result ? <p className="text-sm font-bold">{game.result}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
