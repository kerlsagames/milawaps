import assert from "node:assert/strict";
import {
  createHighlight,
  activeHighlights,
  formatHighlightCountdown,
  highlightPointTotal,
  highlightSpotUnits,
  highlightsToCsv,
  removeHighlightById,
  sanitizeHighlights,
  HIGHLIGHT_POINT_MAX,
  HIGHLIGHT_TTL_MS,
} from "../lib/highlights";
import { emptyNews, sanitizeNews } from "../lib/news";
import { emptyScores } from "../lib/game";
import { applyAction } from "../lib/scoring";
import { STUDENTS } from "../lib/students";
import { kioskScreens, DEFAULT_SHOWN } from "../lib/reveals";

assert.equal(STUDENTS.filter((student) => student.unitId === "f1").length, 17);
assert.equal(STUDENTS.filter((student) => student.unitId === "234").length, 21);
assert.ok(STUDENTS.some((student) => student.id === "234-archie"));
assert.equal(STUDENTS.filter((student) => student.unitId === "56").length, 23);
assert.ok(STUDENTS.some((student) => student.name === "Ellie Mae"));
assert.ok(STUDENTS.some((student) => student.id === "f1-murphy"));
assert.ok(STUDENTS.some((student) => student.id === "234-leo"));
assert.ok(STUDENTS.some((student) => student.id === "234-isla"));
assert.ok(STUDENTS.some((student) => student.id === "234-austin"));
assert.ok(STUDENTS.some((student) => student.id === "234-tjmara"));
assert.ok(STUDENTS.some((student) => student.name === "Matilda L"));
assert.ok(STUDENTS.some((student) => student.name === "Matilda M"));
assert.ok(STUDENTS.some((student) => student.id === "56-cooper"));
assert.ok(STUDENTS.some((student) => student.id === "56-liv"));
assert.ok(STUDENTS.some((student) => student.id === "56-josie"));
assert.ok(STUDENTS.some((student) => student.name === "Ryley"));
assert.ok(STUDENTS.some((student) => student.name === "Riley"));

const news = sanitizeNews({
  headline: "Sports day",
  blurb: "Bring a hat",
  challenge: "Find the hidden duck — 2+ points",
  reminders: [{ id: "1", text: "Hats on" }],
  upcoming: [{ id: "2", when: "Fri", text: "Assembly" }],
  picture: "/milawa-yard.jpg",
});
assert.equal(news.headline, "Sports day");
assert.equal(news.challenge, "Find the hidden duck — 2+ points");
assert.equal(news.reminders[0]?.text, "Hats on");
assert.equal(emptyNews().reminders.length, 0);
assert.equal(emptyNews().challenge, "");

const first = createHighlight(
  [
    { id: "f1-abbey", unitId: "f1" },
    { id: "f1-ada", unitId: "f1" },
  ],
  "Packed the shed",
  "jess",
  1_000,
);
assert.equal(first.students.length, 2);
assert.equal(first.expiresAt, 1_000 + 30 * 60 * 60 * 1000);

const mixed = createHighlight(
  [
    { id: "234-tjmara", unitId: "234" },
    { id: "56-keshy", unitId: "56" },
  ],
  "Helped on the court",
  "jess",
  3_000,
);
assert.equal(mixed.students.length, 2);
assert.deepEqual(
  mixed.students.map((student) => student.id).sort(),
  ["234-tjmara", "56-keshy"],
);
assert.equal(mixed.students.find((student) => student.id === "234-tjmara")?.unitId, "234");
assert.equal(mixed.students.find((student) => student.id === "56-keshy")?.unitId, "56");

// Highlight save awards +1 (spot) per student (max 3), even in the same class.
assert.equal(HIGHLIGHT_POINT_MAX, 3);
assert.deepEqual(highlightSpotUnits(mixed.students), ["234", "56"]);
assert.equal(highlightPointTotal(mixed.students), 2);

const sameClass = createHighlight(
  [
    { id: "56-zach", unitId: "56" },
    { id: "56-max", unitId: "56" },
  ],
  "Keeping the yard clean",
  "ash",
  5_500,
);
assert.deepEqual(highlightSpotUnits(sameClass.students), ["56", "56"]);
assert.equal(highlightPointTotal(sameClass.students), 2);

let scores = emptyScores(5_000);
let tick = 5_000;
for (const unitId of highlightSpotUnits(sameClass.students)) {
  scores = applyAction(scores, "spot", unitId, "ash", tick).state;
  tick += 1;
}
assert.equal(scores.units["56"], 2);
assert.equal(scores.units["234"], 0);

const fourKids = [
  { id: "56-zach", unitId: "56" as const },
  { id: "56-max", unitId: "56" as const },
  { id: "234-archie", unitId: "234" as const },
  { id: "f1-millie", unitId: "f1" as const },
];
assert.equal(highlightSpotUnits(fourKids).length, 3);
assert.equal(highlightPointTotal(fourKids), 3);

const wrongClassDropped = sanitizeHighlights(
  [
    {
      id: "bad-unit",
      at: 4_000,
      expiresAt: 4_000 + 2 * 24 * 60 * 60 * 1000,
      staffId: "jess",
      reason: "Cross class bug",
      students: [
        { id: "234-tjmara", unitId: "234" },
        // Wrong unitId must be dropped — this used to wipe Keshy when switching classes.
        { id: "56-keshy", unitId: "234" },
      ],
    },
  ],
  4_000,
);
assert.equal(wrongClassDropped.length, 1);
assert.equal(wrongClassDropped[0]?.students.length, 1);
assert.equal(wrongClassDropped[0]?.students[0]?.id, "234-tjmara");

const second = createHighlight([{ id: "f1-will", unitId: "f1" }], "Led the line", "craig", 2_000);
const kept = sanitizeHighlights([first, second, { ...first, id: "old-ended", expiresAt: 500 }], 1_500);
// Expired rows stay in storage for spreadsheet download.
assert.equal(kept.length, 3);
assert.equal(activeHighlights(kept, 1_500).length, 2);
assert.equal(activeHighlights(kept, first.expiresAt + 1).length, 1);

assert.equal(HIGHLIGHT_TTL_MS, 30 * 60 * 60 * 1000);
assert.equal(formatHighlightCountdown(30 * 60 * 60 * 1000), "30:00:00");
assert.equal(formatHighlightCountdown(65_000), "1:05");
const csv = highlightsToCsv(kept);
assert.match(csv, /When,Staff,Students,Classes,Reason,Expires,Status/);
assert.match(csv, /Packed the shed/);
assert.match(csv, /Ended/);

const shown = { ...DEFAULT_SHOWN, news: true, highlight: true };
const screens = kioskScreens(shown, [first, second], 1_500);
assert.ok(screens.includes("news"));
assert.ok(screens.includes(`highlight:${first.id}`));
assert.ok(screens.includes(`highlight:${second.id}`));
assert.equal(screens.includes("highlight"), false);

const off = kioskScreens({ ...DEFAULT_SHOWN, highlight: false }, [first], 1_500);
assert.equal(off.some((id) => String(id).startsWith("highlight:")), false);

// Today is a teacher-desk feed — never enter the TV kiosk loop.
const withToday = kioskScreens({ ...DEFAULT_SHOWN, today: true }, [], 1_500);
assert.equal(withToday.includes("today"), false);

const afterRemove = removeHighlightById(kept, first.id, 1_500);
assert.equal(afterRemove?.length, 2);
assert.deepEqual(
  afterRemove?.map((entry) => entry.id).sort(),
  ["old-ended", second.id].sort(),
);
assert.equal(removeHighlightById(kept, "missing-id", 1_500), null);

console.log("highlight and news checks passed");
