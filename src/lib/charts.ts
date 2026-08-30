import type { DashboardTeam, RaceChartData, BumpChartData } from './types.js';

export function computeRace(teams: DashboardTeam[], gw: number): RaceChartData {
  const W = 780, H = 300, L = 44, R = 98, T = 16, B = 30;
  const gwCount = teams[0]?.cum.length ?? gw;
  const maxY = Math.max(...teams.map(t => t.total));
  const ticks: number[] = [];
  for (let v = 200; v <= maxY; v += 200) ticks.push(v);

  const x = (i: number) => gwCount <= 1 ? (L + W - R) / 2 : L + (i / (gwCount - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - v / (maxY * 1.04)) * (H - T - B);

  const lines = teams.map(t => ({
    key: t.key,
    color: t.color,
    name: t.name,
    d: t.cum.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
    sw: t.rank === 1 ? 3.2 : 2,
    op: t.rank === 1 ? 1 : 0.72,
    ex: x(gwCount - 1),
    ey: y(t.total),
    labX: (x(gwCount - 1) + 9) / W * 100,
    labY: y(t.total) / H * 100,
  }));

  // Label collision avoidance
  const gap = 6.2;
  const sorted = lines.slice().sort((a, b) => a.labY - b.labY);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].labY - sorted[i - 1].labY < gap) sorted[i].labY = sorted[i - 1].labY + gap;
  }
  const over = sorted[sorted.length - 1].labY - 94;
  if (over > 0) for (let i = sorted.length - 1; i >= 0; i--) sorted[i].labY = Math.max(3, sorted[i].labY - over);

  return {
    vb: `0 0 ${W} ${H}`,
    L, RX: W - R, H, T, B,
    grid: ticks.map(v => ({ key: v, y: y(v), label: v, labX: (L - 9) / W * 100, labY: y(v) / H * 100 })),
    xticks: ([0, 2, 4, 6, 8, 10, 12, gwCount - 1]).filter((v, i, a) => a.indexOf(v) === i && v < gwCount)
      .map(i => ({ key: i, label: `GW${i + 1}`, x: x(i), labX: x(i) / W * 100 })),
    lines,
  };
}

export function computeBump(teams: DashboardTeam[], gwCount: number): BumpChartData {
  const W = 620, H = 340, L = 90, R = 36, T = 28, B = 48;
  const RX = W - R;
  const n = teams.length;
  const x = (i: number) => gwCount <= 1 ? (L + RX) / 2 : L + (i / (gwCount - 1)) * (RX - L);
  const y = (r: number) => T + ((r - 1) / Math.max(n - 1, 1)) * (H - T - B);

  function bumpPath(pts: Array<[number, number]>): string {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      const mx = ((x1 + x2) / 2).toFixed(1);
      d += ` C${mx},${y1.toFixed(1)} ${mx},${y2.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
    }
    return d;
  }

  const xticks = Array.from({ length: gwCount }, (_, i) => ({
    key: i, label: `GW${i + 1}`, x: x(i),
  }));

  return {
    vb: `0 0 ${W} ${H}`,
    L, RX, T, B,
    rows: Array.from({ length: n }, (_, i) => i + 1).map(r => ({
      key: r, label: r, y: y(r),
      labX: (L - 14) / W * 100,
      labY: y(r) / H * 100,
    })),
    xticks,
    lines: teams.map(t => {
      const pts: Array<[number, number]> = t.rankHist.map((r, i) => [x(i), y(r)]);
      const dots = pts.map(([px, py]) => ({ x: px, y: py }));
      const startX = pts[0]?.[0] ?? x(0);
      const startY = pts[0]?.[1] ?? y(t.rank);
      return {
        key: t.key,
        color: t.color,
        init: t.key,
        name: t.name,
        d: bumpPath(pts),
        dots,
        ex: x(gwCount - 1),
        ey: y(t.rank),
        labX: (x(gwCount - 1) + 10) / W * 100,
        labY: y(t.rank) / H * 100,
        startLabX: (startX - 10) / W * 100,
        startLabY: startY / H * 100,
      };
    }),
  };
}
