// ── Raw FPL Draft API shapes not fully typed in joint-fpl-lib ─────────────────

export interface RawMatch {
  id: number;
  event: number;
  finished: boolean;
  started: boolean;
  league_entry_1: number;
  league_entry_2: number;
  league_entry_1_points: number;
  league_entry_2_points: number;
}

// ── Dashboard domain model ─────────────────────────────────────────────────────

export interface DashboardTeam {
  /** Index into the raw (unsorted) teams array */
  i: number;
  /** 3-letter avatar code */
  key: string;
  /** Team name */
  name: string;
  /** Human manager name, e.g. "Mitchell L." */
  manager: string;
  hue: number;
  color: string;

  // Per-GW arrays (length = gwPlayed)
  points: number[];
  cum: number[];
  opponents: number[];

  // Derived season stats
  total: number;
  lp: number;
  w: number;
  d: number;
  l: number;
  results: ('W' | 'D' | 'L')[];
  rankHist: number[];
  rank: number;
  prev: number;
  prob: number;
  luck: number;

  // From squad/picks (null when not available)
  bench: number | null;
  positionMix: [number, number, number, number] | null;
  squad: Array<[string, string, number]> | null; // [pos, name, total_pts]
}

// ── Fixtures ───────────────────────────────────────────────────────────────────

export interface MatchFixture {
  key: string;
  aName: string; bName: string;
  aInit: string; bInit: string;
  aColor: string; bColor: string;
  aPts: number; bPts: number;
  aFg: string; bFg: string;
}

export interface UpcomingFixture {
  key: string;
  aName: string; bName: string;
  aColor: string; bColor: string;
  aProb: number; bProb: number;
}

export interface GWBlock<T> {
  key: number;
  gw: number;
  games: T[];
}

export interface MatrixCell {
  key: string;
  label: string;
  bg: string;
  fg: string;
}

export interface MatrixRow {
  key: string;
  name: string;
  init: string;
  color: string;
  cells: MatrixCell[];
}

export interface FixturesData {
  latest: MatchFixture[];
  upcoming: GWBlock<UpcomingFixture>[];
  heads: Array<{ key: string; init: string; color: string }>;
  matrix: MatrixRow[];
  archive: GWBlock<MatchFixture>[];
}

// ── Chart data ─────────────────────────────────────────────────────────────────

export interface RaceChartData {
  vb: string;
  L: number; RX: number; H: number; T: number; B: number;
  grid: Array<{ key: number; y: number; label: number; labX: number; labY: number }>;
  xticks: Array<{ key: number; label: string; x: number; labX: number }>;
  lines: Array<{
    key: string; color: string; name: string;
    d: string; sw: number; op: number;
    ex: number; ey: number;
    labX: number; labY: number;
  }>;
}

export interface BumpChartData {
  vb: string;
  L: number; RX: number; T: number; B: number;
  rows: Array<{ key: number; label: number; y: number; labX: number; labY: number }>;
  xticks: Array<{ key: number; label: string; x: number }>;
  lines: Array<{
    key: string; color: string; init: string; name: string;
    d: string;
    dots: Array<{ x: number; y: number }>;
    ex: number; ey: number;
    labX: number; labY: number;
    startLabX: number; startLabY: number;
  }>;
}




// ── Upcoming PL fixtures ──────────────────────────────────────────────────────

export interface UpcomingManagerEntry {
  teamName: string;
  teamKey: string;
  color: string;
  players: Array<{ name: string; pos: string; isStarter: boolean }>;
}

export interface UpcomingPLFixture {
  key: number;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeLogo: string | null;
  awayLogo: string | null;
  kickoff: string | null;
  managers: UpcomingManagerEntry[];
}

export interface UpcomingGW {
  gw: number;
  fixtures: UpcomingPLFixture[];
}
// ── Previous GW results ───────────────────────────────────────────────────────

export interface PreviousGWPlayer {
  name: string;
  pos: string;
  points: number;
  isStarter: boolean;
}

export interface PreviousGWManager {
  teamName: string;
  teamKey: string;
  color: string;
  totalPoints: number;
  players: PreviousGWPlayer[];
}

export interface PreviousGWFixture {
  key: number;
  homeTeam: string;
  awayTeam: string;
  homeShort: string;
  awayShort: string;
  homeLogo: string | null;
  awayLogo: string | null;
  homeScore: number | null;
  awayScore: number | null;
  managers: PreviousGWManager[];
}

export interface PreviousGW {
  gw: number;
  fixtures: PreviousGWFixture[];
}


export interface DashboardData {
  gw: number;
  gwTotal: number;
  league: { id: number; name: string };
  /** Raw order (by league entry sort) */
  teams: DashboardTeam[];
  /** Sorted by rank ascending */
  ordered: DashboardTeam[];
  fx: FixturesData;
  race: RaceChartData;
  bump: BumpChartData;
  upcoming: UpcomingGW | null;
  /** Unplayed fixtures remaining in the current GW */
  inProgressGW: UpcomingGW | null;
  /** Completed fixtures within the current in-progress GW */
  currentGWResults: PreviousGW | null;
  /** Fully completed previous GW results */
  previousGW: PreviousGW | null;
}
