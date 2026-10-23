import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { kv } from "@vercel/kv";
import {
  type ActionId,
  type PublicBoard,
  type ScoreState,
  type SecurityState,
  type StaffId,
  type StorageMode,
  type UnitId,
  emptySecurity,
  vaultTotal,
} from "@/lib/game";
import {
  createHighlight,
  highlightSpotUnits,
  removeHighlightById,
  sanitizeHighlights,
  type HighlightEntry,
  type HighlightStudent,
} from "@/lib/highlights";
import { emptyNews, newsFromInput, sanitizeNews, type DailyNews } from "@/lib/news";
import {
  adjustUnitScore,
  applyAction,
  attachReason,
  sanitizeScores,
  undoLastTick,
  undoLogEntryById,
} from "@/lib/scoring";
import {
  emptySiteDisplay,
  sanitizeSiteDisplay,
  siteDisplayFromInput,
  type SiteDisplay,
} from "@/lib/site-display";

const SCORE_KEY = "ott:scores";
const SECURITY_KEY = "ott:security";
const NEWS_KEY = "ott:news";
const HIGHLIGHT_KEY = "ott:highlights";
const DISPLAY_KEY = "ott:display";
const BLOB_BOARD_PATH = "yard/board.json";
const FILE_PATH = path.join(process.cwd(), "data", "yard.json");

/** Shown when Vercel has no durable store — ticks would otherwise vanish between instances. */
export const DURABLE_STORE_MESSAGE =
  "Scores need a durable store on Vercel. Connect Blob or Upstash Redis in the project Storage tab, then redeploy.";

type FileBlob = {
  scores: ScoreState;
  security: SecurityState;
  news: DailyNews;
  highlights: HighlightEntry[];
  display: SiteDisplay;
};

type MemoryGlobal = typeof globalThis & {
  __ottBoard?: FileBlob;
  __ottStorage?: StorageMode;
};

const memory = globalThis as MemoryGlobal;

let chain: Promise<unknown> = Promise.resolve();

function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function ensureKvEnv() {
  if (!process.env.KV_REST_API_URL && process.env.UPSTASH_REDIS_REST_URL) {
    process.env.KV_REST_API_URL = process.env.UPSTASH_REDIS_REST_URL;
  }
  if (!process.env.KV_REST_API_TOKEN && process.env.UPSTASH_REDIS_REST_TOKEN) {
    process.env.KV_REST_API_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
  }
}

function hasRedisStore() {
  ensureKvEnv();
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

function hasBlobStore() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() || process.env.BLOB_STORE_ID?.trim(),
  );
}

export function hasDurableStore() {
  return hasRedisStore() || hasBlobStore();
}

function onVercel() {
  return process.env.VERCEL === "1";
}

export function storageMode(): StorageMode {
  // Report "kv" for any durable remote store so the desk shows "Scores are saving".
  if (hasDurableStore()) return "kv";
  // The serverless filesystem is not shared across instances — never call that "file".
  if (onVercel()) return "memory";
  return memory.__ottStorage === "memory" ? "memory" : "file";
}

function freshBlob(): FileBlob {
  return {
    scores: sanitizeScores(null),
    security: emptySecurity(),
    news: emptyNews(),
    highlights: [],
    display: emptySiteDisplay(),
  };
}

function sanitizeSecurity(raw: unknown): SecurityState {
  if (!raw || typeof raw !== "object") return emptySecurity();
  const record = raw as Partial<SecurityState>;
  return {
    fails:
      typeof record.fails === "number" && record.fails > 0
        ? Math.min(10, Math.floor(record.fails))
        : 0,
    lockedUntil:
      typeof record.lockedUntil === "number" && record.lockedUntil > 0
        ? record.lockedUntil
        : 0,
  };
}

function normalizeBlob(raw: Partial<FileBlob> | null | undefined): FileBlob {
  return {
    scores: sanitizeScores(raw?.scores),
    security: sanitizeSecurity(raw?.security),
    news: sanitizeNews(raw?.news),
    highlights: sanitizeHighlights(raw?.highlights),
    display: sanitizeSiteDisplay(raw?.display),
  };
}

async function readFileBlob(): Promise<FileBlob> {
  try {
    const text = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(text) as Partial<FileBlob>;
    memory.__ottStorage = "file";
    return normalizeBlob(parsed);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      memory.__ottStorage = "memory";
    }
    if (!memory.__ottBoard) memory.__ottBoard = freshBlob();
    return memory.__ottBoard;
  }
}

async function writeFileBlob(blob: FileBlob) {
  try {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    const temporary = `${FILE_PATH}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(blob), "utf8");
    await fs.rename(temporary, FILE_PATH);
    memory.__ottBoard = blob;
    memory.__ottStorage = "file";
  } catch {
    memory.__ottBoard = blob;
    memory.__ottStorage = "memory";
  }
}

async function readVercelBlob(): Promise<FileBlob> {
  const result = await get(BLOB_BOARD_PATH, {
    access: "private",
    useCache: false,
  });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return freshBlob();
  }
  const text = await new Response(result.stream).text();
  if (!text.trim()) return freshBlob();
  return normalizeBlob(JSON.parse(text) as Partial<FileBlob>);
}

async function writeVercelBlob(blob: FileBlob) {
  await put(BLOB_BOARD_PATH, JSON.stringify(blob), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

async function readKvBlob(): Promise<FileBlob> {
  const [scores, security, news, highlights, display] = await Promise.all([
    kv.get<unknown>(SCORE_KEY),
    kv.get<unknown>(SECURITY_KEY),
    kv.get<unknown>(NEWS_KEY),
    kv.get<unknown>(HIGHLIGHT_KEY),
    kv.get<unknown>(DISPLAY_KEY),
  ]);
  return normalizeBlob({
    scores: scores as ScoreState,
    security: security as SecurityState,
    news: news as DailyNews,
    highlights: highlights as HighlightEntry[],
    display: display as SiteDisplay,
  });
}

async function writeKvBlob(blob: FileBlob) {
  await Promise.all([
    kv.set(SCORE_KEY, blob.scores),
    kv.set(SECURITY_KEY, blob.security),
    kv.set(NEWS_KEY, blob.news),
    kv.set(HIGHLIGHT_KEY, blob.highlights),
    kv.set(DISPLAY_KEY, blob.display),
  ]);
}

async function readBlob(): Promise<FileBlob> {
  if (hasRedisStore()) {
    return readKvBlob();
  }
  if (hasBlobStore()) {
    return readVercelBlob();
  }
  if (onVercel()) {
    memory.__ottStorage = "memory";
    if (!memory.__ottBoard) memory.__ottBoard = freshBlob();
    return memory.__ottBoard;
  }
  if (memory.__ottStorage === "memory" && memory.__ottBoard) {
    return memory.__ottBoard;
  }
  return readFileBlob();
}

async function writeBlob(blob: FileBlob, opts?: { allowEphemeral?: boolean }) {
  if (hasRedisStore()) {
    await writeKvBlob(blob);
    return;
  }
  if (hasBlobStore()) {
    await writeVercelBlob(blob);
    return;
  }
  if (onVercel()) {
    if (!opts?.allowEphemeral) {
      // Refuse silent memory saves — the next server instance would show zero again.
      throw new Error(DURABLE_STORE_MESSAGE);
    }
    memory.__ottBoard = blob;
    memory.__ottStorage = "memory";
    return;
  }
  await writeFileBlob(blob);
}

export function toPublic(blob: FileBlob): PublicBoard {
  const display = sanitizeSiteDisplay(blob.display);
  return {
    units: blob.scores.units,
    updatedAt: blob.scores.updatedAt,
    lastAction: blob.scores.lastAction,
    log: blob.scores.log ?? [],
    reasons: blob.scores.reasons ?? [],
    crosses: blob.scores.crosses ?? { f1: 0, "234": 0, "56": 0 },
    vault: vaultTotal(blob.scores.units),
    storage: storageMode(),
    news: blob.news,
    highlights: sanitizeHighlights(blob.highlights),
    shown: display.shown,
    cricketCode: display.cricketCode,
    displayUpdatedAt: display.updatedAt,
    newsLayout: display.newsLayout,
    cricketPanels: display.cricketPanels,
    finishAt: display.finishAt,
    dwells: display.dwells,
    reveals: display.reveals,
  };
}

export function readBoard(): Promise<PublicBoard> {
  return serialized(async () => toPublic(await readBlob()));
}

export function readSecurity(): Promise<SecurityState> {
  return serialized(async () => (await readBlob()).security);
}

export function writeSecurity(security: SecurityState): Promise<void> {
  return serialized(async () => {
    const blob = await readBlob();
    // PIN lockouts may sit in memory on Vercel; score ticks still require durable storage.
    await writeBlob({ ...blob, security }, { allowEphemeral: true });
  });
}

export function commitAction(
  action: ActionId,
  unitId: UnitId | undefined,
  staffId: StaffId,
  options?: { logId?: string; delta?: number },
): Promise<{ board: PublicBoard; events: ReturnType<typeof applyAction>["events"] }> {
  return serialized(async () => {
    const blob = await readBlob();
    if (action === "undo") {
      const scores = options?.logId
        ? undoLogEntryById(blob.scores, options.logId)
        : undoLastTick(blob.scores);
      const next = { ...blob, scores };
      await writeBlob(next);
      return { board: toPublic(next), events: [] };
    }
    if (action === "adjust") {
      if (!unitId) throw new Error("Choose F/1, 2/3/4, or 5/6.");
      const delta = options?.delta;
      if (delta !== 1 && delta !== -1) throw new Error("Adjust by one point at a time.");
      const result = adjustUnitScore(blob.scores, unitId, delta, staffId);
      const next = { ...blob, scores: result.state };
      await writeBlob(next);
      return { board: toPublic(next), events: result.events };
    }
    const result = applyAction(blob.scores, action, unitId, staffId);
    const next = { ...blob, scores: result.state };
    await writeBlob(next);
    return { board: toPublic(next), events: result.events };
  });
}

export function commitReason(
  id: string,
  reason: string,
  staffId: StaffId,
): Promise<PublicBoard> {
  return serialized(async () => {
    const blob = await readBlob();
    const next = { ...blob, scores: attachReason(blob.scores, id, staffId, reason) };
    await writeBlob(next);
    return toPublic(next);
  });
}

export function commitNews(raw: unknown): Promise<PublicBoard> {
  return serialized(async () => {
    const blob = await readBlob();
    const next = { ...blob, news: newsFromInput(raw) };
    await writeBlob(next);
    return toPublic(next);
  });
}

export function commitHighlight(
  students: HighlightStudent[],
  reason: string,
  staffId: StaffId,
  points?: number,
): Promise<{ board: PublicBoard; events: ReturnType<typeof applyAction>["events"] }> {
  return serialized(async () => {
    const blob = await readBlob();
    const entry = createHighlight(students, reason, staffId, Date.now(), points);
    const highlights = sanitizeHighlights([entry, ...blob.highlights]);
    // Award the teacher-chosen point total (0–3), distributed round-robin by class.
    const unitIds = highlightSpotUnits(entry.students, entry.points);
    let scores = blob.scores;
    const events: ReturnType<typeof applyAction>["events"] = [];
    let tick = Date.now();
    for (const unitId of unitIds) {
      const result = applyAction(scores, "spot", unitId, staffId, tick);
      scores = result.state;
      events.push(...result.events);
      const logId = scores.log[0]?.id;
      if (logId) {
        try {
          scores = attachReason(scores, logId, staffId, reason, tick);
        } catch {
          // Highlight reason may be longer than a tick reason; points still land.
        }
      }
      tick += 1;
    }
    const next = { ...blob, highlights, scores };
    await writeBlob(next);
    return { board: toPublic(next), events };
  });
}

export function removeHighlight(id: string): Promise<PublicBoard> {
  return serialized(async () => {
    const blob = await readBlob();
    const highlights = removeHighlightById(blob.highlights, id);
    if (!highlights) throw new Error("That highlight is already gone.");
    const next = { ...blob, highlights };
    await writeBlob(next);
    return toPublic(next);
  });
}

export function commitDisplay(raw: unknown): Promise<PublicBoard> {
  return serialized(async () => {
    const blob = await readBlob();
    const display = siteDisplayFromInput(raw, sanitizeSiteDisplay(blob.display));
    const next = { ...blob, display };
    await writeBlob(next);
    return toPublic(next);
  });
}
