<script lang="ts">
  export let color: string;
  export let init: string;
  export let size = 30;
  export let fontSize = 10;
</script>

<div
  style="width:{size}px;height:{size}px;border-radius:999px;background:{color};
    display:flex;align-items:center;justify-content:center;
    font:700 {fontSize}px/1 Barlow,sans-serif;color:#0b0b0c;flex:none"
>
  {init}
</div>
