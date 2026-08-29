<script lang="ts">
  import type { DashboardData } from '$lib/types.js';
  import { base } from '$app/paths';
  import Avatar from '$lib/components/Avatar.svelte';

  export let dashboard: DashboardData;

  let showUpcoming  = true;
  let showPrevious  = false;

  function chevron(open: boolean) {
    return open
      ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4.5L6 8.5L10 4.5"/></svg>`
      : `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 2L8.5 6L4.5 10"/></svg>`;
  }
</script>


<!-- ── Accordion sections ──────────────────────────────────────────────────── -->
<div style="display:flex;flex-direction:column;gap:10px">

  <!-- ══ Upcoming gameweek (expanded by default) ══ -->
  <div style="background:#111113;border-radius:20px;overflow:hidden">

    <!-- Section header -->
    <button
      type="button"
      aria-expanded={showUpcoming}
      on:click={() => showUpcoming = !showUpcoming}
      style="width:100%;display:flex;align-items:center;justify-content:space-between;
        padding:18px 24px;background:transparent;border:none;cursor:pointer;text-align:left"
    >
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font:600 16px/1 Barlow,sans-serif;color:#f4f4f2">
          Upcoming · Gameweek {dashboard.upcoming?.gw ?? dashboard.gw + 1}
        </span>
        <span style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.35)">
          your players in each fixture
        </span>
      </div>
      <span style="color:rgba(255,255,255,.4)">{@html chevron(showUpcoming)}</span>
    </button>

    <!-- Section body -->
    {#if showUpcoming && dashboard.upcoming}
      <div style="display:flex;flex-direction:column;gap:10px;padding:0 24px 22px">
        {#each dashboard.upcoming.fixtures as fix (fix.key)}
          <div style="background:#17171a;border-radius:14px;padding:16px 18px">
            <!-- Match header -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px">
              <div style="display:flex;align-items:center;gap:16px;min-width:0">
                <div style="display:flex;align-items:center;gap:8px;min-width:0">
                  {#if fix.homeLogo}
                    <img class="fix-logo" src="{base}{fix.homeLogo}" alt={fix.homeShort} width="24" height="24" style="object-fit:contain;flex:none" />
                  {/if}
                  <span class="fix-team-name" style="font:600 14px/1.2 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{fix.homeTeam}</span>
                </div>
                <span style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);flex:none">vs</span>
                <div style="display:flex;align-items:center;gap:8px;min-width:0">
                  {#if fix.awayLogo}
                    <img class="fix-logo" src="{base}{fix.awayLogo}" alt={fix.awayShort} width="24" height="24" style="object-fit:contain;flex:none" />
                  {/if}
                  <span class="fix-team-name" style="font:600 14px/1.2 Barlow,sans-serif;color:#f4f4f2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{fix.awayTeam}</span>
                </div>
              </div>
              {#if fix.kickoff}
                <span class="fix-kickoff" style="font:400 11px/1 Barlow,sans-serif;color:rgba(255,255,255,.35);white-space:nowrap;flex:none">{fix.kickoff}</span>
              {/if}
            </div>

            <!-- Manager players -->
            {#if fix.managers.length > 0}
              <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
                {#each fix.managers as mgr}
                  <div style="background:#1c1c20;border-radius:10px;padding:10px 12px">
                    <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
                      <Avatar color={mgr.color} init={mgr.teamKey} size={18} fontSize={7} />
                      <span style="font:500 11.5px/1 Barlow,sans-serif;color:#f4f4f2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{mgr.teamName}</span>
                    </div>
                    {#each mgr.players as p}
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0">
                        <span style="font:500 9.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);width:24px;flex:none">{p.pos}</span>
                        <span style="font:400 11.5px/1 Barlow,sans-serif;color:{p.isStarter ? '#f4f4f2' : 'rgba(255,255,255,.35)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">{p.name}</span>
                        {#if !p.isStarter}
                          <span style="font:400 9.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.25);flex:none">bench</span>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/each}
              </div>
            {:else}
              <div style="font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.25)">No managers have players in this fixture.</div>
            {/if}
          </div>
        {/each}
      </div>
    {:else if showUpcoming && !dashboard.upcoming}
      <div style="padding:0 24px 22px;font:400 12px/1.5 Barlow,sans-serif;color:rgba(255,255,255,.35);text-align:center">
        Upcoming fixture data unavailable.
      </div>
    {/if}

  </div>

  <!-- ══ Previous gameweeks (collapsed by default) ══ -->
  {#if dashboard.previousGW}
    <div style="background:#111113;border-radius:20px;overflow:hidden">

      <button
        type="button"
        aria-expanded={showPrevious}
        on:click={() => showPrevious = !showPrevious}
        style="width:100%;display:flex;align-items:center;justify-content:space-between;
          padding:18px 24px;background:transparent;border:none;cursor:pointer;text-align:left"
      >
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font:600 16px/1 Barlow,sans-serif;color:#f4f4f2">
            Gameweek {dashboard.previousGW.gw}
          </span>
          <span style="font:400 12px/1 Barlow,sans-serif;color:rgba(255,255,255,.35)">
            results · click to expand
          </span>
        </div>
        <span style="color:rgba(255,255,255,.4)">{@html chevron(showPrevious)}</span>
      </button>

      {#if showPrevious}
        <div style="display:flex;flex-direction:column;gap:10px;padding:0 24px 22px">
          {#each dashboard.previousGW.fixtures as fix (fix.key)}
            <div style="background:#17171a;border-radius:14px;padding:16px 18px">

              <!-- Match result header -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px">
                <div style="display:flex;align-items:center;gap:12px;min-width:0">
                  <!-- Home -->
                  <div style="display:flex;align-items:center;gap:8px">
                    {#if fix.homeLogo}
                      <img class="fix-logo" src="{base}{fix.homeLogo}" alt={fix.homeShort} width="24" height="24" style="object-fit:contain;flex:none" />
                    {/if}
                    <span class="fix-team-name" style="font:600 14px/1.2 Barlow,sans-serif;
                      color:{fix.homeScore != null && fix.homeScore > (fix.awayScore ?? 0) ? '#f4f4f2' : 'rgba(255,255,255,.5)'};
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{fix.homeTeam}</span>
                  </div>
                  <!-- Score -->
                  {#if fix.homeScore != null}
                    <div style="display:flex;align-items:center;gap:6px;flex:none">
                      <span style="font:600 18px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em">{fix.homeScore}</span>
                      <span style="font:400 14px/1 Barlow,sans-serif;color:rgba(255,255,255,.25)">–</span>
                      <span style="font:600 18px/1 Barlow,sans-serif;color:#f4f4f2;letter-spacing:-.02em">{fix.awayScore}</span>
                    </div>
                  {/if}
                  <!-- Away -->
                  <div style="display:flex;align-items:center;gap:8px">
                    {#if fix.awayLogo}
                      <img class="fix-logo" src="{base}{fix.awayLogo}" alt={fix.awayShort} width="24" height="24" style="object-fit:contain;flex:none" />
                    {/if}
                    <span class="fix-team-name" style="font:600 14px/1.2 Barlow,sans-serif;
                      color:{fix.awayScore != null && fix.awayScore > (fix.homeScore ?? 0) ? '#f4f4f2' : 'rgba(255,255,255,.5)'};
                      white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{fix.awayTeam}</span>
                  </div>
                </div>
              </div>

              <!-- Manager player points -->
              {#if fix.managers.length > 0}
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
                  {#each fix.managers as mgr}
                    <div style="background:#1c1c20;border-radius:10px;padding:10px 12px">
                      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                        <div style="display:flex;align-items:center;gap:7px">
                          <Avatar color={mgr.color} init={mgr.teamKey} size={18} fontSize={7} />
                          <span style="font:500 11.5px/1 Barlow,sans-serif;color:#f4f4f2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{mgr.teamName}</span>
                        </div>
                        <span style="font:600 12px/1 Barlow,sans-serif;color:#7bdcb5;flex:none;margin-left:8px">{mgr.totalPoints}pts</span>
                      </div>
                      {#each mgr.players as p}
                        <div style="display:flex;align-items:center;gap:5px;padding:2px 0">
                          <span style="font:500 9.5px/1 Barlow,sans-serif;color:rgba(255,255,255,.3);width:24px;flex:none">{p.pos}</span>
                          <span style="font:400 11.5px/1 Barlow,sans-serif;color:{p.isStarter ? '#f4f4f2' : 'rgba(255,255,255,.35)'};flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{p.name}</span>
                          <span style="font:600 11px/1 Barlow,sans-serif;
                            color:{p.points >= 8 ? '#7bdcb5' : p.points >= 4 ? 'rgba(255,255,255,.65)' : 'rgba(255,255,255,.35)'};
                            flex:none;min-width:22px;text-align:right">{p.points}</span>
                        </div>
                      {/each}
                    </div>
                  {/each}
                </div>
              {/if}

            </div>
          {/each}
        </div>
      {/if}

    </div>
  {/if}

</div>
