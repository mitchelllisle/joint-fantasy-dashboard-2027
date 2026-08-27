import type { PageServerLoad } from './$types.js';
import { PremierLeagueAPI } from 'joint-fpl-lib';
import type { SquadPlayer, MatchResult } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures } from '$lib/derive.js';
import type { DashboardData } from '$lib/types.js';
import { env } from '$env/dynamic/private';

const LEAGUE_ID = parseInt(env.LEAGUE_ID ?? '6371', 10);

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

// joint-fpl-lib sends bare fetch with no User-Agent; some environments block it.
// Make the two critical calls ourselves with browser-like headers.
const DRAFT_BASE = 'https://draft.premierleague.com/api';
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, */*',
};

export const load: PageServerLoad = async ({ fetch }) => {
  const api = new PremierLeagueAPI();

  let bootstrap, details;
  try {
    const [bRes, dRes] = await Promise.all([
      fetch(`${DRAFT_BASE}/bootstrap-static`, { headers: BROWSER_HEADERS }),
      fetch(`${DRAFT_BASE}/league/${LEAGUE_ID}/details`, { headers: BROWSER_HEADERS }),
    ]);

    if (!bRes.ok) throw new Error(`bootstrap-static ${bRes.status} ${bRes.statusText}`);
    if (!dRes.ok) throw new Error(`league/details ${dRes.status} ${dRes.statusText}`);

    [bootstrap, details] = await Promise.all([bRes.json(), dRes.json()]);
  } catch (e) {
    console.error('[FPL] Critical fetch failed:', e instanceof Error ? e.message : e);
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
    const res = await fetch(
      `https://fantasy.premierleague.com/api/fixtures/?event=${nextGW}`,
      { headers: BROWSER_HEADERS },
    );
    if (res.ok) rawFixtures = await res.json() as unknown[];
  } catch { /* fixtures unavailable */ }

  dashboard.upcoming = buildUpcomingFixtures(nextGW, rawFixtures, bootstrap, squads, dashboard.ordered);

  return { dashboard };
};
