<script lang="ts">
  export let visible = false;

  const hiddenClass = "hidden";
  const visibleClass = "visible";
  $: {
    const notebookPanel = document.getElementById("notebook-panel");
    if (notebookPanel !== null) {
      if (visible) {
        notebookPanel.classList.remove(hiddenClass);
        notebookPanel.classList.add(visibleClass);
      } else {
        notebookPanel.classList.remove(visibleClass);
        notebookPanel.classList.add(hiddenClass);
      }
    }
  }
</script>

<div id="notebook-panel" class="{hiddenClass}">
  <button on:click="{() => (visible = false)}">
    <img src="/icons/chevron-left.svg" alt="Go back icon" class="icon" />
  </button>
  <iframe
    src="http://localhost:8888/notebooks/work/scripts/Untitled.ipynb"
    title="Jupyter notebook"></iframe>
</div>

<style>
  #notebook-panel {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    background-color: #eee;
    transition: all 0.5s ease-in-out;
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

  #notebook-panel.hidden {
    transform: translateY(100%);
  }

  #notebook-panel.visible {
    transform: translateY(0%);
  }
</style>
