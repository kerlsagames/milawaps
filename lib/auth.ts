import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;
const LOCAL_PIN = "2468";

export function getExpectedPin(): string | null {
  const configured = process.env.STAFF_PIN?.trim();
  if (configured) {
    if (!/^\d{4}$/.test(configured)) return null;
    return configured;
  }
  if (process.env.NODE_ENV === "production") return null;
  return LOCAL_PIN;
}

function signingKey(): string {
  return `operation-teacher-takeover:${getExpectedPin() ?? "unset"}`;
}

export function pinsMatch(input: string, expected: string): boolean {
  const left = createHmac("sha256", "ott-pin").update(input).digest();
  const right = createHmac("sha256", "ott-pin").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function signToken(now = Date.now()): { token: string; expiresAt: number } {
  const expiresAt = now + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt, v: 1 })).toString(
    "base64url",
  );
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyToken(token: string | null | undefined, now = Date.now()): boolean {
  if (!token || !getExpectedPin()) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof data.exp === "number" && data.exp > now;
  } catch {
    return false;
  }
}

export function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}
