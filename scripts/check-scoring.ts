import assert from "node:assert/strict";
import { STRIKE_MAX, UNIT_MAX, VAULT_TARGET, emptyScores, vaultTotal } from "../lib/game";
import { applyAction, attachReason, undoLastTick } from "../lib/scoring";
import { tickerLine } from "../lib/ticker";

const start = emptyScores(1_000);

const spot = applyAction(start, "spot", "f1", "jess", 2_000);
assert.equal(spot.state.units.f1, 1);
assert.equal(spot.events.length, 0);
assert.equal(spot.state.lastAction?.staffId, "jess");
assert.equal(spot.state.log[0]?.staffId, "jess");
assert.equal(spot.state.log[0]?.action, "spot");

const game = applyAction(
  { ...start, units: { f1: 0, "234": 14, "56": 0 } },
  "spot",
  "234",
  "craig",
  4_000,
);
assert.equal(game.state.units["234"], 15);
assert.equal(game.events[0]?.title, "Game with Mr K");
assert.equal(game.events[0]?.secret, true);

const secret = applyAction(
  { ...game.state, units: { ...game.state.units, "234": 29 } },
  "spot",
  "234",
  "ash",
  4_100,
);
assert.equal(secret.state.units["234"], 30);
assert.equal(secret.events[0]?.title, "Teacher Takedown #1");
assert.equal(secret.events[0]?.secret, true);
assert.equal(secret.events.some((event) => event.scope === "vault"), false);

const surge = applyAction(secret.state, "surge", "234", "ricky", 5_000);
assert.equal(surge.state.units["234"], 32);

const laser = applyAction(
  { ...start, units: { f1: 0, "234": 44, "56": 0 } },
  "spot",
  "234",
  "craig",
  5_500,
);
assert.equal(laser.state.units["234"], 45);
assert.equal(laser.events[0]?.title, "Laser Tag");
assert.equal(laser.events[0]?.secret, true);

const capped = applyAction(
  { ...start, units: { f1: 59, "234": 60, "56": 60 } },
  "teamwork",
  undefined,
  "tiff",
  6_000,
);
assert.equal(capped.state.units.f1, UNIT_MAX);
assert.equal(capped.state.units["234"], UNIT_MAX);
assert.equal(vaultTotal(capped.state.units), VAULT_TARGET);
assert.equal(capped.events.some((event) => event.scope === "vault"), false);

const struck = applyAction(
  { ...start, units: { f1: 4, "234": 0, "56": 0 } },
  "strike",
  "f1",
  "jess",
  6_500,
);
assert.equal(struck.state.units.f1, 3);
assert.equal(struck.state.crosses.f1, 1);

const floored = applyAction(start, "strike", "56", "doug", 7_000);
assert.equal(floored.state.units["56"], 0);
assert.equal(floored.state.crosses["56"], 0);

const fullStrikes = applyAction(
  { ...start, units: { f1: 4, "234": 0, "56": 0 }, crosses: { f1: STRIKE_MAX, "234": 0, "56": 0 } },
  "strike",
  "f1",
  "jenny",
  7_500,
);
assert.equal(fullStrikes.state.units.f1, 3);
assert.equal(fullStrikes.state.crosses.f1, STRIKE_MAX);

const fullSchool = applyAction(
  { ...start, units: { f1: 45, "234": 45, "56": 59 } },
  "spot",
  "56",
  "maria",
  8_000,
);
assert.equal(vaultTotal(fullSchool.state.units), 150);
assert.equal(fullSchool.events.filter((event) => event.scope === "vault").length, 0);
assert.equal(fullSchool.events[0]?.title, "Teacher Takedown #2");
assert.equal(fullSchool.events[0]?.secret, true);

const reset = applyAction(fullSchool.state, "reset", undefined, "hunter", 9_000);
assert.equal(vaultTotal(reset.state.units), 0);
assert.equal(reset.state.lastAction, null);
assert.equal(reset.state.log[0]?.action, "reset");
assert.equal(reset.state.log[0]?.staffId, "hunter");

const noted = applyAction(start, "spot", "f1", "jess", 10_000);
const withReason = attachReason(
  noted.state,
  noted.state.log[0].id,
  "jess",
  "keeping the toilets so clean",
  11_000,
);
assert.equal(withReason.units.f1, 1);
assert.equal(withReason.log[0]?.reason, "keeping the toilets so clean");
assert.equal(withReason.reasons[0]?.reason, "keeping the toilets so clean");
assert.equal(
  tickerLine(withReason.log[0]),
  "F/1 +1 point from Miss B for keeping the toilets so clean",
);
assert.equal(tickerLine(noted.state.log[0]), "Miss B has just given F/1 +1 point");
const kept = applyAction(withReason, "reset", undefined, "craig", 12_000);
assert.equal(kept.state.units.f1, 0);
assert.equal(kept.state.reasons.length, 1);

const forUndo = applyAction(start, "surge", "56", "ash", 13_000);
assert.equal(forUndo.state.units["56"], 2);
const undone = undoLastTick(forUndo.state, 14_000);
assert.equal(undone.units["56"], 0);
assert.equal(undone.log.length, 0);
assert.equal(undone.lastAction, null);

console.log("scoring checks passed");
