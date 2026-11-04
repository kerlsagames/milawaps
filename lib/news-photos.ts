import { schoolTodayYmd } from "@/lib/news";

/**
 * Real Milawa school photos for Daily News when Settings has no custom picture.
 * From the shared Drive “Photos” folder (not AI cheer art / campus backgrounds).
 * Rotates by Sydney school day so the TV photo changes automatically.
 */
export const NEWS_GALLERY = [
  "/news/01-17.jpg",
  "/news/02-2.jpg",
  "/news/03-2025-19.jpg",
  "/news/04-2025-24.jpg",
  "/news/05-2025-26.jpg",
  "/news/06-24-sports-8.jpg",
  "/news/07-4.jpg",
  "/news/08-5.jpg",
  "/news/09-6.jpg",
  "/news/10-abbey-holmes-will-conroy-milawa-ps.jpg",
  "/news/11-book-week-5.jpg",
  "/news/12-butterflies.jpg",
  "/news/13-concert-4.jpg",
  "/news/14-hot-lunch.jpg",
  "/news/16-img_5467.jpg",
  "/news/17-new-preps-4.jpg",
  "/news/18-new-preps-5.jpg",
  "/news/19-pxl_20260422_004747179.jpg",
  "/news/20-pxl_20260422_004754004.jpg",
  "/news/21-pxl_20260422_004808134.jpg",
  "/news/22-pxl_20260422_004815394.jpg",
  "/news/23-pxl_20260422_004826486.jpg",
  "/news/24-pxl_20260515_015657546.jpg",
  "/news/25-pxl_20260515_022454699.jpg",
  "/news/26-pxl_20260515_022704014.jpg",
  "/news/27-pxl_20260515_024101686.jpg",
  "/news/28-pxl_20260515_025027963.jpg",
  "/news/29-pxl_20260813_003043962.jpg",
  "/news/30-pxl_20260813_003052377.jpg",
  "/news/31-pxl_20260813_003057307.jpg",
  "/news/32-pxl_20260813_003101867.jpg",
  "/news/33-pxl_20260813_041851461.jpg",
  "/news/34-pxl_20260821_021658669.jpg",
  "/news/35-pxl_20260821_021705818.jpg",
  "/news/36-pxl_20260821_021714548.jpg",
  "/news/37-pxl_20260821_021721067.jpg",
  "/news/38-pxl_20260821_021727369.jpg",
  "/news/39-pxl_20260821_021732681.jpg",
  "/news/40-sports-5.jpg",
  "/news/41-thumbnail_image006.jpg",
  "/news/42-week-8.jpg",
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
