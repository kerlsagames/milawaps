import assert from "node:assert/strict";
import { UNIT_MAX, emptyScores, vaultTotal } from "../lib/game";
import { applyAction } from "../lib/scoring";

const start = emptyScores(1_000);

const spot = applyAction(start, "spot", "f1", 2_000);
assert.equal(spot.state.units.f1, 1);
assert.equal(spot.events.length, 0);

const laser = applyAction(
  { ...start, units: { f1: 0, "234": 19, "56": 0 } },
  "spot",
  "234",
  4_000,
);
assert.equal(laser.state.units["234"], 20);
assert.equal(laser.events[0]?.title, "Laser Tag");
assert.equal(laser.events[0]?.secret, false);

const secret = applyAction(
  { ...laser.state, units: { ...laser.state.units, "234": 24 } },
  "spot",
  "234",
  4_100,
);
assert.equal(secret.state.units["234"], 25);
assert.equal(secret.events[0]?.title, "Teacher Takedown");
assert.equal(secret.events[0]?.secret, true);
assert.equal(secret.events.some((event) => event.scope === "vault"), false);

const surge = applyAction(secret.state, "surge", "234", 5_000);
assert.equal(surge.state.units["234"], 28);

const capped = applyAction(
  { ...start, units: { f1: 49, "234": 50, "56": 50 } },
  "teamwork",
  undefined,
  6_000,
);
assert.equal(capped.state.units.f1, UNIT_MAX);
assert.equal(capped.state.units["234"], UNIT_MAX);
assert.equal(vaultTotal(capped.state.units), 150);
assert.ok(capped.events.some((event) => event.unitId === "f1" && event.points === 50));
assert.equal(capped.events.some((event) => event.scope === "vault"), false);

const floored = applyAction(start, "strike", "56", 7_000);
assert.equal(floored.state.units["56"], 0);

const fullSchool = applyAction(
  { ...start, units: { f1: 50, "234": 50, "56": 49 } },
  "spot",
  "56",
  8_000,
);
assert.equal(vaultTotal(fullSchool.state.units), 150);
assert.equal(fullSchool.events.filter((event) => event.scope === "vault").length, 0);
assert.equal(fullSchool.events[0]?.title, "5× Teacher Takedown");

const reset = applyAction(fullSchool.state, "reset", undefined, 9_000);
assert.equal(vaultTotal(reset.state.units), 0);
assert.equal(reset.state.lastAction, null);

console.log("scoring checks passed");
