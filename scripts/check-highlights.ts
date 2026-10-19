import assert from "node:assert/strict";
import { createHighlight, activeHighlights, sanitizeHighlights } from "../lib/highlights";
import { emptyNews, sanitizeNews } from "../lib/news";
import { STUDENTS } from "../lib/students";
import { kioskScreens, DEFAULT_SHOWN } from "../lib/reveals";

assert.equal(STUDENTS.length, 63);
assert.equal(STUDENTS.filter((student) => student.unitId === "f1").length, 21);

const news = sanitizeNews({
  headline: "Sports day",
  blurb: "Bring a hat",
  reminders: [{ id: "1", text: "Hats on" }],
  upcoming: [{ id: "2", when: "Fri", text: "Assembly" }],
  picture: "/milawa-yard.jpg",
});
assert.equal(news.headline, "Sports day");
assert.equal(news.reminders[0]?.text, "Hats on");
assert.equal(emptyNews().reminders.length, 0);

const first = createHighlight(
  [{ id: "f1-01", unitId: "f1" }, { id: "f1-02", unitId: "f1" }],
  "Packed the shed",
  "jess",
  1_000,
);
assert.equal(first.students.length, 2);
assert.equal(first.expiresAt, 1_000 + 2 * 24 * 60 * 60 * 1000);

const second = createHighlight([{ id: "234-01", unitId: "234" }], "Led the line", "craig", 2_000);
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

console.log("highlight and news checks passed");
