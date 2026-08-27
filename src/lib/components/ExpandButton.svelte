<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
</script>

<button
  style="background:transparent;border:none;cursor:pointer;padding:4px;border-radius:6px;color:rgba(255,255,255,.3);display:flex;align-items:center;transition:color 130ms ease-out"
  on:click={() => dispatch('click')}
  on:mouseenter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.7)')}
  on:mouseleave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.3)')}
>
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
    <path d="M1 5V1H5M9 1H13V5M13 9V13H9M5 13H1V9"/>
  </svg>
</button>
