import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { PremierLeagueAPI } from 'joint-fpl-lib';
import type { SquadPlayer, MatchResult } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures } from '$lib/derive.js';
import { env } from '$env/dynamic/private';

const LEAGUE_ID = parseInt(env.LEAGUE_ID ?? '6371', 10);

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

export const load: PageServerLoad = async ({ fetch }) => {
  const api = new PremierLeagueAPI();

  // bootstrap + details are required; everything else degrades gracefully
  let bootstrap, details;
  try {
    [bootstrap, details] = await Promise.all([
      api.getBootstrapStatic(),
      api.getDetails(LEAGUE_ID),
    ]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw error(502, `FPL API unavailable: ${msg}`);
  }

  // matchResults: history endpoint often requires auth — degrade silently
  let matchResults: MatchResult = EMPTY_MATCH_RESULT;
  try {
    matchResults = await api.getMatchResults(LEAGUE_ID);
  } catch { /* derive.ts falls back to rawMatches */ }

  // Squad/pick data: requires auth on some leagues
  let squads: SquadPlayer[] = [];
  try {
    squads = await api.getSquads(LEAGUE_ID);
  } catch { /* squad fields will be null */ }

  const dashboard = buildDashboard(bootstrap, details, matchResults, squads);

  // Upcoming PL fixtures for the next gameweek
  const nextGW = dashboard.gw + 1;
  let rawFixtures: unknown[] = [];
  try {
    const res = await fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${nextGW}`);
    if (res.ok) rawFixtures = await res.json() as unknown[];
  } catch { /* fixtures unavailable */ }

  dashboard.upcoming = buildUpcomingFixtures(nextGW, rawFixtures, bootstrap, squads, dashboard.ordered);

  return { dashboard };
};
