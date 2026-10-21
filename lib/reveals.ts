import { VIEWS, type ViewId } from "@/lib/game";
import { activeHighlights, highlightScreenId, type HighlightEntry } from "@/lib/highlights";

export const REVEALS = [
  {
    id: "reveal-game",
    n: 1,
    points: 20,
    title: "Game with Mr K",
    mask: "Prize 1",
    prize: "A game with Mr K",
    wide: true,
    face: "/mystery-teacher-a.png",
    image: "/reveals/game.jpg",
  },
  {
    id: "reveal-1",
    n: 2,
    points: 40,
    title: "Teacher Takedown #1",
    mask: "Takedown 1",
    prize: "Dress a teacher in clothes of your choice for a day",
    wide: false,
    face: "/mystery-teacher-a.png",
    image: "/reveals/takedown-1.jpg",
  },
  {
    id: "reveal-laser",
    n: 3,
    points: 60,
    title: "Laser Tag",
    mask: "Prize 2",
    prize: "Laser tag for your class",
    wide: true,
    face: "/mystery-teacher-b.png",
    image: "/reveals/laser.jpg",
  },
  {
    id: "reveal-2",
    n: 4,
    points: 80,
    title: "Teacher Takedown #2",
    mask: "Takedown 2",
    prize: "Whipped cream pie in a teacher's face",
    wide: false,
    face: "/mystery-teacher-b.png",
    image: "/reveals/takedown-2.jpg",
  },
] as const;

export type RevealId = (typeof REVEALS)[number]["id"];
export type RevealDef = (typeof REVEALS)[number];
export type HighlightScreenId = `highlight:${string}`;
export type FixedScreenId = ViewId | RevealId | "cricket" | "news" | "highlight" | "today";
export type ScreenId = FixedScreenId | HighlightScreenId;

export type ShownMap = Record<FixedScreenId, boolean>;

export const SCREEN_IDS: FixedScreenId[] = [
  ...VIEWS.map((view) => view.id),
  ...REVEALS.map((reveal) => reveal.id),
  "cricket",
  "news",
  "highlight",
  "today",
];

export const DEFAULT_SHOWN: ShownMap = {
  board: true,
  prizes: true,
  yard: true,
  "reveal-game": false,
  "reveal-1": false,
  "reveal-laser": false,
  "reveal-2": false,
  cricket: false,
  news: false,
  highlight: false,
  // Desk-only feed for teachers — never part of the TV loop.
  today: false,
};

export function revealById(id: string): RevealDef | null {
  return REVEALS.find((reveal) => reveal.id === id) ?? null;
}

export function revealForPoints(points: number): RevealDef | null {
  return REVEALS.find((reveal) => reveal.points === points) ?? null;
}

export function prizeIsPublic(at: number | null | undefined, now = Date.now()): boolean {
  return typeof at === "number" && now >= at;
}

export function revealLabel(reveal: RevealDef, at: number | null | undefined, now = Date.now()) {
  return prizeIsPublic(at, now) ? reveal.title : reveal.mask;
}

export function isFixedScreenId(id: string): id is FixedScreenId {
  return SCREEN_IDS.includes(id as FixedScreenId);
}

export function dwellForScreen(id: ScreenId, dwells: Record<FixedScreenId, number>) {
  if (id.startsWith("highlight:")) return dwells.highlight;
  if (isFixedScreenId(id)) return dwells[id];
  return 12;
}

export function kioskScreens(
  shown: ShownMap,
  highlights: HighlightEntry[] = [],
  now = Date.now(),
): ScreenId[] {
  const visible: ScreenId[] = SCREEN_IDS.filter(
    (id) => id !== "highlight" && id !== "today" && shown[id],
  );
  if (shown.highlight) {
    for (const entry of activeHighlights(highlights, now)) {
      visible.push(highlightScreenId(entry.id));
    }
  }
  return visible.length > 0 ? visible : ["board"];
}
