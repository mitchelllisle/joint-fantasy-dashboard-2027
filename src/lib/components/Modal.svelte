<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let open: boolean = false;
  export let title: string = '';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    style="position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:32px"
    on:click={handleBackdrop}
  >
    <div style="background:#111113;border-radius:20px;border:1px solid rgba(255,255,255,.1);width:100%;max-width:1280px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 22px;border-bottom:1px solid rgba(255,255,255,.07);flex:none">
        <span style="font:600 16px/1 Barlow,sans-serif;color:#f4f4f2">{title}</span>
        <button
          style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:6px 10px;color:rgba(255,255,255,.6);font:500 13px/1 Barlow,sans-serif;cursor:pointer"
          on:click={close}
          on:mouseenter={(e) => (e.currentTarget.style.color = '#f4f4f2')}
          on:mouseleave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.6)')}
        >✕</button>
      </div>
      <div style="flex:1;overflow-y:auto;padding:22px 24px">
        <slot />
      </div>
    </div>
  </div>
{/if}
