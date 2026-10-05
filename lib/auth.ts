import { createHmac, timingSafeEqual } from "crypto";
import { isStaffId, type StaffId } from "@/lib/game";

const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000;
const SCHOOL_PIN = "737373";

export function getExpectedPin(): string | null {
  const configured = process.env.STAFF_PIN?.trim();
  if (!configured) return SCHOOL_PIN;
  if (!/^\d{6}$/.test(configured)) return null;
  return configured;
}

function signingKey(): string {
  return `operation-teacher-takeover:${getExpectedPin() ?? "unset"}`;
}

export function pinsMatch(input: string, expected: string): boolean {
  const left = createHmac("sha256", "ott-pin").update(input).digest();
  const right = createHmac("sha256", "ott-pin").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function signToken(
  staffId: StaffId,
  now = Date.now(),
): { token: string; expiresAt: number; staffId: StaffId } {
  const expiresAt = now + TOKEN_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt, v: 2, staff: staffId })).toString(
    "base64url",
  );
  const signature = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, expiresAt, staffId };
}

export function verifyToken(token: string | null | undefined, now = Date.now()): StaffId | null {
  if (!token || !getExpectedPin()) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", signingKey()).update(payload).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: unknown;
      v?: unknown;
      staff?: unknown;
    };
    if (data.v !== 2 || !isStaffId(data.staff)) return null;
    if (typeof data.exp !== "number" || data.exp <= now) return null;
    return data.staff;
  } catch {
    return null;
  }
}

export function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}
