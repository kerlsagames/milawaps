import { VIEWS, type ViewId } from "@/lib/game";

export const REVEALS = [
  {
    id: "reveal-game",
    n: 1,
    points: 10,
    title: "Game with Mr K",
    prize: "A game with Mr K",
    wide: true,
    face: "/mystery-teacher-a.jpg",
    image: "/reveals/game.jpg",
  },
  {
    id: "reveal-1",
    n: 2,
    points: 20,
    title: "Teacher Takedown #1",
    prize: "Dress a teacher in clothes of your choice for a day",
    wide: false,
    face: "/mystery-teacher-a.jpg",
    image: "/reveals/takedown-1.jpg",
  },
  {
    id: "reveal-laser",
    n: 3,
    points: 30,
    title: "Laser Tag",
    prize: "Laser tag for your class",
    wide: true,
    face: "/mystery-teacher-b.jpg",
    image: "/reveals/laser.jpg",
  },
  {
    id: "reveal-2",
    n: 4,
    points: 40,
    title: "Teacher Takedown #2",
    prize: "Whipped cream pie in a teacher's face",
    wide: false,
    face: "/mystery-teacher-b.jpg",
    image: "/reveals/takedown-2.jpg",
  },
  {
    id: "reveal-ice",
    n: 5,
    points: 50,
    title: "Ice Cream",
    prize: "Ice cream",
    wide: true,
    face: "/mystery-teacher-a.jpg",
    image: "/reveals/ice-cream.jpg",
  },
  {
    id: "reveal-3",
    n: 6,
    points: 60,
    title: "Teacher Takedown #3",
    prize: "Ice bucket a teacher",
    wide: false,
    face: "/mystery-teacher-a.jpg",
    image: "/reveals/takedown-3.jpg",
  },
] as const;

export type RevealId = (typeof REVEALS)[number]["id"];
export type RevealDef = (typeof REVEALS)[number];
export type ScreenId = ViewId | RevealId;

export type ShownMap = Record<ScreenId, boolean>;

export const SCREEN_IDS: ScreenId[] = [
  ...VIEWS.map((view) => view.id),
  ...REVEALS.map((reveal) => reveal.id),
];

export const DEFAULT_SHOWN: ShownMap = {
  board: true,
  prizes: true,
  yard: true,
  "reveal-game": false,
  "reveal-1": false,
  "reveal-laser": false,
  "reveal-2": false,
  "reveal-ice": false,
  "reveal-3": false,
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

export function kioskScreens(shown: ShownMap): ScreenId[] {
  const visible = SCREEN_IDS.filter((id) => shown[id]);
  return visible.length > 0 ? visible : ["board"];
}
