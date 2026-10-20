import type { UnitId } from "@/lib/game";

export type Student = {
  id: string;
  unitId: UnitId;
  name: string;
  image: string;
};

/** F/1 photos from the shared Drive folder. Add 2/3/4 and 5/6 the same way when ready. */
const F1: Student[] = [
  { id: "f1-abbey", unitId: "f1", name: "Abbey", image: "/students/f1-abbey.jpg" },
  { id: "f1-ada", unitId: "f1", name: "Ada", image: "/students/f1-ada.jpg" },
  { id: "f1-annika", unitId: "f1", name: "Annika", image: "/students/f1-annika.jpg" },
  { id: "f1-brooks", unitId: "f1", name: "Brooks", image: "/students/f1-brooks.jpg" },
  { id: "f1-ebony", unitId: "f1", name: "Ebony", image: "/students/f1-ebony.jpg" },
  { id: "f1-ella-m", unitId: "f1", name: "Ella M", image: "/students/f1-ella-m.jpg" },
  { id: "f1-ella-p", unitId: "f1", name: "Ella P", image: "/students/f1-ella-p.jpg" },
  { id: "f1-ellie-mae", unitId: "f1", name: "Ellie Mae", image: "/students/f1-ellie-mae.jpg" },
  { id: "f1-jake", unitId: "f1", name: "Jake", image: "/students/f1-jake.jpg" },
  { id: "f1-judd", unitId: "f1", name: "Judd", image: "/students/f1-judd.jpg" },
  { id: "f1-kieran", unitId: "f1", name: "Kieran", image: "/students/f1-kieran.jpg" },
  { id: "f1-lenny", unitId: "f1", name: "Lenny", image: "/students/f1-lenny.jpg" },
  { id: "f1-millie", unitId: "f1", name: "Millie", image: "/students/f1-millie.jpg" },
  { id: "f1-murphy", unitId: "f1", name: "Murphy", image: "/students/f1-murphy.jpg" },
  { id: "f1-nina", unitId: "f1", name: "Nina", image: "/students/f1-nina.jpg" },
  { id: "f1-teddy", unitId: "f1", name: "Teddy", image: "/students/f1-teddy.jpg" },
  { id: "f1-will", unitId: "f1", name: "Will", image: "/students/f1-will.jpg" },
];

const YEAR_234: Student[] = [];
const YEAR_56: Student[] = [];

export const STUDENTS: Student[] = [...F1, ...YEAR_234, ...YEAR_56];

export function studentById(id: string): Student | null {
  return STUDENTS.find((student) => student.id === id) ?? null;
}

export function studentsForUnit(unitId: UnitId): Student[] {
  return STUDENTS.filter((student) => student.unitId === unitId);
}
