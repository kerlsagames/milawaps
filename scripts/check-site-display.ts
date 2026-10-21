import assert from "node:assert/strict";
import { DEFAULT_SHOWN } from "../lib/reveals";
import { emptySiteDisplay, sanitizeSiteDisplay, siteDisplayFromInput } from "../lib/site-display";

const empty = emptySiteDisplay();
assert.equal(empty.cricketCode, "");
assert.equal(empty.updatedAt, 0);
assert.equal(empty.shown.board, true);
assert.equal(empty.shown.news, false);
assert.equal(empty.shown.cricket, false);
assert.equal(empty.newsLayout, "split");
assert.equal(empty.cricketPanels.ladder, true);
assert.equal(empty.finishAt, null);

const withCode = siteDisplayFromInput({ cricketCode: "BQWA8Z" }, empty);
assert.equal(withCode.cricketCode, "BQWA8Z");
assert.equal(withCode.shown.cricket, true);
assert.ok(withCode.updatedAt > 0);

const hideNews = siteDisplayFromInput({ shown: { news: true, highlight: true } }, withCode);
assert.equal(hideNews.shown.news, true);
assert.equal(hideNews.shown.highlight, true);
assert.equal(hideNews.shown.cricket, true);
assert.equal(hideNews.cricketCode, "BQWA8Z");

const cleared = siteDisplayFromInput({ cricketCode: "" }, hideNews);
assert.equal(cleared.cricketCode, "");
assert.equal(cleared.shown.cricket, false);
assert.equal(cleared.shown.news, true);

const sanitized = sanitizeSiteDisplay({
  shown: { ...DEFAULT_SHOWN, news: true, board: false },
  cricketCode: "  abc  ",
  newsLayout: "boards",
  cricketPanels: { lastNext: false, leaders: true, ladder: true, draw: false },
});
assert.equal(sanitized.cricketCode, "abc");
assert.equal(sanitized.shown.news, true);
assert.equal(sanitized.shown.board, false);
assert.equal(sanitized.newsLayout, "boards");
assert.equal(sanitized.cricketPanels.lastNext, false);
assert.equal(sanitized.cricketPanels.draw, false);

const layoutOnly = siteDisplayFromInput({ newsLayout: "stack" }, sanitized);
assert.equal(layoutOnly.newsLayout, "stack");
assert.equal(layoutOnly.cricketCode, "abc");

const withFinish = siteDisplayFromInput({ finishAt: 1_800_000_000_000 }, layoutOnly);
assert.equal(withFinish.finishAt, 1_800_000_000_000);
assert.equal(withFinish.newsLayout, "stack");
const clearedFinish = siteDisplayFromInput({ finishAt: null }, withFinish);
assert.equal(clearedFinish.finishAt, null);
assert.equal(
  sanitizeSiteDisplay({ finishAt: "nope", cricketCode: "x" }).finishAt,
  null,
);

console.log("site display checks passed");
