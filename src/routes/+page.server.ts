import type { PageServerLoad } from './$types.js';
import { PremierLeagueAPI } from 'joint-fpl-lib';
import type { SquadPlayer, MatchResult } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures } from '$lib/derive.js';
import type { DashboardData } from '$lib/types.js';
import { env } from '$env/dynamic/private';

const LEAGUE_ID = parseInt(env.LEAGUE_ID ?? '6371', 10);

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

export const load: PageServerLoad = async ({ fetch }) => {
  const api = new PremierLeagueAPI();

  // If the FPL API is unreachable (CI rate-limiting, downtime, etc.) return
  // null so prerendering succeeds and the page shows a graceful error state
  // rather than crashing the build with a 502.
  let bootstrap, details;
  try {
    [bootstrap, details] = await Promise.all([
      api.getBootstrapStatic(),
      api.getDetails(LEAGUE_ID),
    ]);
  } catch (e) {
    console.error('FPL API unavailable:', e instanceof Error ? e.message : e);
    return { dashboard: null as DashboardData | null };
  }

  let matchResults: MatchResult = EMPTY_MATCH_RESULT;
  try { matchResults = await api.getMatchResults(LEAGUE_ID); } catch { /* fall back to rawMatches */ }

  let squads: SquadPlayer[] = [];
  try { squads = await api.getSquads(LEAGUE_ID); } catch { /* squad fields will be null */ }

  const dashboard = buildDashboard(bootstrap, details, matchResults, squads);

  const nextGW = dashboard.gw + 1;
  let rawFixtures: unknown[] = [];
  try {
    const res = await fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${nextGW}`);
    if (res.ok) rawFixtures = await res.json() as unknown[];
  } catch { /* fixtures unavailable */ }

  dashboard.upcoming = buildUpcomingFixtures(nextGW, rawFixtures, bootstrap, squads, dashboard.ordered);

  return { dashboard };
};
