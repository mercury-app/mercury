<script lang="ts">
  import { cubicInOut } from "svelte/easing";

  export let visible = false;

  const slideUp = (node: HTMLElement, params: any) => {
    const existingTransform = getComputedStyle(node).transform.replace(
      "none",
      ""
    );

    return {
      delay: params.delay || 0,
      duration: params.duration || 400,
      easing: params.easing || cubicInOut,
      css: (_t: number, u: number) =>
        `transform: ${existingTransform} translateY(${u * 100}%)`,
    };
  };
</script>

{#if visible}
  <div id="notebook-panel" transition:slideUp="{{ duration: 500 }}">
    <button on:click="{() => (visible = false)}">
      <img src="/icons/chevron-left.svg" alt="Go back icon" class="icon" />
    </button>
    <iframe
      src="http://localhost:8888/notebooks/work/scripts/Untitled.ipynb"
      title="Jupyter notebook"></iframe>
  </div>
{/if}

<style>
  #notebook-panel {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    background-color: #eee;
  }

  #notebook-panel button {
    position: absolute;
    top: 6px;
    left: 6px;
    width: var(--default-button-width);
    height: var(--default-button-height);
  }

  #notebook-panel iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }
</style>
