export const PROBS = [36, 27, 17, 11, 6, 3];
export const HUES  = [145, 200, 258, 318, 35, 88];
export const POSCOL = ['#e6c34a', '#68b6e8', '#7bdcb5', '#ff4d16'] as const;
export const POSLAB = ['GK', 'DEF', 'MID', 'FWD'] as const;

export function ord(n: number): string {
  const v = n % 100;
  const s = ['th', 'st', 'nd', 'rd'];
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formCells(results: ('W' | 'D' | 'L')[]) {
  return results.slice(-5).map(r => ({
    r,
    bg: r === 'W' ? 'rgba(123,220,181,.18)' : r === 'D' ? 'rgba(255,255,255,.1)' : 'rgba(255,77,22,.18)',
    fg: r === 'W' ? '#7bdcb5' : r === 'D' ? 'rgba(255,255,255,.55)' : '#ff8f6b',
  }));
}

export function streakOf(results: ('W' | 'D' | 'L')[]): string {
  if (!results.length) return '—';
  const last = results[results.length - 1];
  let c = 0;
  for (let i = results.length - 1; i >= 0 && results[i] === last; i--) c++;
  return c + last;
}

/** Generate a 3-letter key from a team name */
export function teamKey(entryName: string, shortName?: string): string {
  if (shortName) return shortName.slice(0, 3).toUpperCase();
  // Acronym from words
  const words = entryName.trim().split(/\s+/);
  if (words.length >= 3) return words.map(w => w[0]).join('').slice(0, 3).toUpperCase();
  if (words.length === 2) return (words[0].slice(0, 2) + words[1][0]).toUpperCase();
  return entryName.slice(0, 3).toUpperCase();
}
