import assert from "node:assert/strict";
import {
  createHighlight,
  activeHighlights,
  removeHighlightById,
  sanitizeHighlights,
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
assert.equal(first.expiresAt, 1_000 + 2 * 24 * 60 * 60 * 1000);

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

// Highlight save awards +1 (spot) to each class represented.
let scores = emptyScores(5_000);
for (const unitId of [...new Set(mixed.students.map((student) => student.unitId))]) {
  scores = applyAction(scores, "spot", unitId, "jess", 5_000).state;
}
assert.equal(scores.units["234"], 1);
assert.equal(scores.units["56"], 1);
assert.equal(scores.units.f1, 0);

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
const kept = sanitizeHighlights([first, second, { ...first, expiresAt: 500 }], 1_500);
assert.equal(kept.length, 2);
assert.equal(activeHighlights(kept, 1_500).length, 2);
assert.equal(activeHighlights(kept, first.expiresAt + 1).length, 1);

const shown = { ...DEFAULT_SHOWN, news: true, highlight: true };
const screens = kioskScreens(shown, [first, second], 1_500);
assert.ok(screens.includes("news"));
assert.ok(screens.includes(`highlight:${first.id}`));
assert.ok(screens.includes(`highlight:${second.id}`));
assert.equal(screens.includes("highlight"), false);

const off = kioskScreens({ ...DEFAULT_SHOWN, highlight: false }, [first], 1_500);
assert.equal(off.some((id) => String(id).startsWith("highlight:")), false);

const afterRemove = removeHighlightById(kept, first.id, 1_500);
assert.equal(afterRemove?.length, 1);
assert.equal(afterRemove?.[0]?.id, second.id);
assert.equal(removeHighlightById(kept, "missing-id", 1_500), null);

console.log("highlight and news checks passed");
