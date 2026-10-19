import { UNITS, type UnitId } from "@/lib/game";

export type Student = {
  id: string;
  unitId: UnitId;
  name: string;
  image: string;
};

function roster(unitId: UnitId, count: number): Student[] {
  const code = UNITS.find((unit) => unit.id === unitId)?.code ?? unitId;
  return Array.from({ length: count }, (_, index) => {
    const n = String(index + 1).padStart(2, "0");
    const id = `${unitId}-${n}`;
    return {
      id,
      unitId,
      name: `${code} student ${n}`,
      image: `/students/${id}.jpg`,
    };
  });
}

/** 63 slots ready for named photos. Replace names and drop matching files in /public/students. */
export const STUDENTS: Student[] = [
  ...roster("f1", 21),
  ...roster("234", 21),
  ...roster("56", 21),
];

export function studentById(id: string): Student | null {
  return STUDENTS.find((student) => student.id === id) ?? null;
}

export function studentsForUnit(unitId: UnitId): Student[] {
  return STUDENTS.filter((student) => student.unitId === unitId);
}
