import assert from "node:assert/strict";
import { emptyScores } from "../lib/game";
import { applyAction } from "../lib/scoring";
import { JIMMY_CRICKET_BOARD, parseCricketSnapshot, shareUrlForCode } from "../lib/cricket";
import { todayFeed } from "../lib/today";

process.env.CRICKET_SHARE_ORIGIN = "https://example.com";
assert.equal(shareUrlForCode("BQWA8Z"), `${JIMMY_CRICKET_BOARD}/BQWA8Z`);
assert.equal(shareUrlForCode("  bqwa8z "), `${JIMMY_CRICKET_BOARD}/bqwa8z`);
assert.equal(shareUrlForCode("preview"), null);
assert.equal(shareUrlForCode("abc"), null);
assert.equal(shareUrlForCode("http://jimmyscricket.vercel.app/api/board/BQWA8Z"), null);
assert.equal(
  shareUrlForCode("https://jimmyscricket.vercel.app/api/board/BQWA8Z"),
  "https://jimmyscricket.vercel.app/api/board/BQWA8Z",
);

const parsed = parseCricketSnapshot({
  title: "School Challenge",
  updatedAt: 1792227359338,
  stats: [
    { label: "Teams", value: "3" },
    { label: "Games played", value: "1" },
    { label: "Games to go", value: "4" },
    { label: "Most runs", value: "Ryan 34" },
    { label: "Most wickets", value: "Riley 6" },
    { label: "On top", value: "Stormy Cockatoos · 2 pts" },
  ],
  ladder: [{ team: "Stormy Cockatoos", played: 1, won: 1, lost: 0, points: 2 }],
  draw: [
    {
      when: "Mon, 19 Oct · Recess",
      home: "Blazing Sixers",
      away: "Mighty Bouncers",
      ground: "Recess",
      result: "Under way",
    },
    {
      when: "Wed, 21 Oct · Lunch",
      home: "Grand final · 1st v 2nd after the rounds",
      away: "",
      ground: "Lunch",
      result: "",
    },
  ],
});
assert.equal(parsed?.ladder[0]?.team, "Stormy Cockatoos");
assert.equal(parsed?.stats.length, 6);
assert.equal(parsed?.stats[5]?.value, "Stormy Cockatoos · 2 pts");
assert.equal(parsed?.draw.length, 2);
assert.equal(parsed?.draw[1]?.home, "Grand final · 1st v 2nd after the rounds");
assert.equal(parsed?.draw[1]?.away, "");
assert.equal(parsed?.leaders.runs[0]?.name, "Ryan");
assert.equal(parsed?.leaders.runs[0]?.value, "34");
assert.equal(parsed?.leaders.wickets[0]?.name, "Riley");
assert.equal(parsed?.leaders.wickets[0]?.value, "6");
assert.equal(parsed?.lastGame, null);
assert.equal(parsed?.nextGame?.home, "Blazing Sixers");
assert.equal(parsed?.nextGame?.result, "Under way");

const withResult = parseCricketSnapshot({
  title: "Done game",
  ladder: [{ team: "A", played: 1, won: 1, lost: 0, points: 2 }],
  draw: [
    {
      when: "Fri",
      home: "A",
      away: "B",
      ground: "Oval",
      result: "A won by 10 runs",
    },
    {
      when: "Mon",
      home: "B",
      away: "C",
      ground: "Oval",
      result: "",
    },
  ],
  stats: [{ label: "Highest score", value: "Poppy 48" }],
});
assert.equal(withResult?.lastGame?.result, "A won by 10 runs");
assert.equal(withResult?.nextGame?.home, "B");
assert.equal(withResult?.leaders.highest[0]?.name, "Poppy");
assert.equal(withResult?.leaders.highest[0]?.value, "48");

const now = Date.parse("2026-10-19T12:00:00+11:00");
const todayAt = (minute: number) => Date.parse("2026-10-19T08:00:00+11:00") + minute * 60_000;

let spots = emptyScores(1);
for (let index = 0; index < 15; index += 1) {
  spots = applyAction(spots, "spot", "f1", "jess", todayAt(index)).state;
}
const latest = todayFeed(spots, now);
assert.equal(latest.length, 8);
assert.equal(latest[0]?.kind, "unlock");
assert.equal(latest[0]?.text, "F/1 unlocked Game with Mr K");
assert.equal(latest[1]?.kind, "tick");
assert.match(latest[1]?.text ?? "", /Miss B · F\/1 \+1 point/);
assert.equal(latest.filter((item) => item.kind === "tick").length, 7);

let mixed = emptyScores(1);
mixed = applyAction(mixed, "spot", "234", "craig", Date.parse("2026-10-18T10:00:00+11:00")).state;
mixed = applyAction(mixed, "strike", "234", "ash", Date.parse("2026-10-19T10:00:00+11:00")).state;
const todayOnly = todayFeed(mixed, now);
assert.equal(todayOnly.length, 1);
assert.equal(todayOnly[0]?.kind, "strike");
assert.match(todayOnly[0]?.text ?? "", /Mr C · 2\/3\/4 −1 point/);

const surged = applyAction(
  { ...emptyScores(1), units: { f1: 13, "234": 0, "56": 0 } },
  "teamwork",
  undefined,
  "tiff",
  Date.parse("2026-10-19T11:00:00+11:00"),
);
const unlocked = todayFeed(surged.state, now);
assert.equal(unlocked[0]?.kind, "unlock");
assert.equal(unlocked[0]?.text, "F/1 unlocked Game with Mr K");
assert.equal(unlocked[1]?.kind, "tick");
assert.match(unlocked[1]?.text ?? "", /Mrs Stirling · all classes \+3 points/);

console.log("today and cricket checks passed");
