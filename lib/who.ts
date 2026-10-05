import { isStaffId, type StaffId } from "@/lib/game";

export function staffFromToken(token: string | null): StaffId | null {
  if (!token) return null;
  const part = token.split(".")[0];
  if (!part) return null;
  try {
    const padded = part.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
    const data = JSON.parse(json) as { staff?: unknown };
    return isStaffId(data.staff) ? data.staff : null;
  } catch {
    return null;
  }
}
