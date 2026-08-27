/**
 * Maps FPL team short_name (from bootstrap.teams) to a logo file in /team-logos/.
 * Teams without a file will show no logo — add the PNG later to fill gaps.
 */
const LOGO_BY_SHORT: Record<string, string> = {
  ARS: 'arsenal',
  AVL: 'aston-villa',
  BOU: 'bournemouth',
  BRE: 'brentford',
  BHA: 'brighton',
  BRI: 'brighton',      // alternate code
  CHE: 'chelsea',
  CRY: 'crystal-palace',
  EVE: 'everton',
  FUL: 'fulham',
  IPS: 'ipswich',
  LEE: 'leeds',
  LEI: 'leicester',
  LIV: 'liverpool',
  MCI: 'man-city',
  MUN: 'man-utd',
  NEW: 'newcastle',
  NFO: 'nottm-forest',
  NOR: 'norwich',
  SHU: 'sheffield-utd',
  SOU: 'southampton',
  SUN: 'sunderland',
  TOT: 'spurs',
  WBA: 'west-brom',
  WHU: 'west-ham',
  WOL: 'wolves',
};

/** Returns a root-relative URL for the team logo, or null if none exists. */
export function teamLogoUrl(shortName: string): string | null {
  const file = LOGO_BY_SHORT[shortName.toUpperCase()];
  return file ? `/team-logos/${file}.png` : null;
}
