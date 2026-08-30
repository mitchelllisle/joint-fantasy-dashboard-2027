#!/usr/bin/env node
/**
 * Fetches FPL Draft API data and writes JSON to src/lib/fetched/.
 * Run before `npm run build`. On failure the committed seed files are used.
 *
 * Usage:  LEAGUE_ID=6371 node scripts/fetch.js
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/lib/fetched');
const LEAGUE_ID = process.env.LEAGUE_ID ?? '6371';

const DRAFT  = 'https://draft.premierleague.com/api';
const FPL    = 'https://fantasy.premierleague.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, */*',
  'Accept-Language': 'en-GB,en;q=0.9',
};

async function get(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}  ${url}`);
  return res.json();
}

function write(name, data) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, name), JSON.stringify(data));
  console.log(`  ✓ ${name}`);
}

console.log(`Fetching FPL data for league ${LEAGUE_ID}…`);

try {
  const [bootstrap, details] = await Promise.all([
    get(`${DRAFT}/bootstrap-static`),
    get(`${DRAFT}/league/${LEAGUE_ID}/details`),
  ]);

  write('bootstrap.json', bootstrap);
  write('details.json', details);

  // Detect current GW
  let currentGW = 1;
  if (Array.isArray(bootstrap.events)) {
    const cur = bootstrap.events.find(e => e.is_current);
    currentGW = cur?.id ?? bootstrap.events.filter(e => e.finished).length;
  } else if (typeof bootstrap.events?.current === 'number') {
    currentGW = bootstrap.events.current;
  }

  // Upcoming PL fixtures (next GW)
  try {
    const fixtures = await get(`${FPL}/fixtures/?event=${currentGW + 1}`);
    write('fixtures.json', fixtures);
  } catch (e) {
    console.warn(`  ⚠ upcoming fixtures skipped: ${e.message}`);
  }

  // Current GW: all fixtures (finished + unfinished) + live scores
  try {
    const [currentGWFix, livePts] = await Promise.all([
      get(`${FPL}/fixtures/?event=${currentGW}`),
      get(`${DRAFT}/event/${currentGW}/live`),
    ]);
    write('currentGWFixtures.json', currentGWFix);
    write('eventLive.json', livePts.elements ?? {});
  } catch (e) {
    console.warn(`  ⚠ current GW fixtures / live data skipped: ${e.message}`);
  }

  // Previous GW (fully completed): fixtures + live scores for player points
  if (currentGW > 1) {
    try {
      const [prevFix, prevLive] = await Promise.all([
        get(`${FPL}/fixtures/?event=${currentGW - 1}`),
        get(`${DRAFT}/event/${currentGW - 1}/live`),
      ]);
      write('prevGWFixtures.json', prevFix.filter(f => f.finished));
      write('prevEventLive.json', prevLive.elements ?? {});
    } catch (e) {
      console.warn(`  ⚠ previous GW fixtures / live data skipped: ${e.message}`);
    }
  }

  // Squad picks for the current GW
  const playerById = Object.fromEntries(
    (bootstrap.elements ?? []).map(p => [p.id, p]),
  );
  const squads = [];
  let picksOk = 0, picksFail = 0;
  await Promise.all(
    (details.league_entries ?? []).map(async (entry) => {
      try {
        const data = await get(`${DRAFT}/entry/${entry.entry_id}/event/${currentGW}`);
        for (const pick of (data.picks ?? [])) {
          const player = playerById[pick.element];
          if (!player) continue;
          squads.push({ ...player, owner: entry.entry_name, team_name: entry.entry_name, position: pick.position });
        }
        picksOk++;
      } catch { picksFail++; }
    }),
  );
  if (picksOk > 0) {
    write('squads.json', squads);
    if (picksFail) console.warn(`  ⚠ ${picksFail} entries failed picks`);
  } else {
    console.warn('  ⚠ no squad data — picks endpoint may require auth');
  }

  console.log(`Done. (GW${currentGW}, ${details.league_entries?.length ?? 0} managers)`);
} catch (e) {
  console.error(`\nFetch failed: ${e.message}`);
  console.error('The build will use the existing cached JSON files.\n');
  process.exit(0);
}
