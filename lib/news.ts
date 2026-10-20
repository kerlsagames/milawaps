export type NewsReminder = { id: string; text: string };
export type NewsUpcoming = { id: string; when: string; text: string };

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

function text(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyNews(now = Date.now()): DailyNews {
  return {
    headline: "Today at Milawa",
    blurb: "Check the board for reminders and what is coming up.",
    challenge: "",
    reminders: [],
    upcoming: [],
    picture: null,
    updatedAt: now,
  };
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
  const upcoming = upcomingRaw.slice(0, 8).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Partial<NewsUpcoming>;
    const line = text(row.text, 120);
    if (!line) return [];
    return [
      {
        id: text(row.id, 40) || `upcoming-${index}`,
        when: text(row.when, 40),
        text: line,
      },
    ];
  });
  const picture =
    typeof record.picture === "string" &&
    (record.picture.startsWith("data:image/") || record.picture.startsWith("/"))
      ? record.picture.slice(0, 2_500_000)
      : null;
  return {
    headline: text(record.headline, 80) || base.headline,
    blurb: text(record.blurb, 200) || base.blurb,
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
        const row = item as Partial<NewsUpcoming>;
        return { id: row.id || nextId("upcoming"), when: row.when ?? "", text: row.text ?? "" };
      }),
      updatedAt: now,
    },
    now,
  );
}
