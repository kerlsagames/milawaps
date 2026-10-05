import assert from "node:assert/strict";
import { UNIT_MAX, emptyScores, vaultTotal } from "../lib/game";
import { applyAction } from "../lib/scoring";

const start = emptyScores(1_000);

const spot = applyAction(start, "spot", "f1", 2_000);
assert.equal(spot.state.units.f1, 1);
assert.equal(spot.events.length, 0);

let state = start;
for (let i = 0; i < 30; i += 1) {
  state = applyAction(state, "spot", "234", 3_000 + i).state;
}
const crossed = applyAction({ ...state, units: { ...state.units, "234": 29 } }, "spot", "234", 4_000);
assert.equal(crossed.state.units["234"], 30);
assert.equal(crossed.events[0]?.title, "15m Extra Play");

const surge = applyAction(crossed.state, "surge", "234", 5_000);
assert.equal(surge.state.units["234"], 33);

const capped = applyAction(
  { ...start, units: { f1: 54, "234": 55, "56": 55 } },
  "teamwork",
  undefined,
  6_000,
);
assert.equal(capped.state.units.f1, UNIT_MAX);
assert.equal(capped.state.units["234"], UNIT_MAX);
assert.equal(vaultTotal(capped.state.units), 165);

const floored = applyAction(start, "strike", "56", 7_000);
assert.equal(floored.state.units["56"], 0);

const vaultHit = applyAction(
  { ...start, units: { f1: 50, "234": 40, "56": 39 } },
  "spot",
  "56",
  8_000,
);
assert.equal(vaultTotal(vaultHit.state.units), 130);
assert.ok(vaultHit.events.some((event) => event.scope === "vault" && event.points === 130));

const reset = applyAction(vaultHit.state, "reset", undefined, 9_000);
assert.equal(vaultTotal(reset.state.units), 0);
assert.equal(reset.state.lastAction, null);

console.log("scoring checks passed");
