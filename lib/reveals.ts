import { VIEWS, type ViewId } from "@/lib/game";

export const REVEALS = [
  {
    id: "reveal-1",
    n: 1,
    title: "Teacher Takedown #1",
    prize: "Dress a teacher in clothes of your choice for a day",
    face: "/mystery-teacher-a.jpg",
    image: "/reveals/takedown-1.jpg",
  },
  {
    id: "reveal-2",
    n: 2,
    title: "Teacher Takedown #2",
    prize: "Whipped cream pie in a teacher's face",
    face: "/mystery-teacher-b.jpg",
    image: "/reveals/takedown-2.jpg",
  },
  {
    id: "reveal-3",
    n: 3,
    title: "Teacher Takedown #3",
    prize: "Ice bucket a teacher",
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
  "reveal-1": false,
  "reveal-2": false,
  "reveal-3": false,
};

export function revealById(id: string): RevealDef | null {
  return REVEALS.find((reveal) => reveal.id === id) ?? null;
}

export function kioskScreens(shown: ShownMap): ScreenId[] {
  const visible = SCREEN_IDS.filter((id) => shown[id]);
  return visible.length > 0 ? visible : ["board"];
}
