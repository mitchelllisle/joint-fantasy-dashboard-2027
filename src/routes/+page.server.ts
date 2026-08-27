import type { PageServerLoad } from './$types.js';
import type { MatchResult } from 'joint-fpl-lib';
import { buildDashboard, buildUpcomingFixtures } from '$lib/derive.js';

// Imported at build time from src/lib/fetched/ — populated by scripts/fetch.js
// which runs as a separate workflow step before `npm run build`.
// If the API is down during CI, committed seed files are used instead.
import bootstrap from '$lib/fetched/bootstrap.json';
import details   from '$lib/fetched/details.json';
import rawFix    from '$lib/fetched/fixtures.json';

const EMPTY_MATCH_RESULT: MatchResult = { title: '', sentence: '', data: [] };

export const load: PageServerLoad = () => {
  const dashboard = buildDashboard(
    bootstrap as never,
    details   as never,
    EMPTY_MATCH_RESULT,
    [],        // squads: auth-gated; squad data is null on each team
  );

  dashboard.upcoming = buildUpcomingFixtures(
    dashboard.gw + 1,
    rawFix as never[],
    bootstrap as never,
    [],
    dashboard.ordered,
  );

  return { dashboard };
};
