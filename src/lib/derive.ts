import type { BootstrapStatic } from 'joint-fpl-lib';
import type { MatchResult, SquadPlayer } from 'joint-fpl-lib';
import type { DashboardData, DashboardTeam, FixturesData, MatchFixture, UpcomingFixture, RawMatch, UpcomingGW, UpcomingPLFixture, PreviousGW, PreviousGWFixture } from './types.js';
import type { ExtendedLeagueDetails, DraftEventsWrapper } from './fplExtended.js';
import { PROBS, HUES, POSLAB, teamKey } from './utils.js';
import { teamLogoUrl } from './teamLogos.js';
import { computeRace, computeBump } from './charts.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMatchFixture(
  aTeam: DashboardTeam, bTeam: DashboardTeam,
  aPts: number, bPts: number,
): MatchFixture {
  return {
    key: aTeam.key + bTeam.key,
    aName: aTeam.name, bName: bTeam.name,
    aInit: aTeam.key, bInit: bTeam.key,
    aColor: aTeam.color, bColor: bTeam.color,
    aPts, bPts,
    aFg: aPts >= bPts ? '#f4f4f2' : 'rgba(255,255,255,.4)',
    bFg: bPts >= aPts ? '#f4f4f2' : 'rgba(255,255,255,.4)',
  };
}

function buildFixtures(
  teams: DashboardTeam[],
  ordered: DashboardTeam[],
  rawMatches: RawMatch[],
  entryIdxById: Map<number, number>,
  currentGW: number,
): FixturesData {
  const teamByLeagueId = new Map<number, DashboardTeam>();
  for (const [leagueId, idx] of entryIdxById) teamByLeagueId.set(leagueId, teams[idx]);

  const finished = rawMatches.filter(m => m.finished);
  const unfinished = rawMatches.filter(m => !m.finished);

  const latest: MatchFixture[] = rawMatches
    .filter(m => m.finished && m.event === currentGW)
    .flatMap(m => {
      const a = teamByLeagueId.get(m.league_entry_1);
      const b = teamByLeagueId.get(m.league_entry_2);
      return a && b ? [makeMatchFixture(a, b, m.league_entry_1_points, m.league_entry_2_points)] : [];
    });

  const form5 = (t: DashboardTeam) =>
    t.points.slice(-5).reduce((s, v) => s + v, 0) / Math.max(1, Math.min(5, t.points.length));

  const upcomingGWs = [...new Set(unfinished.map(m => m.event))].sort((a, b) => a - b).slice(0, 3);
  const upcoming = upcomingGWs.map(gw => ({
    key: gw,
    gw,
    games: unfinished.filter(m => m.event === gw).flatMap(m => {
      const a = teamByLeagueId.get(m.league_entry_1);
      const b = teamByLeagueId.get(m.league_entry_2);
      if (!a || !b) return [];
      const fa = form5(a), fb = form5(b), tot = fa + fb || 1;
      const aProb = Math.round(fa / tot * 100);
      return [{ key: a.key + b.key, aName: a.name, bName: b.name, aColor: a.color, bColor: b.color, aProb, bProb: 100 - aProb } as UpcomingFixture];
    }),
  }));

  // H2H record matrix
  const rec: Record<string, Record<string, [number, number, number]>> = {};
  for (const t of ordered) {
    rec[t.key] = {};
    for (const z of ordered) rec[t.key][z.key] = [0, 0, 0];
  }
  for (const m of finished) {
    const a = teamByLeagueId.get(m.league_entry_1);
    const b = teamByLeagueId.get(m.league_entry_2);
    if (!a || !b) continue;
    const pa = m.league_entry_1_points, pb = m.league_entry_2_points;
    const wi = pa > pb ? 0 : pa === pb ? 1 : 2;
    rec[a.key][b.key][wi]++;
    rec[b.key][a.key][wi === 0 ? 2 : wi === 2 ? 0 : 1]++;
  }

  const heads = ordered.map(t => ({ key: t.key, init: t.key, color: t.color }));
  const matrix = ordered.map(t => ({
    key: t.key, name: t.name, init: t.key, color: t.color,
    cells: ordered.map(z => {
      if (z.key === t.key) return { key: z.key, label: '—', bg: 'rgba(255,255,255,.02)', fg: 'rgba(255,255,255,.2)' };
      const [ww, dd, ll] = rec[t.key][z.key];
      return {
        key: z.key, label: `${ww}–${dd}–${ll}`,
        bg: ww > ll ? 'rgba(123,220,181,.13)' : ll > ww ? 'rgba(255,77,22,.13)' : 'rgba(255,255,255,.05)',
        fg: ww > ll ? '#7bdcb5' : ll > ww ? '#ff8f6b' : 'rgba(255,255,255,.6)',
      };
    }),
  }));

  const finishedGWs = [...new Set(finished.map(m => m.event))].sort((a, b) => b - a).slice(0, 6).reverse();
  const archive = finishedGWs.map(gw => ({
    key: gw, gw,
    games: finished.filter(m => m.event === gw).flatMap(m => {
      const a = teamByLeagueId.get(m.league_entry_1);
      const b = teamByLeagueId.get(m.league_entry_2);
      return a && b ? [makeMatchFixture(a, b, m.league_entry_1_points, m.league_entry_2_points)] : [];
    }),
  }));

  return { latest, upcoming, heads, matrix, archive };
}

// ── Current GW detection ──────────────────────────────────────────────────────

function detectCurrentGW(bootstrap: BootstrapStatic): number {
  // The Draft API wraps events in {current, data, next} instead of a flat array
  if (!Array.isArray(bootstrap.events)) {
    const wrapper = bootstrap.events as unknown as DraftEventsWrapper;
    if (typeof wrapper.current === 'number') return wrapper.current;
  }
  const events = bootstrap.events as Array<{ id: number; is_current: boolean; finished: boolean }>;
  const cur = events.find(e => e.is_current);
  if (cur) return cur.id;
  // Fall back to the last finished event
  const lastFinished = [...events].filter(e => e.finished).sort((a, b) => b.id - a.id)[0];
  return lastFinished?.id ?? 1;
}

// ── Upcoming PL fixtures with manager players ─────────────────────────────────

interface RawPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  kickoff_time: string | null;
  finished: boolean;
}

export function buildUpcomingFixtures(
  gw: number,
  rawFixtures: unknown[],
  bootstrap: BootstrapStatic,
  squads: SquadPlayer[],
  ordered: DashboardTeam[],
): UpcomingGW | null {
  if (!rawFixtures.length) return null;
  const fixtures = rawFixtures as RawPLFixture[];

  const plTeamById = new Map(
    (bootstrap.teams as Array<{ id: number; name: string; short_name: string }>)
      .map(t => [t.id, t]),
  );

  // Players grouped by owner (entry_name)
  const squadByOwner = new Map<string, SquadPlayer[]>();
  for (const p of squads) {
    const arr = squadByOwner.get(p.owner) ?? [];
    arr.push(p);
    squadByOwner.set(p.owner, arr);
  }

  function formatKickoff(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[d.getUTCDay()]} ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`;
  }

  const result: UpcomingPLFixture[] = [];

  for (const fix of fixtures) {
    if (fix.finished) continue;
    const home = plTeamById.get(fix.team_h);
    const away = plTeamById.get(fix.team_a);
    if (!home || !away) continue;

    const managers = ordered.flatMap(mgr => {
      const squad = squadByOwner.get(mgr.name) ?? [];
      const players = squad
        .filter(p => p.team === fix.team_h || p.team === fix.team_a)
        .map(p => ({
          name: p.web_name ?? '—',
          pos: POSLAB[(p.element_type ?? 1) - 1] ?? 'MID',
          isStarter: p.position <= 11,
        }))
        .sort((a, b) => (a.isStarter ? 0 : 1) - (b.isStarter ? 0 : 1));
      if (!players.length) return [];
      return [{ teamName: mgr.name, teamKey: mgr.key, color: mgr.color, players }];
    });

    result.push({
      key: fix.id,
      homeTeam: home.name,
      awayTeam: away.name,
      homeShort: home.short_name,
      awayShort: away.short_name,
      homeLogo: teamLogoUrl(home.short_name),
      awayLogo: teamLogoUrl(away.short_name),
      kickoff: formatKickoff(fix.kickoff_time),
      managers,
    });
  }

  return result.length > 0 ? { gw, fixtures: result } : null;
}


// ── Previous GW: completed PL fixtures with per-manager player points ─────────

interface RawCompletedFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
}

export function buildPreviousGWFixtures(
  gw: number,
  completedFixtures: unknown[],
  /** elements object keyed by element id, each with stats and explain breakdown per fixture */
  eventLive: unknown,
  squads: SquadPlayer[],
  bootstrap: BootstrapStatic,
  ordered: DashboardTeam[],
): PreviousGW | null {
  if (!completedFixtures.length) return null;

  // explain entry: [[{stat,points,...}[], fixtureId], ...]
  type ExplainEntry = [[{ points: number }[], number]];
  type LiveElement = { stats: { total_points: number }; explain?: ExplainEntry };
  const live = eventLive as Record<string, LiveElement>;

  // Points for a player in a specific fixture — uses explain array so double-GW
  // fixtures are attributed correctly rather than showing the whole-GW total.
  function fixturePoints(el: LiveElement | undefined, fixtureId: number): number {
    if (!el) return 0;
    const entry = el.explain?.find(([, fId]) => fId === fixtureId);
    return entry
      ? entry[0].reduce((s, { points }) => s + points, 0)
      : el.stats.total_points;
  }
  const plTeamById = new Map(
    (bootstrap.teams as Array<{ id: number; name: string; short_name: string }>).map(t => [t.id, t]),
  );

  const squadByOwner = new Map<string, SquadPlayer[]>();
  for (const p of squads) {
    const arr = squadByOwner.get(p.owner) ?? [];
    arr.push(p);
    squadByOwner.set(p.owner, arr);
  }

  const fixtures: PreviousGWFixture[] = [];

  for (const rawFix of completedFixtures as RawCompletedFixture[]) {
    const home = plTeamById.get(rawFix.team_h);
    const away = plTeamById.get(rawFix.team_a);
    if (!home || !away) continue;

    const managers = ordered.flatMap(mgr => {
      const squad = squadByOwner.get(mgr.name) ?? [];
      const players = squad
        .filter(p => p.team === rawFix.team_h || p.team === rawFix.team_a)
        .map(p => ({
          name: p.web_name ?? '—',
          pos: POSLAB[(p.element_type ?? 1) - 1] ?? 'MID',
          points: fixturePoints(live[String(p.id)], rawFix.id),
          isStarter: p.position <= 11,
        }))
        .sort((a, b) => b.points - a.points);
      if (!players.length) return [];
      return [{
        teamName: mgr.name,
        teamKey: mgr.key,
        color: mgr.color,
        totalPoints: players.filter(p => p.isStarter).reduce((s, p) => s + p.points, 0),
        players,
      }];
    });

    fixtures.push({
      key: rawFix.id,
      homeTeam: home.name,
      awayTeam: away.name,
      homeShort: home.short_name,
      awayShort: away.short_name,
      homeLogo: teamLogoUrl(home.short_name),
      awayLogo: teamLogoUrl(away.short_name),
      homeScore: rawFix.team_h_score,
      awayScore: rawFix.team_a_score,
      managers,
    });
  }

  return { gw, fixtures };
}

export function buildDashboard(
  bootstrap: BootstrapStatic,
  /** Typed as LeagueDetails by joint-fpl-lib; actual API response contains league + matches. */
  detailsRaw: unknown,
  matchResults: MatchResult,
  squads: SquadPlayer[],
): DashboardData {
  // Single validated cast: the API contract guarantees these fields.
  const details = detailsRaw as ExtendedLeagueDetails;

  const entries = [...details.league_entries].sort((a, b) => a.id - b.id);
  const standings = details.standings;
  const rawMatches: RawMatch[] = details.matches ?? [];
  const startEvent = details.league?.start_event ?? 1;
  const currentGW = detectCurrentGW(bootstrap);

  const entryIdxById = new Map(entries.map((e, i) => [e.id, i]));
  // Build early — needed for standings-based pts fallback below
  const standingByLeagueId = new Map(standings.map(s => [s.league_entry, s]));

  // ── Per-GW scores ─────────────────────────────────────────────────────────
  // Priority: rawMatches (has H2H pairings) → matchResults → standings event_total
  const playedFromMatches = rawMatches.filter(m => m.finished).reduce(
    (max, m) => Math.max(max, m.event - startEvent + 1), 0,
  );
  // Include the current in-progress GW so charts show live data even before H2H matches close
  const played = Math.max(playedFromMatches, currentGW - startEvent + 1) || 1;
  const pts: number[][] = entries.map(() => new Array(played).fill(0));
  const oppLeagueId: number[][] = entries.map(() => new Array(played).fill(-1));

  for (const m of rawMatches) {
    if (!m.finished) continue;
    const g = m.event - startEvent;
    if (g < 0 || g >= played) continue;
    const a = entryIdxById.get(m.league_entry_1);
    const b = entryIdxById.get(m.league_entry_2);
    if (a == null || b == null) continue;
    pts[a][g] = m.league_entry_1_points;
    pts[b][g] = m.league_entry_2_points;
    oppLeagueId[a][g] = m.league_entry_2;
    oppLeagueId[b][g] = m.league_entry_1;
  }

  if (rawMatches.length === 0) {
    const byTeam = new Map<string, typeof matchResults.data>();
    for (const d of matchResults.data) {
      const arr = byTeam.get(d.team) ?? [];
      arr.push(d);
      byTeam.set(d.team, arr);
    }
    for (const [i, entry] of entries.entries()) {
      const gwData = (byTeam.get(entry.entry_name) ?? []).sort((a, b) => a.gameweek - b.gameweek);
      gwData.forEach((d, g) => { pts[i][g] = d.points; });
    }
  }

  // Final fallback: derive per-GW scores from standings when no match data exists.
  // standings.event_total = current GW live score; standings.total = cumulative.
  // GW (played-1) = event_total; GW (played-2) = total - event_total.
  if (rawMatches.length === 0 && matchResults.data.length === 0) {
    for (const [i, entry] of entries.entries()) {
      const s = standingByLeagueId.get(entry.id);
      if (!s) continue;
      pts[i][played - 1] = s.event_total ?? 0;
      if (played >= 2) pts[i][played - 2] = Math.max(0, (s.total ?? 0) - (s.event_total ?? 0));
    }
  }

  const cum = pts.map(p => { let s = 0; return p.map(v => (s += v)); });

  // ── H2H results and rank history ──────────────────────────────────────────
  const lp  = entries.map(() => 0);
  const w   = entries.map(() => 0);
  const d   = entries.map(() => 0);
  const l   = entries.map(() => 0);
  const res: ('W' | 'D' | 'L')[][] = entries.map(() => []);
  const rankHist: number[][] = entries.map(() => []);

  const finishedByGW = new Map<number, RawMatch[]>();
  for (const m of rawMatches) {
    if (!m.finished) continue;
    const arr = finishedByGW.get(m.event) ?? [];
    arr.push(m);
    finishedByGW.set(m.event, arr);
  }

  for (let g = 0; g < played; g++) {
    for (const m of finishedByGW.get(g + startEvent) ?? []) {
      const a = entryIdxById.get(m.league_entry_1);
      const b = entryIdxById.get(m.league_entry_2);
      if (a == null || b == null) continue;
      const pa = m.league_entry_1_points, pb = m.league_entry_2_points;
      if (pa > pb)      { lp[a] += 3; w[a]++; l[b]++; res[a][g] = 'W'; res[b][g] = 'L'; }
      else if (pb > pa) { lp[b] += 3; w[b]++; l[a]++; res[b][g] = 'W'; res[a][g] = 'L'; }
      else              { lp[a]++; lp[b]++; d[a]++; d[b]++; res[a][g] = 'D'; res[b][g] = 'D'; }
    }
    const order = entries.map((_, i) => i).sort((x, y) => (lp[y] - lp[x]) || (cum[y][g] - cum[x][g]));
    order.forEach((idx, pos) => { rankHist[idx][g] = pos + 1; });
  }

  // When no match data, seed rankHist from standings so bump chart has something to show
  if (rawMatches.length === 0 && matchResults.data.length === 0) {
    for (const [i, entry] of entries.entries()) {
      const s = standingByLeagueId.get(entry.id);
      if (s && rankHist[i].length === 0) rankHist[i] = [s.rank];
    }
  }

  // ── Weekly field averages (for luck index) ────────────────────────────────
  // luck_gw = my_score_gw − mean(all_scores_gw)
  // luck    = sum across every played GW
  // Positive = consistently above the field; negative = consistently below.
  // Works for any league format. For real H2H leagues rawMatches gives actual
  // opponent scores, but field-average is simpler and format-agnostic.
  const weeklyAvg: number[] = Array.from({ length: played }, (_, g) =>
    pts.reduce((s, tPts) => s + tPts[g], 0) / pts.length,
  );

  // Squad data grouped by owner name
  const squadByTeam = new Map<string, SquadPlayer[]>();
  for (const p of squads) {
    const arr = squadByTeam.get(p.owner) ?? [];
    arr.push(p);
    squadByTeam.set(p.owner, arr);
  }

  const teams: DashboardTeam[] = entries.map((entry, i) => {
    const standing = standingByLeagueId.get(entry.id);
    const rank = standing?.rank ?? rankHist[i]?.[played - 1] ?? i + 1;
    const prev = standing?.last_rank ?? rankHist[i]?.[played - 2] ?? rank;
    const leaguePoints = lp[i];
    const computedTotal = cum[i][played - 1] ?? 0;
    const fplTotal = Math.max(computedTotal, standing?.total ?? 0);

    // Cumulative sum of (my_score − field_average) across all played GWs
    const luck = Math.round(
      pts[i].reduce((sum, p, g) => sum + p - weeklyAvg[g], 0),
    );

    const mySquad = squadByTeam.get(entry.entry_name) ?? [];
    const starters = mySquad.filter(p => p.position <= 11);
    const hasSquad = mySquad.length > 0;

    const posPts = [0, 0, 0, 0];
    for (const p of starters) {
      const ti = (p.element_type ?? 1) - 1;
      if (ti >= 0 && ti < 4) posPts[ti] += p.total_points ?? 0;
    }
    const posTotal = posPts.reduce((a, b) => a + b, 0) || 1;

    const squad = mySquad
      .slice()
      .sort((a, b) => (b.total_points ?? 0) - (a.total_points ?? 0))
      .slice(0, 6)
      .map(p => [POSLAB[(p.element_type ?? 1) - 1] ?? 'MID', p.web_name ?? '—', p.total_points ?? 0] as [string, string, number]);

    const hue = HUES[i % HUES.length];

    return {
      i,
      key: teamKey(entry.entry_name || `Team${i + 1}`, entry.short_name ?? undefined),
      name: entry.entry_name || `Team ${i + 1}`,
      manager: `${entry.player_first_name ?? ''} ${(entry.player_last_name ?? '').charAt(0)}.`.trim(),
      hue,
      color: `oklch(0.78 0.15 ${hue})`,
      points: pts[i],
      cum: cum[i],
      total: fplTotal,
      opponents: oppLeagueId[i].map(oId => (oId >= 0 ? (entryIdxById.get(oId) ?? -1) : -1)),
      lp: leaguePoints,
      w: w[i], d: d[i], l: l[i],
      results: res[i],
      rankHist: rankHist[i],
      rank, prev,
      prob: 0,
      luck,
      bench: hasSquad ? mySquad.filter(p => p.position > 11).reduce((s, p) => s + (p.total_points ?? 0), 0) : null,
      positionMix: hasSquad ? [posPts[0] / posTotal, posPts[1] / posTotal, posPts[2] / posTotal, posPts[3] / posTotal] : null,
      squad: hasSquad ? squad : null,
    };
  });

  const ordered = [...teams].sort((a, b) => a.rank - b.rank);
  ordered.forEach((t, idx) => { t.prob = PROBS[idx] ?? 0; });

  return {
    gw: currentGW,
    gwTotal: 38,
    league: { id: details.league?.id ?? 0, name: details.league?.name ?? 'Draft League' },
    teams,
    ordered,
    fx: buildFixtures(teams, ordered, rawMatches, entryIdxById, currentGW),
    race: computeRace(ordered, played),
    bump: computeBump(teams, played),
    upcoming: null,
    inProgressGW: null,
    currentGWResults: null,
    previousGW: null,
  };
}
