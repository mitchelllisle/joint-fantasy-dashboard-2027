import type { PageServerLoad } from './$types.js';
import type { MatchResult, SquadPlayer } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures, buildPreviousGWFixtures } from '$lib/derive.js';
import type { DashboardData } from '$lib/types.js';

import bootstrap          from '$lib/fetched/bootstrap.json';
import details            from '$lib/fetched/details.json';
import rawFix             from '$lib/fetched/fixtures.json';
import currentGWFixRaw    from '$lib/fetched/currentGWFixtures.json';
import squadsRaw          from '$lib/fetched/squads.json';
import eventLiveRaw       from '$lib/fetched/eventLive.json';
import prevGWFixRaw       from '$lib/fetched/prevGWFixtures.json';
import prevEventLiveRaw   from '$lib/fetched/prevEventLive.json';

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

export const load: PageServerLoad = () => {
  const squads = squadsRaw as unknown as SquadPlayer[];

  const dashboard = buildDashboard(
    bootstrap as never,
    details   as never,
    EMPTY_MATCH_RESULT,
    squads,
  );

  // GW+1: upcoming fixtures for planning
  dashboard.upcoming = buildUpcomingFixtures(
    dashboard.gw + 1,
    rawFix as never[],
    bootstrap as never,
    squads,
    dashboard.ordered,
  );

  const currentGWAll = currentGWFixRaw as Array<{ finished: boolean }>;

  // Current GW unplayed fixtures — shown as "In Progress"
  dashboard.inProgressGW = buildUpcomingFixtures(
    dashboard.gw,
    currentGWAll.filter(f => !f.finished) as never[],
    bootstrap as never,
    squads,
    dashboard.ordered,
  );

  // Current GW completed fixtures — results so far
  dashboard.currentGWResults = buildPreviousGWFixtures(
    dashboard.gw,
    currentGWAll.filter(f => f.finished) as never[],
    eventLiveRaw,
    squads,
    bootstrap as never,
    dashboard.ordered,
  );

  // Previous fully-completed GW results
  dashboard.previousGW = buildPreviousGWFixtures(
    dashboard.gw - 1,
    prevGWFixRaw as never[],
    prevEventLiveRaw,
    squads,
    bootstrap as never,
    dashboard.ordered,
  );

  return { dashboard };
};
