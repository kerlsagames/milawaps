export type NewsReminder = { id: string; text: string };
export type NewsUpcoming = {
  id: string;
  /** Calendar day `YYYY-MM-DD` (school-local). Null = undated legacy row. */
  on: string | null;
  /** Legacy free-text when label; unused when `on` is set. */
  when: string;
  text: string;
};

export type DailyNews = {
  headline: string;
  blurb: string;
  /** Optional yard challenge of the day / week, e.g. "Find the hidden duck — 2+ points". */
  challenge: string;
  reminders: NewsReminder[];
  upcoming: NewsUpcoming[];
  picture: string | null;
  updatedAt: number;
};

const SCHOOL_TZ = "Australia/Sydney";

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Today as `YYYY-MM-DD` in the school timezone. */
export function schoolTodayYmd(now = Date.now(), timeZone = SCHOOL_TZ) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

/** Accept only a real calendar day string. */
export function parseUpcomingOn(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return trimmed;
}

/** Drop past days, keep today+, sort soonest first; undated legacy rows last. */
export function activeUpcoming(list: NewsUpcoming[], now = Date.now()): NewsUpcoming[] {
  const today = schoolTodayYmd(now);
  return list
    .filter((item) => !item.on || item.on >= today)
    .sort((left, right) => {
      if (left.on && right.on) return left.on.localeCompare(right.on);
      if (left.on) return -1;
      if (right.on) return 1;
      return 0;
    });
}

/** TV / board label for a coming-up row. */
export function formatUpcomingLabel(item: NewsUpcoming) {
  if (item.on) {
    return new Intl.DateTimeFormat("en-AU", {
      timeZone: "UTC",
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(`${item.on}T12:00:00.000Z`));
  }
  return item.when.trim();
}

export function emptyNews(now = Date.now()): DailyNews {
  return {
    headline: "Daily News",
    blurb: "",
    challenge: "",
    reminders: [],
    upcoming: [],
    picture: null,
    updatedAt: now,
  };
}

function migrateHeadline(value: string, fallback: string) {
  if (!value || value === "Today at Milawa") return fallback;
  return value;
}

function migrateBlurb(value: string) {
  if (value === "Check the board for reminders and what is coming up.") return "";
  return value;
}

export function sanitizeNews(raw: unknown, now = Date.now()): DailyNews {
  const base = emptyNews(now);
  if (!raw || typeof raw !== "object") return base;
  const record = raw as Partial<DailyNews>;
  const remindersRaw = Array.isArray(record.reminders) ? record.reminders : [];
  const upcomingRaw = Array.isArray(record.upcoming) ? record.upcoming : [];
  const reminders = remindersRaw.slice(0, 8).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<NewsReminder>;
    const line = text(row.text, 120);
    if (!line) return [];
    return [{ id: text(row.id, 40) || `reminder-${index}`, text: line }];
  });
  const upcoming = activeUpcoming(
    upcomingRaw.slice(0, 8).flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<NewsUpcoming> & { on?: unknown };
      const line = text(row.text, 120);
      if (!line) return [];
      return [
        {
          id: text(row.id, 40) || `upcoming-${index}`,
          on: parseUpcomingOn(row.on),
          when: text(row.when, 40),
          text: line,
        },
      ];
    }),
    now,
  );
  const picture =
    typeof record.picture === "string" &&
    (record.picture.startsWith("data:image/") || record.picture.startsWith("/"))
      ? record.picture.slice(0, 2_500_000)
      : null;
  return {
    headline: migrateHeadline(text(record.headline, 80), base.headline),
    blurb: migrateBlurb(text(record.blurb, 200)),
    challenge: text(record.challenge, 160),
    reminders,
    upcoming,
    picture,
    updatedAt:
      typeof record.updatedAt === "number" && Number.isFinite(record.updatedAt)
        ? record.updatedAt
        : now,
  };
}

export function newsFromInput(raw: unknown, now = Date.now()): DailyNews {
  const cleaned = sanitizeNews(raw, now);
  if (!raw || typeof raw !== "object") return cleaned;
  const record = raw as Record<string, unknown>;
  const remindersIn = Array.isArray(record.reminders) ? record.reminders : cleaned.reminders;
  const upcomingIn = Array.isArray(record.upcoming) ? record.upcoming : cleaned.upcoming;
  return sanitizeNews(
    {
      ...cleaned,
      reminders: remindersIn.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Partial<NewsReminder>;
        return { id: row.id || nextId("reminder"), text: row.text ?? "" };
      }),
      upcoming: upcomingIn.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Partial<NewsUpcoming> & { on?: unknown };
        return {
          id: row.id || nextId("upcoming"),
          on: parseUpcomingOn(row.on),
          when: row.when ?? "",
          text: row.text ?? "",
        };
      }),
      updatedAt: now,
    },
    now,
  );
}
