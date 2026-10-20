export type CricketStat = { label: string; value: string };
export type CricketRow = {
  team: string;
  played: number;
  won: number;
  lost: number;
  points: number;
};
export type CricketFixture = {
  when: string;
  home: string;
  away: string;
  ground: string;
  result: string;
};
export type CricketLeader = { name: string; value: string };
export type CricketLeaders = {
  runs: CricketLeader[];
  wickets: CricketLeader[];
  catches: CricketLeader[];
  highest: CricketLeader[];
};

export type CricketSnapshot = {
  title: string;
  updatedAt: string | null;
  stats: CricketStat[];
  ladder: CricketRow[];
  draw: CricketFixture[];
  leaders: CricketLeaders;
  lastGame: CricketFixture | null;
  nextGame: CricketFixture | null;
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
    { team: "5/6", played: 2, won: 2, lost: 0, points: 4 },
    { team: "2/3/4", played: 2, won: 1, lost: 1, points: 2 },
    { team: "F/1", played: 2, won: 0, lost: 2, points: 0 },
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
  },
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

function parseLeadersList(raw: unknown): CricketLeader[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const name = text(row.name ?? row.player ?? row.label, 40);
    const value = text(row.value ?? row.score ?? row.total, 20);
    if (!name || !value) return [];
    return [{ name, value }];
  });
}

/** Turn "Ryan 34" / "Riley · 6" into a one-row leader list. */
function leaderFromStat(value: string): CricketLeader[] {
  const cleaned = value.replace(/\s*[·•|-]\s*/g, " ").trim();
  const match = cleaned.match(/^(.+?)\s+(\d[\d]*)$/);
  if (!match) return value ? [{ name: value, value: "" }] : [];
  return [{ name: match[1]!.trim(), value: match[2]! }];
}

function emptyLeaders(): CricketLeaders {
  return { runs: [], wickets: [], catches: [], highest: [] };
}

function leadersFromStats(stats: CricketStat[]): CricketLeaders {
  const leaders = emptyLeaders();
  for (const stat of stats) {
    const label = stat.label.toLowerCase();
    const row = leaderFromStat(stat.value);
    if (!row.length) continue;
    if (label.includes("most runs") || label === "runs") leaders.runs = row;
    else if (label.includes("most wicket") || label === "wickets") leaders.wickets = row;
    else if (label.includes("most catch") || label === "catches") leaders.catches = row;
    else if (label.includes("highest") || label.includes("top score")) leaders.highest = row;
  }
  return leaders;
}

function mergeLeaders(fromApi: CricketLeaders, fromStats: CricketLeaders): CricketLeaders {
  return {
    runs: fromApi.runs.length ? fromApi.runs : fromStats.runs,
    wickets: fromApi.wickets.length ? fromApi.wickets : fromStats.wickets,
    catches: fromApi.catches.length ? fromApi.catches : fromStats.catches,
    highest: fromApi.highest.length ? fromApi.highest : fromStats.highest,
  };
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

function fixtureLive(result: string) {
  const value = result.trim().toLowerCase();
  return value === "under way" || value === "underway";
}

export function pickLastAndNext(draw: CricketFixture[]): {
  lastGame: CricketFixture | null;
  nextGame: CricketFixture | null;
} {
  let lastGame: CricketFixture | null = null;
  let nextGame: CricketFixture | null = null;
  for (const game of draw) {
    if (fixtureFinished(game.result)) {
      lastGame = game;
      continue;
    }
    if (!nextGame) {
      nextGame = game;
      // Prefer a live game as "next" headline, then the first unfinished.
      if (fixtureLive(game.result)) break;
    }
  }
  return { lastGame, nextGame };
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
  const ladder = ladderRaw.slice(0, 16).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const team = text(row.team ?? row.name, 40);
    if (!team) return [];
    return [
      {
        team,
        played: count(row.played ?? row.p),
        won: count(row.won ?? row.w),
        lost: count(row.lost ?? row.l),
        points: count(row.points ?? row.pts),
      },
    ];
  });
  const draw = drawRaw.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const home = text(row.home, 80);
    const away = text(row.away, 80);
    if (!home && !away) return [];
    return [
      {
        when: text(row.when ?? row.date, 80),
        home,
        away,
        ground: text(row.ground ?? row.venue, 80),
        result: text(row.result, 80),
      },
    ];
  });
  const stats = statsRaw.slice(0, 12).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = text(row.label, 40);
    const value = text(row.value, 40);
    if (!label || !value) return [];
    return [{ label, value }];
  });
  if (ladder.length === 0 && draw.length === 0) return null;
  const fromApi: CricketLeaders = {
    runs: parseLeadersList(leadersRaw?.runs ?? leadersRaw?.mostRuns),
    wickets: parseLeadersList(leadersRaw?.wickets ?? leadersRaw?.mostWickets),
    catches: parseLeadersList(leadersRaw?.catches ?? leadersRaw?.mostCatches),
    highest: parseLeadersList(leadersRaw?.highest ?? leadersRaw?.highestScore),
  };
  const leaders = mergeLeaders(fromApi, leadersFromStats(stats));
  const { lastGame, nextGame } = pickLastAndNext(draw);
  const updated = text(record.updatedAt, 40);
  return {
    title: text(record.title, 60) || "School cricket",
    updatedAt: updated || null,
    stats,
    ladder,
    draw,
    leaders,
    lastGame,
    nextGame,
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
