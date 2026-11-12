import {
  enrichDrawScoresFromJimmySchool,
  enrichLadderFromJimmySchool,
  leadersFromJimmySchool,
  parseJimmySchool,
} from "@/lib/jimmy-school";

export type CricketStat = { label: string; value: string };
export type CricketRow = {
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
  /** Runs scored (for). */
  runsFor: number;
  /** Runs conceded (against). */
  runsAgainst: number;
  /** Percentage — RF/(RF+RA) when run totals exist, otherwise win %. */
  percentage: number | null;
};
export type CricketFixture = {
  when: string;
  home: string;
  away: string;
  ground: string;
  result: string;
  /** Live / exported innings totals when Jimmy includes them. */
  homeScore?: number;
  awayScore?: number;
};
export type CricketLeader = { name: string; value: string };
export type CricketLeaders = {
  runs: CricketLeader[];
  wickets: CricketLeader[];
  catches: CricketLeader[];
  highest: CricketLeader[];
  runOuts: CricketLeader[];
  sixes: CricketLeader[];
  fours: CricketLeader[];
};
export type CricketTeam = { name: string; players: string[] };

export type CricketSnapshot = {
  title: string;
  updatedAt: string | null;
  stats: CricketStat[];
  ladder: CricketRow[];
  draw: CricketFixture[];
  leaders: CricketLeaders;
  teams: CricketTeam[];
  lastGame: CricketFixture | null;
  nextGame: CricketFixture | null;
  /** In-progress fixture with live totals when Jimmy is scoring. */
  liveGame: CricketFixture | null;
  preview: boolean;
};

export const PREVIEW_CRICKET: CricketSnapshot = {
  title: "Preview ladder",
  updatedAt: null,
  preview: true,
  stats: [
    { label: "Games", value: "3" },
    { label: "Most runs", value: "Poppy 48" },
    { label: "Most wickets", value: "Leo 5" },
    { label: "Most catches", value: "Isla 3" },
    { label: "Highest score", value: "Poppy 48" },
    { label: "On top", value: "5/6 · 4 pts" },
  ],
  ladder: [
    { team: "5/6", played: 2, won: 2, lost: 0, points: 4, runsFor: 96, runsAgainst: 70, percentage: 137.1 },
    { team: "2/3/4", played: 2, won: 1, lost: 1, points: 2, runsFor: 80, runsAgainst: 82, percentage: 97.6 },
    { team: "F/1", played: 2, won: 0, lost: 2, points: 0, runsFor: 64, runsAgainst: 88, percentage: 72.7 },
  ],
  draw: [
    { when: "Fri 9:00", home: "F/1", away: "2/3/4", ground: "Oval", result: "2/3/4 won by 12 runs" },
    { when: "Fri 9:40", home: "5/6", away: "F/1", ground: "Oval", result: "Still to play" },
  ],
  leaders: {
    runs: [
      { name: "Poppy", value: "48" },
      { name: "Leo", value: "31" },
      { name: "Isla", value: "27" },
      { name: "Hugh", value: "22" },
      { name: "Harry", value: "18" },
    ],
    wickets: [
      { name: "Leo", value: "5" },
      { name: "Riley", value: "4" },
      { name: "Zaylee", value: "3" },
      { name: "Scout", value: "2" },
      { name: "Max", value: "2" },
    ],
    catches: [
      { name: "Isla", value: "3" },
      { name: "Poppy", value: "2" },
      { name: "Van", value: "2" },
      { name: "Josie", value: "1" },
      { name: "Tom", value: "1" },
    ],
    highest: [
      { name: "Poppy", value: "48" },
      { name: "Leo", value: "31" },
      { name: "Isla", value: "27" },
      { name: "Hugh", value: "22" },
      { name: "Harry", value: "18" },
    ],
    runOuts: [
      { name: "Scout", value: "2" },
      { name: "Riley", value: "1" },
      { name: "Max", value: "1" },
    ],
    sixes: [
      { name: "Poppy", value: "4" },
      { name: "Leo", value: "2" },
      { name: "Isla", value: "1" },
    ],
    fours: [
      { name: "Leo", value: "6" },
      { name: "Poppy", value: "5" },
      { name: "Hugh", value: "3" },
    ],
  },
  teams: [
    { name: "5/6", players: ["Poppy", "Leo", "Hugh", "Harry", "Scout"] },
    { name: "2/3/4", players: ["Isla", "Riley", "Zaylee", "Van", "Josie"] },
    { name: "F/1", players: ["Max", "Tom", "Sam", "Alex", "Jordan"] },
  ],
  lastGame: {
    when: "Fri 9:00",
    home: "F/1",
    away: "2/3/4",
    ground: "Oval",
    result: "2/3/4 won by 12 runs",
  },
  nextGame: {
    when: "Fri 9:40",
    home: "5/6",
    away: "F/1",
    ground: "Oval",
    result: "Still to play",
  },
  liveGame: null,
};

function text(value: unknown, max: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function count(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(999, Math.round(number)));
}

const LEADER_LIST_LIMIT = 6;

function parseLeadersList(raw: unknown): CricketLeader[] {
  if (typeof raw === "string") return leadersFromStatValue(raw);
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, LEADER_LIST_LIMIT).flatMap((item) => {
    if (typeof item === "string") return leadersFromStatValue(item);
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = text(row.name ?? row.player ?? row.label, 40);
    const value = text(row.value ?? row.score ?? row.total ?? row.runs ?? row.wickets, 20);
    if (!name) return [];
    // Allow name-only rows when Jimmy sends ranked lists without totals yet.
    return [{ name, value }];
  });
}

/** Turn "Ryan 34" / "Riley · 6" / "Van 30, Zach 22" into leader rows. */
function leadersFromStatValue(value: string): CricketLeader[] {
  const cleaned = value.replace(/\s*[·•]\s*/g, " ").trim();
  if (!cleaned) return [];
  const chunks = cleaned.split(/\s*,\s*|\s*;\s*|\s*\|\s*/).filter(Boolean);
  const rows: CricketLeader[] = [];
  for (const chunk of chunks.slice(0, LEADER_LIST_LIMIT)) {
    const match = chunk.trim().match(/^(.+?)\s+(\d[\d]*)$/);
    if (match) {
      rows.push({ name: match[1]!.trim().slice(0, 40), value: match[2]! });
      continue;
    }
    if (chunk.trim()) rows.push({ name: chunk.trim().slice(0, 40), value: "" });
  }
  return rows;
}

function emptyLeaders(): CricketLeaders {
  return { runs: [], wickets: [], catches: [], highest: [], runOuts: [], sixes: [], fours: [] };
}

function leadersFromStats(stats: CricketStat[]): CricketLeaders {
  const leaders = emptyLeaders();
  for (const stat of stats) {
    const label = stat.label.toLowerCase();
    const row = leadersFromStatValue(stat.value);
    if (!row.length) continue;
    if (label.includes("most runs") || label === "runs") leaders.runs = row;
    else if (label.includes("most wicket") || label === "wickets") leaders.wickets = row;
    else if (label.includes("most catch") || label === "catches") leaders.catches = row;
    else if (label.includes("run out") || label.includes("runout")) leaders.runOuts = row;
    else if (label.includes("highest") || label.includes("top score")) leaders.highest = row;
    else if (label.includes("six")) leaders.sixes = row;
    else if (label.includes("four")) leaders.fours = row;
  }
  return leaders;
}

function preferLonger(a: CricketLeader[], b: CricketLeader[]): CricketLeader[] {
  return a.length >= b.length ? a : b;
}

function mergeLeaders(fromApi: CricketLeaders, fromStats: CricketLeaders): CricketLeaders {
  const runs = preferLonger(fromApi.runs, fromStats.runs);
  const wickets = preferLonger(fromApi.wickets, fromStats.wickets);
  const catches = preferLonger(fromApi.catches, fromStats.catches);
  const runOuts = preferLonger(fromApi.runOuts, fromStats.runOuts);
  const sixes = preferLonger(fromApi.sixes, fromStats.sixes);
  const fours = preferLonger(fromApi.fours, fromStats.fours);
  let highest = preferLonger(fromApi.highest, fromStats.highest);
  // Jimmy often only publishes “Most runs” — reuse that list for highest score when empty.
  if (highest.length === 0 && runs.length > 0) highest = runs;
  return { runs, wickets, catches, highest, runOuts, sixes, fours };
}

/** Match a cricket leader name to a school year level via the student roll. */
export function cricketLeaderUnitId(
  name: string,
  roll: { name: string; unitId: "f1" | "234" | "56" }[],
): "f1" | "234" | "56" | null {
  const needle = name.replace(/\s+/g, " ").trim().toLowerCase();
  if (!needle) return null;
  const exact = roll.find((student) => student.name.replace(/\s+/g, " ").trim().toLowerCase() === needle);
  if (exact) return exact.unitId;
  const first = needle.split(" ")[0]!;
  const partial = roll.filter((student) => {
    const studentName = student.name.replace(/\s+/g, " ").trim().toLowerCase();
    return studentName === first || studentName.startsWith(`${first} `);
  });
  if (partial.length === 1) return partial[0]!.unitId;
  return null;
}

/** How many names to show in each Cricket 2 leader card after year-level filtering. */
export const CRICKET_LEADER_DISPLAY_LIMIT = 6;

export function filterCricketLeaders(
  leaders: CricketLeaders,
  scope: "all" | "f1" | "234" | "56",
  roll: { name: string; unitId: "f1" | "234" | "56" }[],
): CricketLeaders {
  // Rankings stay sorted; for a year band take that band's own top N (not overall top N filtered down).
  const keep = (rows: CricketLeader[]) => {
    const scoped =
      scope === "all" ? rows : rows.filter((row) => cricketLeaderUnitId(row.name, roll) === scope);
    return scoped.slice(0, CRICKET_LEADER_DISPLAY_LIMIT);
  };
  return {
    runs: keep(leaders.runs),
    wickets: keep(leaders.wickets),
    catches: keep(leaders.catches),
    highest: keep(leaders.highest),
    runOuts: keep(leaders.runOuts),
    sixes: keep(leaders.sixes),
    fours: keep(leaders.fours),
  };
}

/** Percentage = (runs for ÷ runs against) × 100 — same shape as Aussie footy %. */
export function ladderPercentage(row: Pick<CricketRow, "runsFor" | "runsAgainst">) {
  if (row.runsAgainst > 0) {
    return Math.round((row.runsFor / row.runsAgainst) * 1000) / 10;
  }
  // Batted without conceding yet — leave blank rather than inventing ∞.
  return null;
}

/** Fold innings totals from the draw into ladder RF / RA when Jimmy omits them. */
export function enrichLadderRunsFromDraw(ladder: CricketRow[], draw: CricketFixture[]): CricketRow[] {
  const deltas = new Map<string, { runsFor: number; runsAgainst: number }>();
  const bump = (team: string, runsFor: number, runsAgainst: number) => {
    const key = team.replace(/\s+/g, " ").trim().toLowerCase();
    if (!key || (!runsFor && !runsAgainst)) return;
    const current = deltas.get(key) ?? { runsFor: 0, runsAgainst: 0 };
    current.runsFor += runsFor;
    current.runsAgainst += runsAgainst;
    deltas.set(key, current);
  };

  for (const game of draw) {
    const home = game.home.replace(/\s+/g, " ").trim();
    const away = game.away.replace(/\s+/g, " ").trim();
    let homeScore = game.homeScore ?? 0;
    let awayScore = game.awayScore ?? 0;
    if ((!homeScore && !awayScore) && game.result) {
      const parsed = parseResultScores(game.result, home, away);
      if (parsed) {
        homeScore = parsed.homeScore;
        awayScore = parsed.awayScore;
      }
    }
    if (!homeScore && !awayScore) continue;
    if (home && away) {
      bump(home, homeScore, awayScore);
      bump(away, awayScore, homeScore);
    }
  }

  if (deltas.size === 0) {
    return ladder.map((row) => ({
      ...row,
      percentage: ladderPercentage(row),
    }));
  }

  return ladder.map((row) => {
    const key = row.team.replace(/\s+/g, " ").trim().toLowerCase();
    const delta = deltas.get(key);
    const runsFor = row.runsFor > 0 ? row.runsFor : (delta?.runsFor ?? 0);
    const runsAgainst = row.runsAgainst > 0 ? row.runsAgainst : (delta?.runsAgainst ?? 0);
    const next = { ...row, runsFor, runsAgainst };
    return { ...next, percentage: ladderPercentage(next) };
  });
}

/** Parse “Home 85 def Away 76” / “85–76” style result lines when present. */
export function parseResultScores(
  result: string,
  home: string,
  away: string,
): { homeScore: number; awayScore: number } | null {
  const cleaned = result.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;

  const named = cleaned.match(
    /^(.+?)\s+(\d{1,3})\s+(?:def(?:eated)?|beat|defeated)\s+(.+?)\s+(\d{1,3})$/i,
  );
  if (named) {
    const left = named[1]!.trim().toLowerCase();
    const right = named[3]!.trim().toLowerCase();
    const leftScore = Number(named[2]);
    const rightScore = Number(named[4]);
    if (!Number.isFinite(leftScore) || !Number.isFinite(rightScore)) return null;
    if (left === home.toLowerCase() && right === away.toLowerCase()) {
      return { homeScore: leftScore, awayScore: rightScore };
    }
    if (left === away.toLowerCase() && right === home.toLowerCase()) {
      return { homeScore: rightScore, awayScore: leftScore };
    }
  }

  const pair = cleaned.match(/\b(\d{1,3})\s*[–—-]\s*(\d{1,3})\b/);
  if (pair && home && away) {
    const first = Number(pair[1]);
    const second = Number(pair[2]);
    if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
    // Convention: home–away when both names appear earlier in the line.
    return { homeScore: first, awayScore: second };
  }

  return null;
}

export function formatLadderPercentage(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function fixtureIsFinished(result: string) {
  const value = result.trim().toLowerCase();
  if (!value) return false;
  if (value === "under way" || value === "underway" || value === "still to play") return false;
  return true;
}

function fixtureFinished(result: string) {
  return fixtureIsFinished(result);
}

function fixtureLooksLive(result: string) {
  const value = result.replace(/\s+/g, " ").trim().toLowerCase();
  return value === "under way" || value === "underway";
}

/** True when Jimmy is actively scoring (live totals present), not a stuck empty "Under way". */
export function fixtureIsLiveScoring(game: CricketFixture) {
  if (!fixtureLooksLive(game.result)) return false;
  return game.homeScore != null || game.awayScore != null;
}

function pickNextCandidate(
  draw: CricketFixture[],
  fromIndex: number,
  preferFresh: boolean,
): CricketFixture | null {
  // After a finished result, prefer a blank upcoming fixture over a stuck empty "Under way"
  // so a manually chosen next game on Jimmy wins over an abandoned early start.
  // Real live scoring (Under way + scores) still wins so the kiosk tracks the match.
  let liveFallback: CricketFixture | null = null;
  for (let index = Math.max(0, fromIndex); index < draw.length; index += 1) {
    const game = draw[index]!;
    if (fixtureFinished(game.result)) continue;
    if (fixtureIsLiveScoring(game)) return game;
    if (preferFresh && fixtureLooksLive(game.result)) {
      liveFallback ??= game;
      continue;
    }
    return game;
  }
  return liveFallback;
}

/** Active live match Jimmy is scoring right now, if any. */
export function pickLiveGame(draw: CricketFixture[]): CricketFixture | null {
  let found: CricketFixture | null = null;
  for (const game of draw) {
    if (!fixtureIsLiveScoring(game)) continue;
    found = game;
  }
  return found;
}

export function pickLastAndNext(draw: CricketFixture[]): {
  lastGame: CricketFixture | null;
  nextGame: CricketFixture | null;
  liveGame: CricketFixture | null;
} {
  let lastGame: CricketFixture | null = null;
  let lastFinishedIndex = -1;
  for (let index = 0; index < draw.length; index += 1) {
    const game = draw[index]!;
    if (!fixtureFinished(game.result)) continue;
    lastGame = game;
    lastFinishedIndex = index;
  }

  // First unfinished fixture AFTER the last finished game. Starting after the last
  // result skips a stuck early "Under way" that would otherwise hide both last + next.
  const preferFresh = lastFinishedIndex >= 0;
  let nextGame = pickNextCandidate(draw, lastFinishedIndex + 1, preferFresh);

  if (!nextGame) {
    nextGame = pickNextCandidate(draw, 0, false);
  }

  return { lastGame, nextGame, liveGame: pickLiveGame(draw) };
}

function fixtureLine(game: CricketFixture) {
  if (game.away) return `${game.home} vs ${game.away}`;
  return game.home;
}

export function cricketMatchTitle(game: CricketFixture) {
  return fixtureLine(game);
}

export function parseCricketSnapshot(raw: unknown, preview = false): CricketSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const ladderRaw = Array.isArray(record.ladder) ? record.ladder : [];
  const drawRaw = Array.isArray(record.draw)
    ? record.draw
    : Array.isArray(record.fixtures)
      ? record.fixtures
      : [];
  const statsRaw = Array.isArray(record.stats) ? record.stats : [];
  const leadersRaw =
    record.leaders && typeof record.leaders === "object"
      ? (record.leaders as Record<string, unknown>)
      : null;
  const school = parseJimmySchool(record.school);
  const ladder = ladderRaw.slice(0, 16).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const team = text(row.team ?? row.name, 40);
    if (!team) return [];
    const played = count(row.played ?? row.p);
    const won = count(row.won ?? row.w);
    const lost = count(row.lost ?? row.l);
    const points = count(row.points ?? row.pts);
    const runsFor = count(row.runsFor ?? row.for ?? row.rf ?? row.scored);
    const runsAgainst = count(row.runsAgainst ?? row.against ?? row.ra ?? row.conceded);
    const percentage = ladderPercentage({ runsFor, runsAgainst });
    return [
      {
        team,
        played,
        won,
        lost,
        points,
        runsFor,
        runsAgainst,
        percentage,
      },
    ];
  });
  let draw = drawRaw.slice(0, 24).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const home = text(row.home, 80);
    const away = text(row.away, 80);
    if (!home && !away) return [];
    const homeScore = count(row.homeScore ?? row.homeRuns ?? row.hs);
    const awayScore = count(row.awayScore ?? row.awayRuns ?? row.as);
    return [
      {
        when: text(row.when ?? row.date, 80),
        home,
        away,
        ground: text(row.ground ?? row.venue, 80),
        result: text(row.result, 80),
        ...(homeScore || awayScore ? { homeScore, awayScore } : {}),
      },
    ];
  });
  draw = enrichDrawScoresFromJimmySchool(draw, school);
  const stats = statsRaw.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = text(row.label, 40);
    const value = text(row.value, 40);
    if (!label || !value) return [];
    return [{ label, value }];
  });
  const teamsRaw = Array.isArray(record.teams) ? record.teams : [];
  const teams = teamsRaw.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = text(row.name ?? row.team, 40);
    if (!name) return [];
    const players = Array.isArray(row.players)
      ? row.players
          .flatMap((player) => {
            if (typeof player === "string") {
              const value = player.replace(/\s+/g, " ").trim().slice(0, 40);
              return value ? [value] : [];
            }
            if (player && typeof player === "object") {
              const value = text((player as { name?: unknown }).name, 40);
              return value ? [value] : [];
            }
            return [];
          })
          .slice(0, 24)
      : [];
    return [{ name, players }];
  });
  if (ladder.length === 0 && draw.length === 0 && teams.length === 0) return null;
  const fromApi: CricketLeaders = {
    runs: parseLeadersList(leadersRaw?.runs ?? leadersRaw?.mostRuns),
    wickets: parseLeadersList(leadersRaw?.wickets ?? leadersRaw?.mostWickets),
    catches: parseLeadersList(leadersRaw?.catches ?? leadersRaw?.mostCatches),
    highest: parseLeadersList(leadersRaw?.highest ?? leadersRaw?.highestScore),
    runOuts: parseLeadersList(leadersRaw?.runOuts ?? leadersRaw?.mostRunOuts),
    sixes: parseLeadersList(leadersRaw?.sixes ?? leadersRaw?.mostSixes),
    fours: parseLeadersList(leadersRaw?.fours ?? leadersRaw?.mostFours),
  };
  const fromSchool = leadersFromJimmySchool(school);
  const leaders = mergeLeaders(
    mergeLeaders(fromApi, fromSchool ?? emptyLeaders()),
    leadersFromStats(stats),
  );
  const ladderWithRuns = enrichLadderFromJimmySchool(enrichLadderRunsFromDraw(ladder, draw), school);
  const { lastGame, nextGame, liveGame } = pickLastAndNext(draw);
  const updatedAtRaw = record.updatedAt;
  const updated =
    typeof updatedAtRaw === "number" && Number.isFinite(updatedAtRaw)
      ? new Date(updatedAtRaw).toISOString()
      : text(updatedAtRaw, 40);
  return {
    title: text(record.title, 60) || "School cricket",
    updatedAt: updated || null,
    stats,
    ladder: ladderWithRuns,
    draw,
    leaders,
    teams,
    lastGame,
    nextGame,
    liveGame,
    preview,
  };
}

export function blockedShareHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return true;
  const parts = host.split(".").map((part) => Number(part));
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) return true;
  return false;
}

export const JIMMY_CRICKET_BOARD = "https://jimmyscricket.vercel.app/api/board";

export function shareUrlForCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed || trimmed.toLowerCase() === "preview") return null;
  if (trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      if (url.username || url.password || url.protocol !== "https:" || blockedShareHost(url.hostname)) {
        return null;
      }
      return url.toString();
    } catch {
      return null;
    }
  }
  if (!/^[a-zA-Z0-9_-]{4,40}$/.test(trimmed)) return null;
  return `${JIMMY_CRICKET_BOARD}/${encodeURIComponent(trimmed)}`;
}
