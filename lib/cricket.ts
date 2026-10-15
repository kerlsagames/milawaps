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

export type CricketSnapshot = {
  title: string;
  updatedAt: string | null;
  stats: CricketStat[];
  ladder: CricketRow[];
  draw: CricketFixture[];
  preview: boolean;
};

export const PREVIEW_CRICKET: CricketSnapshot = {
  title: "Preview ladder",
  updatedAt: null,
  preview: true,
  stats: [
    { label: "Games", value: "3" },
    { label: "Top score", value: "48" },
    { label: "Wickets", value: "14" },
  ],
  ladder: [
    { team: "5/6", played: 2, won: 2, lost: 0, points: 4 },
    { team: "2/3/4", played: 2, won: 1, lost: 1, points: 2 },
    { team: "F/1", played: 2, won: 0, lost: 2, points: 0 },
  ],
  draw: [
    { when: "Fri 9:00", home: "F/1", away: "2/3/4", ground: "Oval", result: "2/3/4 won" },
    { when: "Fri 9:40", home: "5/6", away: "F/1", ground: "Oval", result: "Still to play" },
  ],
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
    const home = text(row.home, 40);
    const away = text(row.away, 40);
    if (!home || !away) return [];
    return [
      {
        when: text(row.when ?? row.date, 40),
        home,
        away,
        ground: text(row.ground ?? row.venue, 40),
        result: text(row.result, 40),
      },
    ];
  });
  const stats = statsRaw.slice(0, 4).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const label = text(row.label, 24);
    const value = text(row.value, 24);
    if (!label || !value) return [];
    return [{ label, value }];
  });
  if (ladder.length === 0 && draw.length === 0) return null;
  const updated = text(record.updatedAt, 40);
  return {
    title: text(record.title, 60) || "School cricket",
    updatedAt: updated || null,
    stats,
    ladder,
    draw,
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

export function shareUrlForCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed || trimmed.toLowerCase() === "preview") return null;
  if (trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      if (url.username || url.password || blockedShareHost(url.hostname)) return null;
      return url.toString();
    } catch {
      return null;
    }
  }
  if (!/^[a-zA-Z0-9_-]{4,40}$/.test(trimmed)) return null;
  const origin = process.env.CRICKET_SHARE_ORIGIN?.trim().replace(/\/$/, "");
  if (!origin || !origin.startsWith("https://")) return null;
  try {
    const url = new URL(origin);
    if (blockedShareHost(url.hostname)) return null;
    return `${origin}/api/share/${encodeURIComponent(trimmed)}`;
  } catch {
    return null;
  }
}
