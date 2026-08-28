import type { PageServerLoad } from './$types.js';
import type { MatchResult, SquadPlayer } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures, buildPreviousGWFixtures } from '$lib/derive.js';
import type { DashboardData } from '$lib/types.js';

import bootstrap         from '$lib/fetched/bootstrap.json';
import details           from '$lib/fetched/details.json';
import rawFix            from '$lib/fetched/fixtures.json';
import squadsRaw         from '$lib/fetched/squads.json';
import completedFixRaw   from '$lib/fetched/completedFixtures.json';
import eventLiveRaw      from '$lib/fetched/eventLive.json';

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

export const load: PageServerLoad = () => {
  const squads = squadsRaw as unknown as SquadPlayer[];

  const dashboard = buildDashboard(
    bootstrap as never,
    details   as never,
    EMPTY_MATCH_RESULT,
    squads,
  );

  dashboard.upcoming = buildUpcomingFixtures(
    dashboard.gw + 1,
    rawFix     as never[],
    bootstrap  as never,
    squads,
    dashboard.ordered,
  );

  dashboard.previousGW = buildPreviousGWFixtures(
    dashboard.gw,
    completedFixRaw as never[],
    eventLiveRaw,
    squads,
    bootstrap as never,
    dashboard.ordered,
  );

  return { dashboard };
};
