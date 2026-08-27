#!/usr/bin/env node
/**
 * Fetches FPL Draft API data and writes JSON to src/lib/fetched/.
 * Run before `npm run build`. On failure the committed seed files are used
 * so the build always succeeds with last-known-good data.
 *
 * Usage:
 *   LEAGUE_ID=6371 node scripts/fetch.js
 */

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '../src/lib/fetched');
const LEAGUE_ID = process.env.LEAGUE_ID ?? '6371';

const DRAFT  = 'https://draft.premierleague.com/api';
const FPL    = 'https://fantasy.premierleague.com/api';

// Browser-like headers — bare Node fetch is often rate-limited by the FPL API
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

  // Detect current GW for upcoming fixtures
  let currentGW = 1;
  if (Array.isArray(bootstrap.events)) {
    const cur = bootstrap.events.find(e => e.is_current);
    currentGW = cur?.id ?? bootstrap.events.filter(e => e.finished).length;
  } else if (typeof bootstrap.events?.current === 'number') {
    currentGW = bootstrap.events.current;
  }

  try {
    const fixtures = await get(`${FPL}/fixtures/?event=${currentGW + 1}`);
    write('fixtures.json', fixtures);
  } catch (e) {
    console.warn(`  ⚠ fixtures skipped: ${e.message}`);
  }

  console.log('Done.');
} catch (e) {
  console.error(`\nFetch failed: ${e.message}`);
  console.error('The build will use the existing cached JSON files.\n');
  process.exit(0); // Don't fail the build
}
