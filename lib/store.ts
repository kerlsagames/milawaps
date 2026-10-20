import { promises as fs } from "fs";
import path from "path";
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
  sanitizeHighlights,
  type HighlightEntry,
  type HighlightStudent,
} from "@/lib/highlights";
import { emptyNews, newsFromInput, sanitizeNews, type DailyNews } from "@/lib/news";
import { applyAction, attachReason, sanitizeScores } from "@/lib/scoring";

const SCORE_KEY = "ott:scores";
const SECURITY_KEY = "ott:security";
const NEWS_KEY = "ott:news";
const HIGHLIGHT_KEY = "ott:highlights";
const FILE_PATH = path.join(process.cwd(), "data", "yard.json");

/** Shown when Vercel has no Redis — ticks would otherwise vanish between instances. */
export const DURABLE_STORE_MESSAGE =
  "Scores need Upstash Redis on Vercel. Open the project → Storage → Create Database → Upstash Redis, connect it, then redeploy.";

type FileBlob = {
  scores: ScoreState;
  security: SecurityState;
  news: DailyNews;
  highlights: HighlightEntry[];
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

export function hasDurableStore() {
  ensureKvEnv();
  return Boolean(process.env.KV_REST_API_URL?.trim() && process.env.KV_REST_API_TOKEN?.trim());
}

function onVercel() {
  return process.env.VERCEL === "1";
}

export function storageMode(): StorageMode {
  ensureKvEnv();
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

async function readBlob(): Promise<FileBlob> {
  ensureKvEnv();
  if (hasDurableStore()) {
    const [scores, security, news, highlights] = await Promise.all([
      kv.get<unknown>(SCORE_KEY),
      kv.get<unknown>(SECURITY_KEY),
      kv.get<unknown>(NEWS_KEY),
      kv.get<unknown>(HIGHLIGHT_KEY),
    ]);
    return normalizeBlob({
      scores: scores as ScoreState,
      security: security as SecurityState,
      news: news as DailyNews,
      highlights: highlights as HighlightEntry[],
    });
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
  ensureKvEnv();
  if (hasDurableStore()) {
    await Promise.all([
      kv.set(SCORE_KEY, blob.scores),
      kv.set(SECURITY_KEY, blob.security),
      kv.set(NEWS_KEY, blob.news),
      kv.set(HIGHLIGHT_KEY, blob.highlights),
    ]);
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
    // PIN lockouts may sit in memory on Vercel; score ticks still require Redis.
    await writeBlob({ ...blob, security }, { allowEphemeral: true });
  });
}

export function commitAction(
  action: ActionId,
  unitId: UnitId | undefined,
  staffId: StaffId,
): Promise<{ board: PublicBoard; events: ReturnType<typeof applyAction>["events"] }> {
  return serialized(async () => {
    const blob = await readBlob();
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
): Promise<PublicBoard> {
  return serialized(async () => {
    const blob = await readBlob();
    const entry = createHighlight(students, reason, staffId);
    const highlights = sanitizeHighlights([entry, ...blob.highlights]);
    const next = { ...blob, highlights };
    await writeBlob(next);
    return toPublic(next);
  });
}
