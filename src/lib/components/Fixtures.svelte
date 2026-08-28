<script lang="ts">
  import type { DashboardData } from '$lib/types.js';
  import { base } from '$app/paths';
  import Avatar from '$lib/components/Avatar.svelte';

  export let dashboard: DashboardData;

  $: fx = dashboard.fx;
</script>

<div style="display:flex;flex-direction:column;gap:14px">

  <!-- GW scores -->

    <!-- GW results card -->
    <div style="background:#111113;border-radius:20px;padding:22px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
        <span style="font:600 17px/1 Barlow,sans-serif;color:#f4f4f2">Gameweek {dashboard.gw} results</span>
        <span style="padding:6px 12px;background:#1a1a1d;border-radius:999px;font:500 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.5);letter-spacing:.5px">Final</span>
      </div>

      {#if fx.latest.length === 0}
        <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center;padding:24px 0">
          Draft league match results are not available via the public API for this league.
        </div>
      {:else}
        <div style="display:flex;flex-direction:column;gap:8px">
          {#each fx.latest as m (m.key)}
            <div style="background:#17171a;border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:1fr 96px 1fr;gap:12px;align-items:center">
              <!-- Home -->
              <div style="display:flex;align-items:center;gap:8px;overflow:hidden;min-width:0">
                <Avatar color={m.aColor} init={m.aInit} size={28} fontSize={9.5} />
                <span style="font:500 13.5px/1 Barlow,sans-serif;color:{m.aFg};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{m.aName}</span>
              </div>
              <!-- Score -->
              <div style="display:flex;align-items:center;justify-content:center;gap:3px">
                <span style="font:600 21px/1 Barlow,sans-serif;color:{m.aFg};letter-spacing:-.02em">{m.aPts}</span>
                <span style="font:400 21px/1 Barlow,sans-serif;color:rgba(255,255,255,.25)"> – </span>
                <span style="font:600 21px/1 Barlow,sans-serif;color:{m.bFg};letter-spacing:-.02em">{m.bPts}</span>
              </div>
              <!-- Away -->
              <div style="display:flex;align-items:center;justify-content:flex-end;gap:8px;overflow:hidden;min-width:0">
                <span style="font:500 13.5px/1 Barlow,sans-serif;color:{m.bFg};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:right">{m.bName}</span>
                <Avatar color={m.bColor} init={m.bInit} size={28} fontSize={9.5} />
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>


  <!-- Upcoming PL fixtures card -->
  {#if dashboard.upcoming && dashboard.upcoming.fixtures.length > 0}
    <div style="background:#111113;border-radius:20px;padding:22px 24px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <span style="font:600 17px/1 Barlow,sans-serif;color:#f4f4f2">Upcoming · Gameweek {dashboard.upcoming.gw}</span>
          <span style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.35)">your players in each fixture</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px">
        {#each dashboard.upcoming.fixtures as fix (fix.key)}
          {#if true}
            <div style="background:#17171a;border-radius:14px;padding:16px 18px">
              <!-- Match header -->
              <!-- Match header: logo + team name · vs · team name + logo + kickoff -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px">
                <div style="display:flex;align-items:center;gap:16px;min-width:0">
                  <!-- Home -->
                  <div style="display:flex;align-items:center;gap:8px;min-width:0">
                    {#if fix.homeLogo}
                      <img src="{base}{fix.homeLogo}" alt={fix.homeShort} width="28" height="28"
                        style="object-fit:contain;flex:none" />
                    {/if}
                    <span style="font:600 14px/1.2 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      {fix.homeTeam}
                    </span>
                  </div>
                  <span style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);flex:none">vs</span>
                  <!-- Away -->
                  <div style="display:flex;align-items:center;gap:8px;min-width:0">
                    {#if fix.awayLogo}
                      <img src="{base}{fix.awayLogo}" alt={fix.awayShort} width="28" height="28"
                        style="object-fit:contain;flex:none" />
                    {/if}
                    <span style="font:600 14px/1.2 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                      {fix.awayTeam}
                    </span>
                  </div>
                </div>
                {#if fix.kickoff}
                  <span style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);white-space:nowrap;flex:none">
                    {fix.kickoff}
                  </span>
                {/if}
              </div>

              <!-- Managers with players in this fixture -->
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
                {#each fix.managers as mgr}
                  <div style="background:#1c1c20;border-radius:10px;padding:10px 12px">
                    <!-- Manager name row -->
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                      <Avatar color={mgr.color} init={mgr.teamKey} size={20} fontSize={8} />
                      <span style="font:500 12px/1 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{mgr.teamName}</span>
                    </div>
                    <!-- Player list -->
                    <div style="display:flex;flex-direction:column;gap:4px">
                      {#each mgr.players as p}
                        <div style="display:flex;align-items:center;gap:6px">
                          <span style="font:500 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);width:26px;flex:none">{p.pos}</span>
                          <span style="font:400 12px/1 Barlow,sans-serif;color:{p.isStarter ? '#f4f4f2' : 'rgba(255,255,255,.4)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{p.name}</span>
                          {#if !p.isStarter}
                            <span style="font:400 10px/1 Barlow,sans-serif;color:rgba(255,255,255,.25);flex:none">bench</span>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>

  {/if}


  <!-- Results archive card -->
  <div style="background:#141416;border-radius:20px;padding:22px 24px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px">
      <span style="font:600 17px/1 Barlow,sans-serif;color:#f4f4f2">Results archive</span>
        <span style="font:400 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.35)">last six gameweeks · winner in white</span>
    </div>

    {#if fx.archive.length === 0}
      <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center;padding:24px 0">Match history not available for this league via the public API.</div>
    {:else}
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px">
        {#each fx.archive as block (block.key)}
          <div style="background:#17171a;border-radius:14px;padding:14px">
            <div style="font:500 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.4);margin-bottom:9px">GW{block.gw}</div>
            <div style="display:flex;flex-direction:column;gap:9px">
              {#each block.games as m (m.key)}
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
                  <!-- Home: dot + code -->
                  <div style="display:flex;align-items:center;gap:5px">
                    <div style="width:6px;height:6px;border-radius:999px;background:{m.aColor};flex:none"></div>
                    <span style="font:500 11.5px/1 Barlow,sans-serif;color:{m.aFg}">{m.aInit}</span>
                  </div>
                  <!-- Score -->
                  <span style="font:500 11.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.6)">{m.aPts}–{m.bPts}</span>
                  <!-- Away: code + dot -->
                  <div style="display:flex;align-items:center;gap:5px">
                    <span style="font:500 11.5px/1 Barlow,sans-serif;color:{m.bFg}">{m.bInit}</span>
                    <div style="width:6px;height:6px;border-radius:999px;background:{m.bColor};flex:none"></div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>


</div>
