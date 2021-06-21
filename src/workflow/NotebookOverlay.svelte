<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import InputPanel from "./InputPanel.svelte";
  import OutputPanel from "./OutputPanel.svelte";

  export let visible = false;
  export let inputs: Array<string> = [];
  export let outputs: Array<string> = [];
  export let notebookUrl = "about:blank";
  export let reloadIframe = false;

  const hiddenClass = "hidden";
  const visibleClass = "visible";
  $: {
    const notebookPanel = document.getElementById("notebook-panel");
    if (notebookPanel !== null) {
      if (visible) {
        // reloadiframe if the notebook file has been overwritten by workflow run
        if (reloadIframe) {
          console.log("Reloading iframe");
          const notebookIframe = document.getElementById(
            "notebook-iframe"
          ) as HTMLIFrameElement;
          notebookIframe.src = notebookIframe.src;
        }
        reloadIframe = false;
        notebookPanel.classList.remove(hiddenClass);
        notebookPanel.classList.add(visibleClass);

        // Halfway through the animation, we will grab focus. This prevents
        // the canvas from still receiving keyboard inputs.
        setTimeout(() => {
          notebookPanel.focus();
        }, 150);
      } else {
        notebookPanel.classList.remove(visibleClass);
        notebookPanel.classList.add(hiddenClass);
      }
    }
  }

  const iframeSandboxPermissions = [
    "allow-scripts",
    "allow-forms",
    "allow-pointer-lock",
    "allow-same-origin",
    "allow-downloads",
    "allow-orientation-lock",
    "allow-presentation",
    "allow-storage-access-by-user-activation",
    "allow-top-navigation-by-user-activation",
  ];
  const iframeSandboxValue = iframeSandboxPermissions.join(" ");

  let inputPanelVisible = false;
  let outputPanelVisible = false;

  const dispatch = createEventDispatcher();

  const dispatchNotebookPanelRemovedEvent = () => {
    visible = false;
    dispatch("notebookPanelRemoved");
  };
</script>

<div id="notebook-panel" class="{hiddenClass}" tabindex="-1">
  <button
    id="notebook-back-button"
    on:click="{dispatchNotebookPanelRemovedEvent}"
  >
    <img src="/icons/chevron-left.svg" alt="Go back icon" class="icon" />
  </button>

  <iframe
    id="notebook-iframe"
    sandbox="{iframeSandboxValue}"
    src="{notebookUrl}"
    title="Jupyter notebook"
  >
  </iframe>

  <div
    id="input-panel-container"
    class="{inputPanelVisible ? 'visible' : 'hidden'}"
  >
    <InputPanel
      bind:visible="{inputPanelVisible}"
      bind:inputs
      on:inputAdded
      on:inputRemoved
    />
  </div>
  <div
    id="output-panel-container"
    class="{outputPanelVisible ? 'visible' : 'hidden'}"
  >
    <OutputPanel
      bind:visible="{outputPanelVisible}"
      bind:outputs
      on:outputAdded
      on:outputRemoved
    />
  </div>
</div>

<style>
  #notebook-panel {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    background-color: #eee;
    transition: all 0.3s ease-in-out;
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

    transition: all 0.3s ease-in-out;
  }

  #input-panel-container.hidden {
    transform: translateX(
      calc(
        -1 * 100% + (var(--default-button-width) / 2) + var(--common-spacing) - 1px
      )
    );
  }

  #input-panel-container.visible {
    transform: translateX(0);
  }

  #output-panel-container {
    position: absolute;
    top: 30%;
    right: 0;

    width: 20%;
    height: 40%;

    transition: all 0.3s ease-in-out;
  }

  #output-panel-container.hidden {
    transform: translateX(
      calc(
        100% - (var(--default-button-width) / 2) - var(--common-spacing) + 1px
      )
    );
  }

  #output-panel-container.visible {
    transform: translateX(0);
  }
</style>
