<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import MainIOPanel from "./MainIOPanel.svelte";

  export let visible = false;
  export let outputs: Array<string> = [];

  const dispatch = createEventDispatcher();

  const dispatchOutputAddedEvent = (event: CustomEvent) => {
    dispatch("outputAdded", {
      outputName: event.detail.ioName,
    });
  };
  const dispatchOutputRemovedEvent = (event: CustomEvent) => {
    dispatch("outputRemoved", {
      outputName: event.detail.ioName,
    });
  };
</script>

<div id="output-panel">
  <button id="output-panel-switch" on:click="{() => (visible = !visible)}">
    <img src="/icons/chevron-left.svg" alt="Hide panel" class="icon" />
    <img src="/icons/chevron-right.svg" alt="Show panel" class="icon" />
  </button>
  <div id="output-panel-divider"></div>
  <MainIOPanel
    title="Outputs"
    newEntryPlaceholder="Export a value"
    bind:params="{outputs}"
    on:ioAdded="{dispatchOutputAddedEvent}"
    on:ioRemoved="{dispatchOutputRemovedEvent}"
  />
</div>

<style>
  #output-panel {
    display: flex;
    flex-direction: row;

    width: 100%;
    height: 100%;
    padding-left: calc(
      (var(--default-button-width) / 2) + var(--common-spacing) -
        var(--common-border-width)
    );

    background-color: #fff;

    border: var(--common-border-width) solid var(--main-border-color);
    border-top-left-radius: var(--common-radius);
    border-bottom-left-radius: var(--common-radius);
    border-right: 0;
  }

  #output-panel-divider {
    position: absolute;

    height: 100%;
    width: 0;

    left: calc(
      (var(--default-button-width) / 2) + var(--common-spacing) -
        var(--common-border-width)
    );

    border-left: var(--common-border-width) solid var(--main-border-color);
  }

  #output-panel-switch {
    position: absolute;
    left: calc(
      (-1 * var(--default-button-width) / 2) - var(--common-border-width)
    );

    width: var(--default-button-width);
    height: var(--default-button-height);

    margin: var(--common-spacing) 0;
  }

  #output-panel-switch img {
    width: 16px;
    height: 16px;
  }

  #output-panel-switch img:first-child {
    margin-right: -3px;
  }

  #output-panel-switch img:last-child {
    margin-left: -3px;
  }
</style>
