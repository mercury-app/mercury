<script lang="ts">
  import InputPanel from "./InputPanel.svelte";
  import OutputPanel from "./OutputPanel.svelte";

  export let visible = false;

  const hiddenClass = "hidden";
  const visibleClass = "visible";
  $: {
    const notebookPanel = document.getElementById("notebook-panel");
    if (notebookPanel !== null) {
      if (visible) {
        notebookPanel.classList.remove(hiddenClass);
        notebookPanel.classList.add(visibleClass);

        // Halfway through the animation, we will grab focus. This prevents
        // the canvas from still receiving keyboard inputs.
        setTimeout(() => {
          notebookPanel.focus();
        }, 250);
      } else {
        notebookPanel.classList.remove(visibleClass);
        notebookPanel.classList.add(hiddenClass);
      }
    }
  }
</script>

<div id="notebook-panel" class="{hiddenClass}" tabindex="-1">
  <button id="notebook-back-button" on:click="{() => (visible = false)}">
    <img src="/icons/chevron-left.svg" alt="Go back icon" class="icon" />
  </button>

  <iframe
    src="http://localhost:8888/notebooks/work/scripts/Untitled.ipynb"
    title="Jupyter notebook"
  >
  </iframe>

  <div id="input-panel-container"><InputPanel /></div>
  <div id="output-panel-container"><OutputPanel /></div>
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

  #notebook-back-button {
    position: absolute;
    top: var(--common-spacing);
    left: var(--common-spacing);
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

  #input-panel-container {
    position: absolute;
    top: 30%;

    width: 20%;
    height: 40%;
  }

  #output-panel-container {
    position: absolute;
    top: 30%;
    right: 0;

    width: 20%;
    height: 40%;
  }
</style>
