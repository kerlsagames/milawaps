import type { CricketFixture, CricketLeader, CricketLeaders, CricketRow } from "@/lib/cricket";

function ladderPercentage(row: Pick<CricketRow, "runsFor" | "runsAgainst">) {
  if (row.runsAgainst > 0) {
    return Math.round((row.runsFor / row.runsAgainst) * 1000) / 10;
  }
  return null;
}

const BOWL_WICKETS = new Set(["bowled", "caught", "caughtKeeper", "lbw", "stumped", "hitWicket"]);
/** Keep everyone with a score — year-level filters need the full school list, not overall top 6. */
const LEADER_LIMIT = 120;

type JimmyBall = {
  k?: string;
  r?: number;
  b?: string;
  s?: string;
  o?: string;
  f?: string;
  x?: string;
  how?: string;
};

type JimmySide = {
  teamId?: string;
  roster?: { id?: string; name?: string; from?: string }[];
  away?: string[];
  batOrder?: string[];
};

type JimmyInnings = {
  batting?: string;
  units?: string[][];
  overs?: number;
  balls?: JimmyBall[];
};

type JimmyGame = {
  phase?: string;
  home?: JimmySide;
  away?: JimmySide;
  innings?: JimmyInnings[];
  rules?: {
    pairs?: boolean;
    ballsPerOver?: number;
    oversEach?: number;
    wicketRuns?: number;
  };
  oddsDuel?: boolean;
};

type JimmyFixture = {
  stage?: string;
  home?: string;
  away?: string;
  result?: {
    text?: string;
    homeRuns?: number;
    awayRuns?: number;
    winner?: string;
  } | null;
  game?: JimmyGame | null;
};

type JimmyTeam = { id?: string; name?: string; playerIds?: string[] };
type JimmyPlayer = { id?: string; name?: string };

export type JimmySchool = {
  teams?: JimmyTeam[];
  players?: JimmyPlayer[];
  fixtures?: JimmyFixture[];
};

type PlayerAgg = {
  id: string;
  name: string;
  runs: number;
  wickets: number;
  catches: number;
  runOuts: number;
  high: number;
  sixes: number;
  fours: number;
};

function text(value: unknown, max: number) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function isFill(player: { name?: string; from?: string } | undefined) {
  if (!player) return false;
  if (player.from === "fill") return true;
  return player.name?.replace(/\s+/g, " ").trim().toLowerCase() === "fill in";
}

/** Port of Jimmy's innings tally (xs) — enough for bat / bowl / field leaders. */
function tallyInnings(innings: JimmyInnings, rules: NonNullable<JimmyGame["rules"]>, _oddsDuel: boolean) {
  const wicketRuns = num(rules.wicketRuns);
  const units = Array.isArray(innings.units) ? innings.units : [];
  const bat = new Map<string, { id: string; runs: number; balls: number; outs: number; fours: number; sixes: number }>();
  const bowl = new Map<
    string,
    { id: string; balls: number; runs: number; wickets: number; wides: number; noBalls: number; dots: number }
  >();
  const field: Record<string, { catches: number; runOuts: number; stumpings: number }> = {};

  const batter = (id: string) => {
    let row = bat.get(id);
    if (!row) {
      row = { id, runs: 0, balls: 0, outs: 0, fours: 0, sixes: 0 };
      bat.set(id, row);
    }
    return row;
  };
  const bowler = (id: string) => {
    let row = bowl.get(id);
    if (!row) {
      row = { id, balls: 0, runs: 0, wickets: 0, wides: 0, noBalls: 0, dots: 0 };
      bowl.set(id, row);
    }
    return row;
  };
  const fielder = (id: string) => {
    if (!field[id]) field[id] = { catches: 0, runOuts: 0, stumpings: 0 };
    return field[id]!;
  };

  for (const unit of units) {
    for (const id of unit) {
      if (id) batter(id);
    }
  }

  let runs = 0;
  let wickets = 0;
  for (const ball of innings.balls ?? []) {
    const kind = text(ball.k, 12);
    if (kind === "swap") continue;
    const bowlRow = ball.b ? bowler(ball.b) : null;
    const batRow = ball.s ? batter(ball.s) : null;
    const scored = num(ball.r);

    if (kind === "run" || kind === "cone") {
      runs += scored;
      if (batRow) {
        batRow.runs += scored;
        batRow.balls += 1;
        if (scored === 4) batRow.fours += 1;
        if (scored === 6) batRow.sixes += 1;
      }
      if (bowlRow) {
        bowlRow.runs += scored;
        bowlRow.balls += 1;
        if (kind === "run" && scored === 0) bowlRow.dots += 1;
        if (kind === "cone") {
          if (ball.x === "nb") bowlRow.noBalls += 1;
          else bowlRow.wides += 1;
        }
      }
      if (kind === "cone" && ball.o) {
        wickets += 1;
        batter(ball.o).outs += 1;
        if (ball.f) fielder(ball.f).runOuts += 1;
      }
    } else if (kind === "out") {
      wickets += 1;
      runs += scored;
      if (batRow) batRow.balls += 1;
      const outId = ball.o || ball.s;
      if (outId) batter(outId).outs += 1;
      if (bowlRow) {
        bowlRow.balls += 1;
        bowlRow.runs += scored;
        if (ball.how && BOWL_WICKETS.has(ball.how)) bowlRow.wickets += 1;
      }
      if (ball.f) {
        if (ball.how === "caught" || ball.how === "caughtKeeper") fielder(ball.f).catches += 1;
        else if (ball.how === "runOut") fielder(ball.f).runOuts += 1;
        else if (ball.how === "stumped") fielder(ball.f).stumpings += 1;
      }
    } else {
      runs += scored;
      if (bowlRow) {
        bowlRow.runs += scored;
        if (kind === "wide") bowlRow.wides += 1;
        else bowlRow.noBalls += 1;
      }
    }
  }

  return {
    total: runs - wickets * wicketRuns,
    bat: [...bat.values()],
    bowl: [...bowl.values()],
    field,
  };
}

function rosterName(game: JimmyGame, playerId: string, schoolPlayers: JimmyPlayer[]) {
  for (const side of [game.home, game.away]) {
    const hit = side?.roster?.find((row) => row.id === playerId);
    if (hit?.name) return text(hit.name, 40);
  }
  const fromSchool = schoolPlayers.find((row) => row.id === playerId);
  return text(fromSchool?.name, 40) || "Player";
}

function isFillId(game: JimmyGame, playerId: string) {
  for (const side of [game.home, game.away]) {
    const hit = side?.roster?.find((row) => row.id === playerId);
    if (hit) return isFill(hit);
  }
  return false;
}

function topLeaders(players: PlayerAgg[], key: keyof PlayerAgg, limit = LEADER_LIMIT): CricketLeader[] {
  return [...players]
    .filter((row) => typeof row[key] === "number" && (row[key] as number) > 0)
    .sort((a, b) => (b[key] as number) - (a[key] as number) || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map((row) => ({ name: row.name, value: String(row[key]) }));
}

/** Aggregate Jimmy school fixtures into leaderboards (same shape milawaps already renders). */
export function leadersFromJimmySchool(school: JimmySchool | null | undefined): CricketLeaders | null {
  if (!school || !Array.isArray(school.fixtures)) return null;
  const schoolPlayers = Array.isArray(school.players) ? school.players : [];
  const byId = new Map<string, PlayerAgg>();
  for (const player of schoolPlayers) {
    const id = text(player.id, 40);
    const name = text(player.name, 40);
    if (!id || !name) continue;
    byId.set(id, { id, name, runs: 0, wickets: 0, catches: 0, runOuts: 0, high: 0, sixes: 0, fours: 0 });
  }

  const ensure = (game: JimmyGame, id: string) => {
    let row = byId.get(id);
    if (!row) {
      row = {
        id,
        name: rosterName(game, id, schoolPlayers),
        runs: 0,
        wickets: 0,
        catches: 0,
        runOuts: 0,
        high: 0,
        sixes: 0,
        fours: 0,
      };
      byId.set(id, row);
    }
    return row;
  };

  let sawGame = false;
  for (const fixture of school.fixtures) {
    const game = fixture.game;
    // Finished results and in-progress games (live balls) both feed the leaderboards.
    if (!game || !Array.isArray(game.innings) || !game.rules) continue;
    const hasBalls = game.innings.some((innings) => Array.isArray(innings.balls) && innings.balls.length > 0);
    if (!fixture.result && !hasBalls) continue;
    sawGame = true;
    const oddsDuel = !!game.oddsDuel;
    for (const innings of game.innings) {
      const tallied = tallyInnings(innings, game.rules, oddsDuel);
      for (const row of tallied.bat) {
        if ((!row.balls && !row.outs) || isFillId(game, row.id)) continue;
        const player = ensure(game, row.id);
        player.runs += row.runs;
        player.high = Math.max(player.high, row.runs);
        player.sixes += row.sixes;
        player.fours += row.fours;
      }
      for (const row of tallied.bowl) {
        if (isFillId(game, row.id)) continue;
        ensure(game, row.id).wickets += row.wickets;
      }
      for (const [id, field] of Object.entries(tallied.field)) {
        if (isFillId(game, id)) continue;
        const player = ensure(game, id);
        player.catches += field.catches;
        player.runOuts += field.runOuts;
      }
    }
  }

  if (!sawGame) return null;
  const players = [...byId.values()];
  return {
    runs: topLeaders(players, "runs"),
    wickets: topLeaders(players, "wickets"),
    catches: topLeaders(players, "catches"),
    highest: topLeaders(players, "high"),
    runOuts: topLeaders(players, "runOuts"),
    sixes: topLeaders(players, "sixes"),
    fours: topLeaders(players, "fours"),
  };
}

/** Fill RF / RA from finished Jimmy fixtures (result.homeRuns / awayRuns). */
export function enrichLadderFromJimmySchool(
  ladder: CricketRow[],
  school: JimmySchool | null | undefined,
): CricketRow[] {
  if (!school || !Array.isArray(school.fixtures) || !Array.isArray(school.teams)) return ladder;
  const names = new Map<string, string>();
  for (const team of school.teams) {
    const id = text(team.id, 40);
    const name = text(team.name, 40);
    if (id && name) names.set(id, name);
  }
  const totals = new Map<string, { runsFor: number; runsAgainst: number }>();
  const bump = (teamId: string, runsFor: number, runsAgainst: number) => {
    const name = names.get(teamId);
    if (!name) return;
    const key = name.toLowerCase();
    const current = totals.get(key) ?? { runsFor: 0, runsAgainst: 0 };
    current.runsFor += runsFor;
    current.runsAgainst += runsAgainst;
    totals.set(key, current);
  };

  let saw = false;
  for (const fixture of school.fixtures) {
    if (fixture.stage && fixture.stage !== "league") continue;
    const result = fixture.result;
    if (!result || !fixture.home || !fixture.away) continue;
    const homeRuns = num(result.homeRuns);
    const awayRuns = num(result.awayRuns);
    if (!homeRuns && !awayRuns) continue;
    saw = true;
    bump(fixture.home, homeRuns, awayRuns);
    bump(fixture.away, awayRuns, homeRuns);
  }
  if (!saw) return ladder;

  return ladder.map((row) => {
    const key = row.team.replace(/\s+/g, " ").trim().toLowerCase();
    const delta = totals.get(key);
    if (!delta) return { ...row, percentage: ladderPercentage(row) };
    const runsFor = row.runsFor > 0 ? row.runsFor : delta.runsFor;
    const runsAgainst = row.runsAgainst > 0 ? row.runsAgainst : delta.runsAgainst;
    const next = { ...row, runsFor, runsAgainst };
    return { ...next, percentage: ladderPercentage(next) };
  });
}

function inningsTotals(game: JimmyGame): { homeScore: number; awayScore: number } | null {
  if (!Array.isArray(game.innings) || !game.rules) return null;
  let homeScore = 0;
  let awayScore = 0;
  let saw = false;
  for (const innings of game.innings) {
    const batting = text(innings.batting, 12);
    if (batting !== "home" && batting !== "away") continue;
    const tallied = tallyInnings(innings, game.rules, !!game.oddsDuel);
    if (batting === "home") homeScore += tallied.total;
    else awayScore += tallied.total;
    saw = true;
  }
  if (!saw) return null;
  return { homeScore, awayScore };
}

/** Attach innings totals onto draw rows — finished results and live in-progress games. */
export function enrichDrawScoresFromJimmySchool(
  draw: CricketFixture[],
  school: JimmySchool | null | undefined,
): CricketFixture[] {
  if (!school || !Array.isArray(school.fixtures) || !Array.isArray(school.teams)) return draw;
  const names = new Map<string, string>();
  for (const team of school.teams) {
    const id = text(team.id, 40);
    const name = text(team.name, 40);
    if (id && name) names.set(id, name);
  }

  const finishedByKey = new Map<string, { homeScore: number; awayScore: number }>();
  const liveByMatch = new Map<string, { homeScore: number; awayScore: number }>();
  for (const fixture of school.fixtures) {
    if (!fixture.home || !fixture.away) continue;
    const home = names.get(fixture.home);
    const away = names.get(fixture.away);
    if (!home || !away) continue;
    const matchKey = `${home.toLowerCase()}|${away.toLowerCase()}`;
    const result = fixture.result;
    if (result) {
      const homeScore = num(result.homeRuns);
      const awayScore = num(result.awayRuns);
      if (!homeScore && !awayScore) continue;
      const key = `${matchKey}|${text(result.text, 80).toLowerCase()}`;
      finishedByKey.set(key, { homeScore, awayScore });
      continue;
    }
    const game = fixture.game;
    if (!game) continue;
    const totals = inningsTotals(game);
    if (!totals) continue;
    if (!totals.homeScore && !totals.awayScore) continue;
    liveByMatch.set(matchKey, totals);
  }
  if (finishedByKey.size === 0 && liveByMatch.size === 0) return draw;

  return draw.map((game) => {
    if (game.homeScore != null || game.awayScore != null) {
      // Still overlay fresher live totals from school when Jimmy omitted scores on the draw.
      return game;
    }
    const matchKey = `${game.home.toLowerCase()}|${game.away.toLowerCase()}`;
    const finished = finishedByKey.get(`${matchKey}|${game.result.toLowerCase()}`);
    if (finished) return { ...game, homeScore: finished.homeScore, awayScore: finished.awayScore };
    const live = liveByMatch.get(matchKey);
    if (live) return { ...game, homeScore: live.homeScore, awayScore: live.awayScore };
    return game;
  });
}

export function parseJimmySchool(raw: unknown): JimmySchool | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as JimmySchool;
}
