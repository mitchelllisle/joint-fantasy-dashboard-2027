<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DashboardData, DashboardTeam } from '$lib/types.js';
  import { POSCOL, POSLAB } from '$lib/utils.js';
  import Avatar from '$lib/components/Avatar.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import ExpandButton from '$lib/components/ExpandButton.svelte';

  export let dashboard: DashboardData;
  export let selectedIdx: number;
  export let banter: boolean;

  const dispatch = createEventDispatcher<{ select: number }>();

  // ── Core unpack ──────────────────────────────────────────────────────────────
  $: gw      = dashboard.gw;
  $: gwTotal = dashboard.gwTotal;
  $: teams   = dashboard.teams;
  $: ordered = dashboard.ordered;
  $: race    = dashboard.race;
  $: bump    = dashboard.bump;

  $: lead   = ordered[0];
  $: second = ordered[1];
  $: last   = ordered[ordered.length - 1];

  $: chasing  = teams.filter(t => t.i !== lead.i);
  $: luckiest = [...teams].sort((a, b) => b.luck - a.luck)[0] ?? lead;

  function rank5(t: DashboardTeam): number {
    return t.rankHist[t.rankHist.length - 6] ?? t.rank;
  }

  $: riser = chasing.length > 0
    ? [...chasing].sort((a, b) => (rank5(b) - b.rank) - (rank5(a) - a.rank))[0] ?? lead
    : lead;

  $: luckyPick = chasing.length > 0
    ? [...chasing].sort((a, b) => b.luck - a.luck)[0] ?? lead
    : lead;

  $: _robbedPool = teams.filter(t => t.i !== lead.i && t.i !== riser.i && t.i !== luckyPick.i);
  $: robbed = [...(_robbedPool.length > 0 ? _robbedPool : teams)]
    .sort((a, b) => a.luck - b.luck)[0] ?? lead;

  // ── Strap text ───────────────────────────────────────────────────────────────
  $: strap = banter
    ? `${lead.name} lead by ${lead.total - second.total} points, but ${luckiest.manager.split(' ')[0]} has been living on borrowed points. ${last.name} are propping up the table with ${last.total} pts.`
    : `${lead.name} top the table on ${lead.total} points from ${gw} gameweeks. ${second.name} trail by ${lead.total - second.total}.`;

  // ── KPI derivations ──────────────────────────────────────────────────────────
  $: leaderNote = banter
    ? lead.rank <= 2 ? 'Insufferable, and entitled to it'
      : lead.rank >= 5 ? 'Rebuilding. Allegedly.'
      : 'Quietly hanging around the play-off places'
    : `${lead.total} FPL points from ${gw} gameweeks`;

  $: riserClimb = rank5(riser) - riser.rank;
  $: riserNote  = banter
    ? `Climbed ${riserClimb} place${riserClimb !== 1 ? 's' : ''} in 5 GW`
    : `+${riserClimb} positions in last 5 GW`;

  $: luckyNote  = banter
    ? `${luckyPick.luck.toFixed(1)} pts above expected score`
    : `+${luckyPick.luck.toFixed(1)} pts vs expected`;

  $: robbedNote = banter
    ? `${Math.abs(robbed.luck).toFixed(1)} pts below what they deserved`
    : `${robbed.luck.toFixed(1)} pts vs expected`;

  $: kpis = [
    {
      accent: '#7bdcb5',
      label: 'Points leader',
      team: lead,
      value: `${lead.total} pts`,
      note: leaderNote,
    },
    {
      accent: '#ffc93c',
      label: 'Biggest riser · 5GW',
      team: riser,
      value: `+${riserClimb} place${riserClimb !== 1 ? 's' : ''}`,
      note: riserNote,
    },
    {
      accent: '#68b6e8',
      label: 'Riding their luck',
      team: luckyPick,
      value: `${luckyPick.luck >= 0 ? '+' : ''}${luckyPick.luck.toFixed(1)} pts`,
      note: luckyNote,
    },
    {
      accent: '#ff4d16',
      label: 'Robbed',
      team: robbed,
      value: `${robbed.luck.toFixed(1)} pts`,
      note: robbedNote,
    },
  ] as const;

  // ── Scatter geometry ─────────────────────────────────────────────────────────
  $: _maxAbsLuck = Math.max(40, ...teams.map(t => Math.abs(t.luck)));
  $: _minTotal   = Math.min(...teams.map(t => t.total));
  $: _maxTotal   = Math.max(...teams.map(t => t.total));
  $: scatterPts  = teams.map(t => {
    const x = 300 + (t.luck / _maxAbsLuck) * 240;
    const y = 292 - ((t.total - _minTotal + 20) / (_maxTotal - _minTotal + 40)) * 258;
    const r = 14 + t.prob * 0.6;
    const shift = x < 470 ? 'translate(14px,-50%)' : 'translate(-100%,-50%) translateX(-14px)';
    return { t, x, y, r, shift };
  });

  // ── Bench ────────────────────────────────────────────────────────────────────
  $: teamsWithBench = teams.filter(t => t.bench !== null);
  $: benchSorted    = [...teamsWithBench].sort((a, b) => (b.bench ?? 0) - (a.bench ?? 0));
  $: maxBench       = benchSorted[0]?.bench ?? 0;
  $: totalBench     = teamsWithBench.reduce((s, t) => s + (t.bench ?? 0), 0);
  $: waster         = benchSorted[0] ?? teams[0];
  $: benchLine      = teamsWithBench.length > 0
    ? banter
      ? `${totalBench} pts died on benches this season — ${waster.manager.split(' ')[0]} is the guiltiest.`
      : 'Bench points wasted per team this season.'
    : '';

  // ── Position mix ─────────────────────────────────────────────────────────────
  $: teamsWithMix = teams.filter(t => t.positionMix !== null);

  // Typed colour lookup helpers (POSCOL is readonly tuple)
  const PC = POSCOL as readonly string[];
  let openModal: string | null = null;
</script>

<!-- ── Section 1: Hero band ─────────────────────────────────────────────────── -->
<div class="hero-band" style="background:linear-gradient(120deg,rgba(255,77,22,.13) 0%,rgba(255,77,22,.03) 55%,transparent 100%),#111113;
  border:1px solid rgba(255,77,22,.18);border-radius:20px;padding:28px 30px;
  display:flex;align-items:center;justify-content:space-between;gap:24px">

  <div style="min-width:0">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="width:6px;height:6px;border-radius:999px;background:#ff4d16"></div>
      <div style="font:500 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.45);letter-spacing:.03em;text-transform:uppercase">
        Gameweek {gw} of {gwTotal} · {ordered.length} managers
      </div>
    </div>
    <div style="font:600 34px/1.05 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.03em">
      The state of play
    </div>
    <div style="font:400 14px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.5);margin-top:10px;
      max-width:600px;text-wrap:pretty">
      {strap}
    </div>
  </div>

  <div class="hero-chips" style="display:flex;gap:10px;flex:none">
    <!-- Gap chip -->
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 20px;min-width:110px">
      <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.04em">Gap 1→2</div>
      <div style="margin-top:10px">
        <span style="font:600 28px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em">{lead.total - second.total}</span>
        <span style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-left:4px">pts</span>
      </div>
    </div>
    <!-- Title favourite chip -->
    <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px 20px;min-width:140px">
      <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.04em">Title favourite</div>
      <div style="font:600 18px/1.1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em;margin-top:10px">
        {lead.name}
      </div>
      <div style="font:500 12px/1 Barlow,sans-serif;color:#ff4d16;margin-top:5px">{lead.prob}% to win</div>
    </div>
  </div>
</div>

<!-- ── Section 2: KPI row ────────────────────────────────────────────────────── -->
<div class="kpi-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:14px">
  {#each kpis as kpi (kpi.label)}
    <div style="background:#111113;border-radius:18px;padding:18px 20px">
      <!-- Accent bars + label -->
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;gap:3px;flex:none">
          {#each [0,1,2] as _}
            <div style="width:14px;height:3px;border-radius:2px;background:{kpi.accent}"></div>
          {/each}
        </div>
        <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.45)">{kpi.label}</div>
      </div>
      <!-- Name (clickable) -->
      <div
        role="button"
        tabindex="0"
        on:click={() => dispatch('select', kpi.team.i)}
        on:keydown={e => e.key === 'Enter' && dispatch('select', kpi.team.i)}
        style="font:600 19px/1.15 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.015em;
          margin-top:13px;cursor:pointer"
      >{kpi.team.name}</div>
      <!-- Value -->
      <div style="font:500 13px/1.3 Barlow,sans-serif;color:{kpi.accent};margin-top:7px">
        {kpi.value}
      </div>
      <!-- Note -->
      <div style="font:400 12px/1.4 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:3px">
        {kpi.note}
      </div>
    </div>
  {/each}
</div>

<!-- ── Section 3: Standings + Good vs Lucky ─────────────────────────────────── -->
<div class="standings-scatter-grid" style="display:grid;grid-template-columns:1fr 1.05fr;gap:14px;margin-top:14px">

  <!-- Standings card -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px 18px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Standings</div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.35)">
          click a row for the manager page
        </div>
        <ExpandButton on:click={() => openModal = 'standings'} />
      </div>
    </div>

    <!-- Grid header -->
    <div class="standings-header-grid" style="display:grid;grid-template-columns:22px 1fr 60px 52px;
      gap:0 9px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.07)">
      {#each ['#','Manager','Pts','Avg/GW'] as col, ci}
        <div class={ci === 3 ? 'col-avg' : ''} style="font:500 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);
          {ci >= 2 ? 'text-align:right' : ''}">
          {col}
        </div>
      {/each}
    </div>

    <!-- Rows -->
    {#each ordered as team (team.i)}
      {@const delta = team.prev - team.rank}
      {@const avg = Math.round(team.total / Math.max(1, dashboard.gw))}
      <div
        class="standings-row standings-row-grid"
        role="button"
        tabindex="0"
        on:click={() => dispatch('select', team.i)}
        on:keydown={e => e.key === 'Enter' && dispatch('select', team.i)}
        style="display:grid;grid-template-columns:22px 1fr 60px 52px;
          gap:0 9px;padding:9px 0;border-radius:10px;cursor:pointer;align-items:center;
          background:{team.i === selectedIdx ? 'rgba(255,255,255,.04)' : 'transparent'}"
      >
        <!-- Rank -->
        <div style="font:600 13px/1 Barlow,sans-serif;color:rgba(255,255,255,.45)">{team.rank}</div>

        <!-- Manager col: Avatar + name/mgr stack + delta -->
        <div style="display:flex;align-items:center;gap:11px;min-width:0;overflow:hidden">
          <Avatar color={team.color} init={team.key} size={30} fontSize={10} />
          <div style="min-width:0;flex:1;overflow:hidden">
            <div style="font:600 13px/1.2 Barlow,sans-serif;color:#f4f4f2;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
            <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.4);margin-top:2px;
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.manager}</div>
          </div>
          <div style="font:500 11px/1 Barlow,sans-serif;flex:none;
            color:{delta > 0 ? '#7bdcb5' : delta < 0 ? '#ff8f6b' : 'rgba(255,255,255,.25)'}">
            {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}
          </div>
        </div>

        <!-- Total pts -->
        <div style="font:600 17px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em;text-align:right">
          {team.total}
        </div>

        <!-- Avg / GW -->
        <div class="col-avg" style="font:500 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.5);text-align:right">
          {avg}
        </div>
      </div>
    {/each}

    <!-- Title race projection -->
    <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.07)">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Title race projection</div>
      <div style="display:grid;grid-template-columns:114px 1fr 40px;gap:11px;
        align-items:center;margin-top:12px">
        {#each ordered as team (team.i)}
          <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
          <div style="height:8px;border-radius:999px;background:rgba(255,255,255,.06)">
            <div style="height:100%;border-radius:999px;background:{team.color};
              width:{(team.prob / 36 * 100).toFixed(1)}%"></div>
          </div>
          <div style="font:600 12.5px/1 Barlow,sans-serif;color:#f4f4f2;text-align:right">
            {team.prob}%
          </div>
        {/each}
      </div>
    </div>

  </div>

<Modal title="Standings" open={openModal === 'standings'} on:close={() => openModal = null}>
  <div style="display:grid;grid-template-columns:22px 1fr 60px 52px;
    gap:0 9px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.07)">
    {#each ['#','Manager','Pts','Avg/GW'] as col, ci}
      <div style="font:500 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);
        {ci >= 2 ? 'text-align:right' : ''}">
        {col}
      </div>
    {/each}
  </div>
  {#each ordered as team (team.i)}
    {@const delta = team.prev - team.rank}
    {@const avg = Math.round(team.total / Math.max(1, dashboard.gw))}
    <div
      class="standings-row"
      role="button"
      tabindex="0"
      on:click={() => dispatch('select', team.i)}
      on:keydown={e => e.key === 'Enter' && dispatch('select', team.i)}
      style="display:grid;grid-template-columns:22px 1fr 60px 52px;
        gap:0 9px;padding:9px 0;border-radius:10px;cursor:pointer;align-items:center;
        background:{team.i === selectedIdx ? 'rgba(255,255,255,.04)' : 'transparent'}"
    >
      <div style="font:600 13px/1 Barlow,sans-serif;color:rgba(255,255,255,.45)">{team.rank}</div>
      <div style="display:flex;align-items:center;gap:11px;min-width:0;overflow:hidden">
        <Avatar color={team.color} init={team.key} size={30} fontSize={10} />
        <div style="min-width:0;flex:1;overflow:hidden">
          <div style="font:600 13px/1.2 Barlow,sans-serif;color:#f4f4f2;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
          <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.4);margin-top:2px;
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.manager}</div>
        </div>
        <div style="font:500 11px/1 Barlow,sans-serif;flex:none;
          color:{delta > 0 ? '#7bdcb5' : delta < 0 ? '#ff8f6b' : 'rgba(255,255,255,.25)'}">
          {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '—'}
        </div>
      </div>
      <div style="font:600 17px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em;text-align:right">
        {team.total}
      </div>
      <div style="font:500 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.5);text-align:right">
        {avg}
      </div>
    </div>
  {/each}
  <div style="margin-top:20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.07)">
    <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Title race projection</div>
    <div style="display:grid;grid-template-columns:114px 1fr 40px;gap:11px;
      align-items:center;margin-top:12px">
      {#each ordered as team (team.i)}
        <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
        <div style="height:8px;border-radius:999px;background:rgba(255,255,255,.06)">
          <div style="height:100%;border-radius:999px;background:{team.color};
            width:{(team.prob / 36 * 100).toFixed(1)}%"></div>
        </div>
        <div style="font:600 12.5px/1 Barlow,sans-serif;color:#f4f4f2;text-align:right">
          {team.prob}%
        </div>
      {/each}
    </div>
  </div>
</Modal>

  <!-- Good vs Lucky scatter -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px 18px">

    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Good vs Lucky</div>
        <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.45);
          background:#1a1a1d;border-radius:999px;padding:4px 10px">bubble = title odds</div>
      </div>
      <ExpandButton on:click={() => openModal = 'scatter'} />
    </div>
    <div style="font:400 13px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.4);
      max-width:520px;margin-top:6px">
      X axis: cumulative points above/below the weekly field average — positive means consistently
      outscoring the room, negative means consistently trailing it. Y axis: total FPL points.
    </div>

    <div style="position:relative;margin-top:14px">
      <svg viewBox="0 0 600 320" style="width:100%;height:auto;display:block">
        <!-- Crosshair -->
        <line x1="300" y1="10"  x2="300" y2="304" stroke="rgba(255,255,255,.1)" stroke-dasharray="3 5" />
        <line x1="16"  y1="160" x2="584" y2="160" stroke="rgba(255,255,255,.1)" stroke-dasharray="3 5" />
        <!-- Bubbles + dots -->
        {#each scatterPts as sp (sp.t.i)}
          <circle cx={sp.x} cy={sp.y} r={sp.r}  fill={sp.t.color} opacity="0.16" />
          <circle cx={sp.x} cy={sp.y} r="6"      fill={sp.t.color} />
        {/each}
      </svg>

      <!-- Corner chips -->
      <div style="position:absolute;top:12px;left:12px;pointer-events:none;
        font:600 10px/1 Barlow,sans-serif;color:#111;
        background:#7bdcb5;border-radius:999px;padding:4px 8px">Robbed</div>
      <div style="position:absolute;top:12px;right:12px;pointer-events:none;
        font:600 10px/1 Barlow,sans-serif;color:#111;
        background:#ffc93c;border-radius:999px;padding:4px 8px">Deserved</div>
      <div style="position:absolute;bottom:12px;right:12px;pointer-events:none;
        font:600 10px/1 Barlow,sans-serif;color:#fff;
        background:#ff4d16;border-radius:999px;padding:4px 8px">Fraudulent</div>
      <div style="position:absolute;bottom:12px;left:12px;pointer-events:none;
        font:600 10px/1 Barlow,sans-serif;color:#fff;
        background:#7bdcb5;opacity:.55;border-radius:999px;padding:4px 8px">Relegated</div>

      <!-- Axis labels -->
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);white-space:nowrap;pointer-events:none">
        ← below field avg &nbsp;&nbsp; above field avg →
      </div>
      <div style="position:absolute;top:50%;left:0;transform:translateY(-50%) rotate(-90deg);transform-origin:left center;
        font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);white-space:nowrap;pointer-events:none">
        season total ↑
      </div>

      <!-- Per-team labels -->
      {#each scatterPts as sp (sp.t.i)}
        <div style="position:absolute;
          left:{(sp.x / 600 * 100).toFixed(2)}%;
          top:{(sp.y / 320 * 100).toFixed(2)}%;
          transform:{sp.shift};
          pointer-events:none;white-space:nowrap">
          <div style="font:600 11px/1.2 Barlow,sans-serif;color:#f4f4f2">{sp.t.name}</div>
          <div style="font:400 10px/1.2 Barlow,sans-serif;color:rgba(255,255,255,.45);margin-top:2px">
            {sp.t.luck >= 0 ? '+' : ''}{sp.t.luck.toFixed(1)} pts
          </div>
        </div>
      {/each}
    </div>

  </div>

<Modal title="Good vs Lucky" open={openModal === 'scatter'} on:close={() => openModal = null}>
  <div style="position:relative">
    <svg viewBox="0 0 600 320" style="width:100%;height:auto;display:block">
      <line x1="300" y1="10"  x2="300" y2="304" stroke="rgba(255,255,255,.1)" stroke-dasharray="3 5" />
      <line x1="16"  y1="160" x2="584" y2="160" stroke="rgba(255,255,255,.1)" stroke-dasharray="3 5" />
      {#each scatterPts as sp (sp.t.i)}
        <circle cx={sp.x} cy={sp.y} r={sp.r}  fill={sp.t.color} opacity="0.16" />
        <circle cx={sp.x} cy={sp.y} r="6"      fill={sp.t.color} />
      {/each}
    </svg>
    <div style="position:absolute;top:12px;left:12px;pointer-events:none;
      font:600 10px/1 Barlow,sans-serif;color:#111;
      background:#7bdcb5;border-radius:999px;padding:4px 8px">Robbed</div>
    <div style="position:absolute;top:12px;right:12px;pointer-events:none;
      font:600 10px/1 Barlow,sans-serif;color:#111;
      background:#ffc93c;border-radius:999px;padding:4px 8px">Deserved</div>
    <div style="position:absolute;bottom:12px;right:12px;pointer-events:none;
      font:600 10px/1 Barlow,sans-serif;color:#fff;
      background:#ff4d16;border-radius:999px;padding:4px 8px">Fraudulent</div>
    <div style="position:absolute;bottom:12px;left:12px;pointer-events:none;
      font:600 10px/1 Barlow,sans-serif;color:#fff;
      background:#7bdcb5;opacity:.55;border-radius:999px;padding:4px 8px">Relegated</div>
    <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
      font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);white-space:nowrap;pointer-events:none">
      ← below field avg &nbsp;&nbsp; above field avg →
    </div>
    <div style="position:absolute;top:50%;left:0;transform:translateY(-50%) rotate(-90deg);transform-origin:left center;
      font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);white-space:nowrap;pointer-events:none">
      season total ↑
    </div>
    {#each scatterPts as sp (sp.t.i)}
      <div style="position:absolute;
        left:{(sp.x / 600 * 100).toFixed(2)}%;
        top:{(sp.y / 320 * 100).toFixed(2)}%;
        transform:{sp.shift};
        pointer-events:none;white-space:nowrap">
        <div style="font:600 11px/1.2 Barlow,sans-serif;color:#f4f4f2">{sp.t.name}</div>
        <div style="font:400 10px/1.2 Barlow,sans-serif;color:rgba(255,255,255,.45);margin-top:2px">
          {sp.t.luck >= 0 ? '+' : ''}{sp.t.luck.toFixed(1)} pts
        </div>
      </div>
    {/each}
  </div>
</Modal>

</div>

<!-- ── Section 4: Race chart + Bump chart ────────────────────────────────────── -->
<div class="charts-row" style="display:grid;grid-template-columns:1.35fr 1fr;gap:14px;margin-top:14px">

  <!-- Race chart -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Points race</div>
      <ExpandButton on:click={() => openModal = 'race'} />
    </div>
    <div style="position:relative">
      <svg viewBox={race.vb} style="width:100%;height:auto;display:block">
        <!-- Gridlines -->
        {#each race.grid as g (g.key)}
          <line x1={race.L} y1={g.y} x2={race.RX} y2={g.y}
            stroke="rgba(255,255,255,.06)" stroke-width="1" />
        {/each}
        <!-- Y-axis labels — inside the SVG left-inset so they can't be clipped -->
        {#each race.grid as g (g.key)}
          <text x={race.L - 6} y={g.y}
            text-anchor="end" dominant-baseline="middle"
            font-family="Barlow, sans-serif" font-size="11" font-weight="400"
            fill="rgba(255,255,255,.32)">{g.label}</text>
        {/each}
        <!-- Team lines + end dots -->
        {#each race.lines as line (line.key)}
          <path d={line.d} fill="none" stroke={line.color}
            stroke-width={line.sw} opacity={line.op}
            stroke-linecap="round" stroke-linejoin="round" />
          <circle cx={line.ex} cy={line.ey} r="6" fill={line.color} opacity={line.op} />
        {/each}
        <!-- X-tick labels -->
        {#each race.xticks as xt (xt.key)}
          <text x={xt.x} y={race.H - 2}
            text-anchor="middle"
            font-family="Barlow, sans-serif" font-size="11" font-weight="400"
            fill="rgba(255,255,255,.28)">{xt.label}</text>
        {/each}
      </svg>

      <!-- End labels (HTML for colour + collision-avoidance positions) -->
      {#each race.lines as line (line.key)}
        <div style="position:absolute;left:{line.labX.toFixed(2)}%;top:{line.labY.toFixed(2)}%;
          transform:translateY(-50%);
          font:500 11px/1 Barlow,sans-serif;color:{line.color};
          white-space:nowrap;pointer-events:none;opacity:{line.op}">
          {line.name}
        </div>
      {/each}
    </div>
  </div>

<Modal title="Cumulative points race" open={openModal === 'race'} on:close={() => openModal = null}>
  <div style="position:relative">
    <svg viewBox={race.vb} style="width:100%;height:auto;display:block">
      {#each race.grid as g (g.key)}
        <line x1={race.L} y1={g.y} x2={race.RX} y2={g.y}
          stroke="rgba(255,255,255,.06)" stroke-width="1" />
      {/each}
      {#each race.grid as g (g.key)}
        <text x={race.L - 6} y={g.y}
          text-anchor="end" dominant-baseline="middle"
          font-family="Barlow, sans-serif" font-size="11" font-weight="400"
          fill="rgba(255,255,255,.32)">{g.label}</text>
      {/each}
      {#each race.lines as line (line.key)}
        <path d={line.d} fill="none" stroke={line.color}
          stroke-width={line.sw} opacity={line.op}
          stroke-linecap="round" stroke-linejoin="round" />
        <circle cx={line.ex} cy={line.ey} r="6" fill={line.color} opacity={line.op} />
      {/each}
      {#each race.xticks as xt (xt.key)}
        <text x={xt.x} y={race.H - 2}
          text-anchor="middle"
          font-family="Barlow, sans-serif" font-size="11" font-weight="400"
          fill="rgba(255,255,255,.28)">{xt.label}</text>
      {/each}
    </svg>
    {#each race.lines as line (line.key)}
      <div style="position:absolute;left:{line.labX.toFixed(2)}%;top:{line.labY.toFixed(2)}%;
        transform:translateY(-50%);
        font:500 11px/1 Barlow,sans-serif;color:{line.color};
        white-space:nowrap;pointer-events:none;opacity:{line.op}">
        {line.name}
      </div>
    {/each}
  </div>
</Modal>

  <!-- Bump chart -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Rank history</div>
      <ExpandButton on:click={() => openModal = 'bump'} />
    </div>
    <div style="position:relative">
      <svg viewBox={bump.vb} style="width:100%;height:auto;display:block">
        <!-- Rank labels — inside SVG left-inset -->
        {#each bump.rows as row (row.key)}
          <text x={bump.L - 8} y={row.y}
            text-anchor="end" dominant-baseline="middle"
            font-family="Barlow, sans-serif" font-size="11" font-weight="400"
            fill="rgba(255,255,255,.3)">{row.label}</text>
        {/each}
        {#each bump.lines as line (line.key)}
          <path d={line.d} fill="none" stroke={line.color}
            stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx={line.ex} cy={line.ey} r="12" fill={line.color} />
        {/each}
      </svg>

      <!-- Team key labels centred on end circles -->
      {#each bump.lines as line (line.key)}
        <div style="position:absolute;left:{line.labX.toFixed(2)}%;top:{line.labY.toFixed(2)}%;
          transform:translate(-50%,-50%);
          font:700 9px/1 Barlow,sans-serif;color:#0b0b0c;
          pointer-events:none;white-space:nowrap">
          {line.init}
        </div>
      {/each}
    </div>
  </div>

<Modal title="Rank history" open={openModal === 'bump'} on:close={() => openModal = null}>
  <div style="position:relative">
    <svg viewBox={bump.vb} style="width:100%;height:auto;display:block">
      {#each bump.rows as row (row.key)}
        <text x={bump.L - 8} y={row.y}
          text-anchor="end" dominant-baseline="middle"
          font-family="Barlow, sans-serif" font-size="11" font-weight="400"
          fill="rgba(255,255,255,.3)">{row.label}</text>
      {/each}
      {#each bump.lines as line (line.key)}
        <path d={line.d} fill="none" stroke={line.color}
          stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx={line.ex} cy={line.ey} r="12" fill={line.color} />
      {/each}
    </svg>
    {#each bump.lines as line (line.key)}
      <div style="position:absolute;left:{line.labX.toFixed(2)}%;top:{line.labY.toFixed(2)}%;
        transform:translate(-50%,-50%);
        font:700 9px/1 Barlow,sans-serif;color:#0b0b0c;
        pointer-events:none;white-space:nowrap">
        {line.init}
      </div>
    {/each}
  </div>
</Modal>

</div>

<!-- ── Section 5: Bottom row ──────────────────────────────────────────────────── -->
<div class="bottom-row" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">

  <!-- Bench wasted -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Bench wasted</div>
      <ExpandButton on:click={() => openModal = 'bench'} />
    </div>

    {#if teamsWithBench.length > 0}
      <div style="font:400 12px/1.4 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:6px">
        {benchLine}
      </div>
      <div style="margin-top:14px;display:flex;flex-direction:column;gap:9px">
        {#each benchSorted as team (team.i)}
          <div style="display:grid;grid-template-columns:92px 1fr 34px;gap:10px;align-items:center">
            <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);
              white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
            <div style="height:9px;border-radius:999px;background:rgba(255,255,255,.06)">
              <div style="height:100%;border-radius:999px;background:#ff4d16;
                width:{maxBench > 0 ? ((team.bench ?? 0) / maxBench * 100).toFixed(1) : 0}%">
              </div>
            </div>
            <div style="font:600 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);text-align:right">
              {team.bench}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);
        text-align:center;padding:24px 0">
        Squad data not yet available
      </div>
    {/if}
  </div>

<Modal title="Bench wasted" open={openModal === 'bench'} on:close={() => openModal = null}>
  {#if teamsWithBench.length > 0}
    <div style="font:400 12px/1.4 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:6px">
      {benchLine}
    </div>
    <div style="margin-top:14px;display:flex;flex-direction:column;gap:9px">
      {#each benchSorted as team (team.i)}
        <div style="display:grid;grid-template-columns:92px 1fr 34px;gap:10px;align-items:center">
          <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{team.name}</div>
          <div style="height:9px;border-radius:999px;background:rgba(255,255,255,.06)">
            <div style="height:100%;border-radius:999px;background:#ff4d16;
              width:{maxBench > 0 ? ((team.bench ?? 0) / maxBench * 100).toFixed(1) : 0}%">
            </div>
          </div>
          <div style="font:600 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6);text-align:right">
            {team.bench}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);
      text-align:center;padding:24px 0">
      Squad data not yet available
    </div>
  {/if}
</Modal>

  <!-- Position mix -->
  <div style="background:#111113;border-radius:20px;padding:22px 24px">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Position mix</div>
      <ExpandButton on:click={() => openModal = 'posmix'} />
    </div>

    {#if teamsWithMix.length > 0}
      <!-- Legend -->
      <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
        {#each POSLAB as lab, i}
          <div style="display:flex;align-items:center;gap:5px">
            <div style="width:8px;height:8px;border-radius:50%;background:{PC[i]}"></div>
            <span style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">{lab}</span>
          </div>
        {/each}
      </div>
      <!-- Bars per team -->
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
        {#each ordered as team (team.i)}
          {#if team.positionMix !== null}
            {@const mix = team.positionMix}
            {@const mixTotal = mix[0] + mix[1] + mix[2] + mix[3]}
            <div>
              <div style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.55);
                margin-bottom:5px">{team.name}</div>
              <div style="display:flex;height:14px;border-radius:4px;overflow:hidden">
                {#each mix as frac, pi}
                  {#if frac > 0}
                    {@const segPts = Math.round(frac * team.total)}
                    <div style="flex:{frac};background:{PC[pi]};
                      display:flex;align-items:center;justify-content:center;
                      min-width:0;overflow:hidden">
                      {#if frac > 0.08}
                        <span style="font:600 9px/1 Barlow,sans-serif;color:rgba(11,11,12,.8)">
                          {segPts}
                        </span>
                      {/if}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {:else}
      <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);
        text-align:center;padding:24px 0">
        Squad data not yet available
      </div>
    {/if}
  </div>

<Modal title="Where the points come from" open={openModal === 'posmix'} on:close={() => openModal = null}>
  {#if teamsWithMix.length > 0}
    <div style="display:flex;gap:12px;margin-top:10px;flex-wrap:wrap">
      {#each POSLAB as lab, i}
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:8px;height:8px;border-radius:50%;background:{PC[i]}"></div>
          <span style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">{lab}</span>
        </div>
      {/each}
    </div>
    <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">
      {#each ordered as team (team.i)}
        {#if team.positionMix !== null}
          {@const mix = team.positionMix}
          {@const mixTotal = mix[0] + mix[1] + mix[2] + mix[3]}
          <div>
            <div style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.55);
              margin-bottom:5px">{team.name}</div>
            <div style="display:flex;height:14px;border-radius:4px;overflow:hidden">
              {#each mix as frac, pi}
                {#if frac > 0}
                  {@const segPts = Math.round(frac * team.total)}
                  <div style="flex:{frac};background:{PC[pi]};
                    display:flex;align-items:center;justify-content:center;
                    min-width:0;overflow:hidden">
                    {#if frac > 0.08}
                      <span style="font:600 9px/1 Barlow,sans-serif;color:rgba(11,11,12,.8)">
                        {segPts}
                      </span>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {:else}
    <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);
      text-align:center;padding:24px 0">
      Squad data not yet available
    </div>
  {/if}
</Modal>


</div>
