import {
  ACTION_COPY,
  kidName,
  unitById,
  type ScoreLogEntry,
} from "@/lib/game";

export function melbourneDateKey(at: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}

function pointPhrase(delta: number) {
  const amount = Math.abs(delta);
  const word = amount === 1 ? "point" : "points";
  return `${delta < 0 ? "−" : "+"}${amount} ${word}`;
}

export function tickerLine(entry: ScoreLogEntry): string | null {
  if (entry.action === "reset" || entry.action === "undo") return null;
  if (!(entry.action in ACTION_COPY)) return null;
  const who = kidName(entry.staffId);
  const phrase = pointPhrase(ACTION_COPY[entry.action as keyof typeof ACTION_COPY].delta);
  const reason = entry.reason?.trim();
  if (entry.unitId === "all") {
    return reason
      ? `Every class ${phrase} from ${who} for ${reason}`
      : `${who} has just given every class ${phrase}`;
  }
  const code = unitById(entry.unitId).code;
  return reason
    ? `${code} ${phrase} from ${who} for ${reason}`
    : `${who} has just given ${code} ${phrase}`;
}

export function todayTickerLines(log: ScoreLogEntry[], now = Date.now()) {
  const today = melbourneDateKey(now);
  const lines: string[] = [];
  for (const entry of log) {
    if (melbourneDateKey(entry.at) !== today) continue;
    const line = tickerLine(entry);
    if (line) lines.push(line);
  }
  return lines;
}
