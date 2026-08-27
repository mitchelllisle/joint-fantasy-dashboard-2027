<script lang="ts">
  import type { PageData } from './$types.js';
  import Overview from '$lib/components/Overview.svelte';
  import Managers from '$lib/components/Managers.svelte';
  import Fixtures from '$lib/components/Fixtures.svelte';

  export let data: PageData;

  const { dashboard } = data;

  type Tab = 'Overview' | 'Managers' | 'Fixtures';
  const TABS: Tab[] = ['Overview', 'Managers', 'Fixtures'];

  let activeTab: Tab = 'Overview';
  let selectedIdx = dashboard.ordered[0].i;
  let banter = true;

  function selectManager(i: number) {
    selectedIdx = i;
    activeTab = 'Managers';
  }
</script>

<div style="min-height:100vh;background:#08080a">

  <!-- ── Sticky navbar ── -->
  <nav style="position:sticky;top:0;z-index:20;background:#0b0b0c;
    border-bottom:1px solid rgba(255,255,255,.08);
    padding:0 32px;height:58px;
    display:flex;align-items:center;gap:24px">

    <!-- Logo -->
    <img src="/draft-logo.svg" alt="JointDraft" style="height:22px;width:auto;flex:none" />

    <!-- Divider -->
    <div style="width:1px;height:20px;background:rgba(255,255,255,.1);flex:none"></div>

    <!-- Nav links -->
    <div style="display:flex;align-items:center;gap:2px">
      {#each TABS as tab}
        <button
          class="nav-item"
          on:click={() => (activeTab = tab)}
          style="padding:8px 16px;border-radius:8px;font:500 14px/1 Barlow,sans-serif;
            border:none;cursor:pointer;transition:background 130ms ease-out,color 130ms ease-out;
            background:{activeTab === tab ? 'rgba(255,255,255,.09)' : 'transparent'};
            color:{activeTab === tab ? '#f4f4f2' : 'rgba(255,255,255,.5)'}"
        >{tab}</button>
      {/each}
    </div>

  </nav>

  <!-- ── Page content ── -->
  <div style="padding:20px 32px 48px">
    {#if activeTab === 'Overview'}
      <Overview
        {dashboard} {selectedIdx} {banter}
        on:select={(e) => selectManager(e.detail)}
      />
    {:else if activeTab === 'Managers'}
      <Managers
        {dashboard} {selectedIdx} {banter}
        on:select={(e) => selectManager(e.detail)}
      />
    {:else}
      <Fixtures {dashboard} />
    {/if}
  </div>

</div>
