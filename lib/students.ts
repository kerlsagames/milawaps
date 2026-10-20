import type { UnitId } from "@/lib/game";

export type Student = {
  id: string;
  unitId: UnitId;
  name: string;
  image: string;
};

/** F/1 photos from the shared Drive folder. */
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

/** Grade 2/3/4 portraits — cartoonified Milawa campus backgrounds from Drive. */
const YEAR_234: Student[] = [
  { id: "234-alexis", unitId: "234", name: "Alexis", image: "/students/234-alexis.jpg" },
  { id: "234-alison", unitId: "234", name: "Alison", image: "/students/234-alison.jpg" },
  { id: "234-arthur", unitId: "234", name: "Arthur", image: "/students/234-arthur.jpg" },
  { id: "234-austin", unitId: "234", name: "Austin", image: "/students/234-austin.jpg" },
  { id: "234-bella", unitId: "234", name: "Bella", image: "/students/234-bella.jpg" },
  { id: "234-hannah", unitId: "234", name: "Hannah", image: "/students/234-hannah.jpg" },
  { id: "234-harry", unitId: "234", name: "Harry", image: "/students/234-harry.jpg" },
  { id: "234-hugh", unitId: "234", name: "Hugh", image: "/students/234-hugh.jpg" },
  { id: "234-isla", unitId: "234", name: "Isla", image: "/students/234-isla.jpg" },
  { id: "234-ivy", unitId: "234", name: "Ivy", image: "/students/234-ivy.jpg" },
  { id: "234-josh", unitId: "234", name: "Josh", image: "/students/234-josh.jpg" },
  { id: "234-leo", unitId: "234", name: "Leo", image: "/students/234-leo.jpg" },
  { id: "234-lucy", unitId: "234", name: "Lucy", image: "/students/234-lucy.jpg" },
  { id: "234-mary", unitId: "234", name: "Mary", image: "/students/234-mary.jpg" },
  { id: "234-matilda-l", unitId: "234", name: "Matilda L", image: "/students/234-matilda-l.jpg" },
  { id: "234-matilda-m", unitId: "234", name: "Matilda M", image: "/students/234-matilda-m.jpg" },
  { id: "234-poppy", unitId: "234", name: "Poppy", image: "/students/234-poppy.jpg" },
  { id: "234-sean", unitId: "234", name: "Sean", image: "/students/234-sean.jpg" },
  { id: "234-tjmara", unitId: "234", name: "Tjmara", image: "/students/234-tjmara.jpg" },
  { id: "234-zaylee", unitId: "234", name: "Zaylee", image: "/students/234-zaylee.jpg" },
];

/** Grade 5/6 portraits — older look; Grade 6 wear the special navy Milawa shirt. */
const YEAR_56: Student[] = [
  { id: "56-anna", unitId: "56", name: "Anna", image: "/students/56-anna.jpg" },
  { id: "56-charlie", unitId: "56", name: "Charlie", image: "/students/56-charlie.jpg" },
  { id: "56-charlotte", unitId: "56", name: "Charlotte", image: "/students/56-charlotte.jpg" },
  { id: "56-cooper", unitId: "56", name: "Cooper", image: "/students/56-cooper.jpg" },
  { id: "56-finley", unitId: "56", name: "Finley", image: "/students/56-finley.jpg" },
  { id: "56-flossy", unitId: "56", name: "Flossy", image: "/students/56-flossy.jpg" },
  { id: "56-gabi", unitId: "56", name: "Gabi", image: "/students/56-gabi.jpg" },
  { id: "56-hattie", unitId: "56", name: "Hattie", image: "/students/56-hattie.jpg" },
  { id: "56-jelly", unitId: "56", name: "Jelly", image: "/students/56-jelly.jpg" },
  { id: "56-josie", unitId: "56", name: "Josie", image: "/students/56-josie.jpg" },
  { id: "56-keshy", unitId: "56", name: "Keshy", image: "/students/56-keshy.jpg" },
  { id: "56-liam", unitId: "56", name: "Liam", image: "/students/56-liam.jpg" },
  { id: "56-lily", unitId: "56", name: "Lily", image: "/students/56-lily.jpg" },
  { id: "56-liv", unitId: "56", name: "Liv", image: "/students/56-liv.jpg" },
  { id: "56-max", unitId: "56", name: "Max", image: "/students/56-max.jpg" },
  { id: "56-ollie", unitId: "56", name: "Ollie", image: "/students/56-ollie.jpg" },
  { id: "56-riley", unitId: "56", name: "Riley", image: "/students/56-riley.jpg" },
  { id: "56-ryley", unitId: "56", name: "Ryley", image: "/students/56-ryley.jpg" },
  { id: "56-scout", unitId: "56", name: "Scout", image: "/students/56-scout.jpg" },
  { id: "56-tom", unitId: "56", name: "Tom", image: "/students/56-tom.jpg" },
  { id: "56-tommy", unitId: "56", name: "Tommy", image: "/students/56-tommy.jpg" },
  { id: "56-van", unitId: "56", name: "Van", image: "/students/56-van.jpg" },
  { id: "56-zach", unitId: "56", name: "Zach", image: "/students/56-zach.jpg" },
];

export const STUDENTS: Student[] = [...F1, ...YEAR_234, ...YEAR_56];

export function studentById(id: string): Student | null {
  return STUDENTS.find((student) => student.id === id) ?? null;
}

export function studentsForUnit(unitId: UnitId): Student[] {
  return STUDENTS.filter((student) => student.unitId === unitId);
}
