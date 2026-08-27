import type { LeagueDetails } from 'joint-fpl-lib';
import type { RawMatch } from './types.js';

/**
 * The FPL Draft API returns richer shapes than joint-fpl-lib's main-entry exports.
 * These interfaces add the fields we rely on that are present in the API response
 * but absent from the published types.
 *
 * Used via `as unknown as ExtendedLeagueDetails` at the single fetch boundary.
 */

export interface ExtendedLeague {
  id: number;
  name: string;
  start_event: number;
}

/** LeagueEntry as returned by the API (entry_name, manager names, short_name) */
export interface ExtendedLeagueEntry {
  id: number;
  entry_id: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
  short_name: string | null;
}

export interface ExtendedLeagueDetails extends Omit<LeagueDetails, 'league_entries'> {
  league: ExtendedLeague;
  matches: RawMatch[];
  league_entries: ExtendedLeagueEntry[];
}

/** Draft API can return events as {current, data, next} rather than a flat GameWeek[] */
export interface DraftEventsWrapper {
  current: number;
  next: number;
  data: Array<{ id: number; is_current: boolean; finished: boolean }>;
}
