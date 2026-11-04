import { schoolTodayYmd } from "@/lib/news";

/**
 * School photos for Daily News when Settings has no custom picture.
 * Rotates by Sydney school day so the TV photo changes automatically.
 */
export const NEWS_GALLERY = [
  "/classes/f1-class-cheer.jpg",
  "/classes/f1-faces-cheer.jpg",
  "/classes/234-class-cheer.jpg",
  "/classes/234-faces-cheer.jpg",
  "/classes/56-class-cheer.jpg",
  "/classes/56-faces-cheer.jpg",
  "/milawa-yard.jpg",
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
