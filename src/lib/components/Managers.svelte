<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { DashboardData } from '$lib/types.js';
  import { ord, streakOf, POSCOL, POSLAB } from '$lib/utils.js';
  import Avatar from '$lib/components/Avatar.svelte';

  export let dashboard: DashboardData;
  export let selectedIdx: number;
  export let banter: boolean;

  const dispatch = createEventDispatcher<{ select: number }>();

  $: sel = dashboard.teams[selectedIdx] ?? dashboard.ordered[0];
  $: ordered = dashboard.ordered;
  $: selAvg = Math.round(sel.total / dashboard.gw);
  $: maxGw = Math.max(1, ...dashboard.teams.flatMap(t => t.points));
  $: avgBottom = Math.min(100, Math.round(selAvg / maxGw * 100));

  $: verdict = banter
    ? (sel.rank <= 2
        ? 'Insufferable, and entitled to it'
        : sel.rank >= 5
          ? 'Rebuilding. Allegedly.'
          : 'Quietly hanging around the play-off places')
    : `${sel.total} FPL points from ${dashboard.gw} gameweeks`;

  $: topPts = sel.squad ? Math.max(1, sel.squad[0][2]) : 1;

  $: squadNote = sel.squad
    ? (banter
        ? `${sel.squad[0][1]} is carrying this squad on his back. ${sel.bench ?? 0} points have died on the bench — roughly ${Math.round((sel.bench ?? 0) / Math.max(selAvg, 1))} gameweeks' worth of shrugging.`
        : `Top contributor ${sel.squad[0][1]} (${sel.squad[0][2]} pts). Bench waste of ${sel.bench ?? 0} points.`)
    : null;

  $: mxMix = sel.positionMix ? Math.max(1, ...sel.positionMix) : 1;

  const BLOCK_BG = ['#ff4d16', '#ffc93c', '#f4f4f2', 'rgba(255,255,255,.14)'] as const;
  const BLOCK_FG = ['#fff', '#1a1207', '#111', 'rgba(255,255,255,.65)'] as const;

  function luckColor(luck: number): string {
    return luck > 8 ? '#7bdcb5' : luck < -8 ? '#ff8f6b' : 'rgba(255,255,255,.45)';
  }

  function barColor(result: 'W' | 'D' | 'L' | undefined, teamColor: string): string {
    if (!result) return teamColor;
    return result === 'W' ? teamColor : result === 'D' ? 'rgba(255,255,255,.28)' : 'rgba(255,77,22,.55)';
  }

  function keyActivate(handler: () => void): (e: KeyboardEvent) => void {
    return (e) => {
      if (!e.repeat && (e.key === 'Enter' || e.key === ' ' || e.code === 'Space')) {
        e.preventDefault();
        handler();
      }
    };
  }
</script>

<style>
  @media (max-width: 768px) {
    /* Grid → single column; force items to not overflow */
    .managers-main-grid { grid-template-columns: 1fr !important; }
    .managers-main-grid > * { min-width: 0 !important; overflow: hidden; }

    .mgr-left-panel { padding: 14px !important; }

    /* Manager picker: horizontal scroll row */
    .mgr-picker { flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; padding-bottom: 6px; -webkit-overflow-scrolling: touch; }
    .mgr-picker-item { flex: none !important; width: 160px !important; }

    /* Profile header: stack avatar/name above stat chips */
    .profile-header { flex-direction: column !important; align-items: flex-start !important; gap: 14px !important; }

    /* Stat chips: 2-column grid filling full width */
    .stats-chips { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; width: 100% !important; flex: unset !important; }
    .stats-chip { min-width: 0 !important; padding: 10px 12px !important; }

    /* Inner content rows: single column */
    .mgr-row1 { grid-template-columns: 1fr !important; }
    .mgr-row2 { grid-template-columns: 1fr !important; }
  }
</style>

<div class="managers-main-grid" style="display:grid;grid-template-columns:300px 1fr;gap:14px;align-items:start">

  <!-- ── Left panel: Manager list ───────────────────────────────────────── -->
  <div class="mgr-left-panel" style="background:#111113;border-radius:20px;padding:18px 18px 20px">
    <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Managers</div>
    <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:3px">Ranked by total points</div>
    <div class="mgr-picker" style="display:flex;flex-direction:column;gap:6px;margin-top:14px">
      {#each ordered as t}
        <div
          class="mgr-row mgr-picker-item"
          role="button"
          tabindex="0"
          on:click={() => dispatch('select', t.i)}
          on:keydown={keyActivate(() => dispatch('select', t.i))}
          style="display:grid;grid-template-columns:34px 1fr 48px;gap:11px;padding:11px 12px;
            border-radius:14px;cursor:pointer;
            background:{t.i === sel.i ? 'rgba(255,255,255,.06)' : '#17171a'};
            border:1px solid {t.i === sel.i ? 'rgba(255,255,255,.14)' : 'transparent'}"
        >
          <Avatar color={t.color} init={t.key} size={34} fontSize={11} />
          <div>
            <div style="font:500 13.5px/1.2 Barlow,sans-serif;color:#f4f4f2">{t.name}</div>
            <div style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:2px">{ord(t.rank)} · {t.total} pts</div>
          </div>
          <div style="font:600 12px/1 Barlow,sans-serif;color:{luckColor(t.luck)};text-align:right;align-self:center">
            {t.luck > 0 ? '+' : ''}{t.luck.toFixed(1)}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- ── Right panel ────────────────────────────────────────────────────── -->
  <div style="display:flex;flex-direction:column;gap:14px">

    <!-- Profile header card -->
    <div class="profile-header" style="background:#111113;border-radius:20px;padding:22px 24px;display:flex;align-items:flex-end;justify-content:space-between;gap:20px">
      <!-- Avatar + identity -->
      <div style="display:flex;align-items:flex-end;gap:16px">
        <Avatar color={sel.color} init={sel.key} size={56} fontSize={16} />
        <div>
          <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">
            {ord(sel.rank)} of {ordered.length}
          </div>
          <div style="font:600 30px/1.05 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.025em;margin-top:6px">
            {sel.name}
          </div>
          <div style="font:400 13px/1 Barlow,sans-serif;color:rgba(255,255,255,.45);margin-top:4px">
            {sel.manager} · {verdict}
          </div>
        </div>
      </div>
      <!-- Stat chips -->
      <div class="stats-chips" style="display:flex;gap:12px;flex:none">
        {#each [
          { label: 'Total pts',   value: String(sel.total),                                               bar: '#7bdcb5' },
          { label: 'Avg / GW',    value: String(selAvg),                                                  bar: '#ffc93c' },
          { label: 'vs field avg',value: (sel.luck >= 0 ? '+' : '') + sel.luck.toFixed(1),               bar: '#68b6e8' },
          { label: 'Bench lost',  value: sel.bench != null ? String(sel.bench) : '—',                    bar: '#ff4d16' },
        ] as chip}
          <div class="stats-chip" style="background:#17171a;border-radius:14px;padding:13px 16px;min-width:96px">
            <div style="width:12px;height:3px;border-radius:2px;background:{chip.bar}"></div>
            <div style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.45);margin-top:6px">{chip.label}</div>
            <div style="font:600 24px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.025em;margin-top:11px">{chip.value}</div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Row 2: GW bar chart + Squad contribution -->
    <div class="mgr-row1" style="display:grid;grid-template-columns:1.5fr 1fr;gap:14px">

      <!-- GW bar chart card -->
      <div style="background:#111113;border-radius:20px;padding:22px 24px">
        <div>
          <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Points per gameweek</div>
          <div style="font:400 11.5px/1.4 Barlow,sans-serif;color:rgba(255,255,255,.35);margin-top:4px">
            dashed line = gameweek average
          </div>
        </div>
        <!-- Chart container -->
        <div style="position:relative;height:210px;margin-top:20px;display:flex;align-items:flex-end;gap:7px">
          <!-- Average dashed line -->
          <div style="position:absolute;left:0;right:0;bottom:{avgBottom}%;height:0;border-top:1px dashed rgba(255,255,255,.3);pointer-events:none"></div>
          <!-- GW columns -->
          {#each sel.points as v, i}
            <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:6px">
              <div style="font:500 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.5);text-align:center">{v}</div>
              <div style="height:{Math.round(v / maxGw * 100)}%;border-radius:6px 6px 3px 3px;background:{barColor(sel.results[i], sel.color)}"></div>
              <div style="font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);text-align:center">{i + 1}</div>
            </div>
          {/each}
        </div>
        <!-- Legend -->
        <div style="display:flex;align-items:center;gap:14px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,.06)">
          {#each [
            { label: 'W', color: sel.color },
            { label: 'D', color: 'rgba(255,255,255,.28)' },
            { label: 'L', color: 'rgba(255,77,22,.55)' },
          ] as leg}
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:10px;height:10px;border-radius:3px;background:{leg.color};flex:none"></div>
              <span style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">{leg.label}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Squad contribution card -->
      <div style="background:#111113;border-radius:20px;padding:22px 24px">
        <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Squad contribution</div>
        {#if sel.squad}
          <div style="margin-top:16px;display:flex;flex-direction:column">
            {#each sel.squad.slice(0, 6) as [pos, name, pts]}
              {@const posIdx = POSLAB.findIndex(l => l === pos)}
              {@const posColor = posIdx >= 0 ? POSCOL[posIdx] : '#f4f4f2'}
              {@const fillPct = pts / topPts * 100}
              <div style="display:grid;grid-template-columns:32px 1fr 1.05fr 40px;gap:10px;align-items:center;padding:6px 0">
                <div style="font:500 10.5px/1 Barlow,sans-serif;color:{posColor}">{pos}</div>
                <div style="font:500 13.5px/1.1 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{name}</div>
                <div style="height:8px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden">
                  <div style="height:100%;width:{fillPct}%;border-radius:999px;background:{posColor}"></div>
                </div>
                <div style="font:600 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.65);text-align:right">{pts}</div>
              </div>
            {/each}
          </div>
          {#if squadNote}
            <p style="border-top:1px solid rgba(255,255,255,.06);margin:20px 0 0;padding-top:16px;font:400 13px/1.55 Barlow,sans-serif;color:rgba(255,255,255,.5);text-wrap:pretty">{squadNote}</p>
          {/if}
        {:else}
          <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center;padding:24px 0">Squad data not yet available</div>
        {/if}
      </div>
    </div>

    <!-- Row 3: Position blocks + Draft board -->
    <div class="mgr-row2" style="display:grid;grid-template-columns:1.1fr 1fr;gap:14px">

      <!-- Position blocks card -->
      <div style="background:#111113;border-radius:20px;padding:22px 24px">
        <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Points by position</div>
        {#if sel.positionMix}
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:20px;align-items:end;height:190px">
            {#each sel.positionMix as v, i}
              <div style="display:flex;flex-direction:column;justify-content:flex-end;height:100%;gap:10px">
                <div style="height:{66 + (v / mxMix) * 112}px;border-radius:12px;background:{BLOCK_BG[i]};padding:13px;display:flex;flex-direction:column;justify-content:space-between">
                  <div style="font:600 16px/1 Barlow,sans-serif;color:{BLOCK_FG[i]}">{Math.round(v * 100)}%</div>
                  <div style="font:500 12px/1 Barlow,sans-serif;color:{BLOCK_FG[i]};opacity:.75">{Math.round(v * sel.total)} pts</div>
                </div>
                <div style="font:400 12.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.45);text-align:center">{POSLAB[i]}</div>
              </div>
            {/each}
          </div>
        {:else}
          <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center;padding:24px 0">Position data not yet available</div>
        {/if}
      </div>

      <!-- Draft board card -->
      <div style="background:#141416;border-radius:20px;padding:22px 24px">
        <div style="font:600 15px/1 Barlow,sans-serif;color:#f4f4f2">Draft board · {sel.name}</div>
        <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center;padding:24px 0">
          Draft pick analytics coming soon — requires draft history data.
        </div>
        <!-- Footer strip: quick stats -->
        <div style="display:flex;gap:22px;border-top:1px solid rgba(255,255,255,.06);margin-top:20px;padding-top:16px">
          <div>
            <div style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">Best gameweek</div>
            <div style="font:600 22px/1 Barlow,sans-serif;color:#7bdcb5;margin-top:8px">{Math.max(...sel.points)}</div>
          </div>
          <div>
            <div style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">Worst gameweek</div>
            <div style="font:600 22px/1 Barlow,sans-serif;color:#ff4d16;margin-top:8px">{Math.min(...sel.points)}</div>
          </div>
          <div>
            <div style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.4)">Current run</div>
            <div style="font:600 22px/1 Barlow,sans-serif;color:#f4f4f2;margin-top:8px">{streakOf(sel.results)}</div>
          </div>
        </div>
      </div>
    </div>


  </div>
</div>
