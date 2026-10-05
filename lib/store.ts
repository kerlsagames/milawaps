import { promises as fs } from "fs";
import path from "path";
import { kv } from "@vercel/kv";
import {
  type ActionId,
  type PublicBoard,
  type ScoreState,
  type SecurityState,
  type StorageMode,
  type UnitId,
  emptySecurity,
  vaultTotal,
} from "@/lib/game";
import { applyAction, sanitizeScores } from "@/lib/scoring";

const SCORE_KEY = "ott:scores";
const SECURITY_KEY = "ott:security";
const FILE_PATH = path.join(process.cwd(), "data", "yard.json");

type FileBlob = {
  scores: ScoreState;
  security: SecurityState;
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

export function storageMode(): StorageMode {
  ensureKvEnv();
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) return "kv";
  return memory.__ottStorage === "memory" ? "memory" : "file";
}

function freshBlob(): FileBlob {
  return { scores: sanitizeScores(null), security: emptySecurity() };
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

async function readFileBlob(): Promise<FileBlob> {
  try {
    const text = await fs.readFile(FILE_PATH, "utf8");
    const parsed = JSON.parse(text) as Partial<FileBlob>;
    return {
      scores: sanitizeScores(parsed.scores),
      security: sanitizeSecurity(parsed.security),
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      memory.__ottStorage = "memory";
    }
    return memory.__ottBoard ?? freshBlob();
  }
}

async function writeFileBlob(blob: FileBlob) {
  try {
    await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
    const temporary = `${FILE_PATH}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(blob), "utf8");
    await fs.rename(temporary, FILE_PATH);
    memory.__ottStorage = "file";
  } catch {
    memory.__ottBoard = blob;
    memory.__ottStorage = "memory";
  }
}

async function readBlob(): Promise<FileBlob> {
  ensureKvEnv();
  if (storageMode() === "kv") {
    const [scores, security] = await Promise.all([
      kv.get<unknown>(SCORE_KEY),
      kv.get<unknown>(SECURITY_KEY),
    ]);
    return {
      scores: sanitizeScores(scores),
      security: sanitizeSecurity(security),
    };
  }
  if (memory.__ottStorage === "memory" && memory.__ottBoard) {
    return memory.__ottBoard;
  }
  return readFileBlob();
}

async function writeBlob(blob: FileBlob) {
  ensureKvEnv();
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    await Promise.all([
      kv.set(SCORE_KEY, blob.scores),
      kv.set(SECURITY_KEY, blob.security),
    ]);
    return;
  }
  await writeFileBlob(blob);
}

export function toPublic(state: ScoreState): PublicBoard {
  return {
    units: state.units,
    updatedAt: state.updatedAt,
    lastAction: state.lastAction,
    vault: vaultTotal(state.units),
    storage: storageMode(),
  };
}

export function readBoard(): Promise<PublicBoard> {
  return serialized(async () => toPublic((await readBlob()).scores));
}

export function readSecurity(): Promise<SecurityState> {
  return serialized(async () => (await readBlob()).security);
}

export function writeSecurity(security: SecurityState): Promise<void> {
  return serialized(async () => {
    const blob = await readBlob();
    await writeBlob({ ...blob, security });
  });
}

export function commitAction(
  action: ActionId,
  unitId?: UnitId,
): Promise<{ board: PublicBoard; events: ReturnType<typeof applyAction>["events"] }> {
  return serialized(async () => {
    const blob = await readBlob();
    const result = applyAction(blob.scores, action, unitId);
    await writeBlob({ ...blob, scores: result.state });
    return { board: toPublic(result.state), events: result.events };
  });
}
