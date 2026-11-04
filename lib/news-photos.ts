import { schoolTodayYmd } from "@/lib/news";

/**
 * Real Milawa campus photos for Daily News when Settings has no custom picture.
 * Sourced from the shared school Drive “Backgrounds” folder — not the AI cheer art.
 * Rotates by Sydney school day so the TV photo changes automatically.
 */
export const NEWS_GALLERY = [
  "/school/oval-goals.jpg",
  "/school/playground-1.jpg",
  "/school/playground-2.jpg",
  "/school/basketball-court.jpg",
  "/school/deck-area.jpg",
  "/school/out-front-building.jpg",
  "/school/out-front-seating.jpg",
  "/school/garden-area.jpg",
  "/school/garden-area-2.jpg",
  "/school/sandpit-and-tree.jpg",
  "/school/seating-area.jpg",
  "/school/seating-area-2.jpg",
  "/school/rebound-wall.jpg",
  "/school/library.jpg",
  "/school/grade-56-room.jpg",
  "/school/bus.jpg",
  "/school/construction-area.jpg",
] as const;

/** Pick today’s gallery photo (stable for the whole school day). */
export function newsPhotoForDay(now = Date.now()): string {
  const day = schoolTodayYmd(now);
  let hash = 0;
  for (let index = 0; index < day.length; index += 1) {
    hash = (hash * 31 + day.charCodeAt(index)) >>> 0;
  }
  return NEWS_GALLERY[hash % NEWS_GALLERY.length]!;
}

/** Soft on-screen rotate through the gallery (seconds). */
export const NEWS_PHOTO_ROTATE_SEC = 45;

export function newsPhotoAtIndex(index: number): string {
  const safe = ((index % NEWS_GALLERY.length) + NEWS_GALLERY.length) % NEWS_GALLERY.length;
  return NEWS_GALLERY[safe]!;
}
