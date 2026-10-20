import assert from "node:assert/strict";
import { hasDurableStore, storageMode } from "../lib/store";

function setEnv(env: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

const snapshot = {
  VERCEL: process.env.VERCEL,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};

try {
  setEnv({
    VERCEL: "1",
    KV_REST_API_URL: undefined,
    KV_REST_API_TOKEN: undefined,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  });
  assert.equal(hasDurableStore(), false);
  assert.equal(storageMode(), "memory");

  setEnv({
    VERCEL: undefined,
    KV_REST_API_URL: undefined,
    KV_REST_API_TOKEN: undefined,
    UPSTASH_REDIS_REST_URL: undefined,
    UPSTASH_REDIS_REST_TOKEN: undefined,
  });
  assert.equal(storageMode(), "file");

  setEnv({
    VERCEL: "1",
    KV_REST_API_URL: "https://example.upstash.io",
    KV_REST_API_TOKEN: "test-token",
  });
  assert.equal(hasDurableStore(), true);
  assert.equal(storageMode(), "kv");

  setEnv({
    VERCEL: "1",
    KV_REST_API_URL: undefined,
    KV_REST_API_TOKEN: undefined,
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "upstash-token",
  });
  assert.equal(hasDurableStore(), true);
  assert.equal(storageMode(), "kv");

  console.log("store mode checks passed");
} finally {
  setEnv(snapshot);
}
