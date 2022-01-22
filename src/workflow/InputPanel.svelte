<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import MainIOPanel from "./MainIOPanel.svelte";

  export let visible = false;
  export let inputs: Array<string> = [];

  const dispatch = createEventDispatcher();

  const dispatchInputAddedEvent = (event: CustomEvent) => {
    dispatch("inputAdded", {
      inputName: event.detail.ioName,
    });
  };
  const dispatchInputRemovedEvent = (event: CustomEvent) => {
    dispatch("inputRemoved", {
      inputName: event.detail.ioName,
    });
  };
</script>

<div id="input-panel">
  <button id="input-panel-switch" on:click="{() => (visible = !visible)}">
    <img src="/icons/chevron-left.svg" alt="Hide panel" class="icon" />
    <img src="/icons/chevron-right.svg" alt="Show panel" class="icon" />
  </button>
  <MainIOPanel
    title="Inputs"
    newEntryPlaceholder="Add a parameter"
    bind:params="{inputs}"
    on:ioAdded="{dispatchInputAddedEvent}"
    on:ioRemoved="{dispatchInputRemovedEvent}"
  />
  <div id="input-panel-divider"></div>
</div>

<style>
  #input-panel {
    display: flex;
    flex-direction: row;

    width: 100%;
    height: 100%;

    background-color: #fff;

    border: var(--common-border-width) solid var(--main-border-color);
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
    border-left: 0;
  }

  #input-panel-divider {
    position: absolute;

    height: 100%;
    width: 0;

    right: calc(
      (var(--default-button-width) / 2) + var(--common-spacing) -
        var(--common-border-width)
    );

    border-left: var(--common-border-width) solid var(--main-border-color);
  }

  #input-panel-switch {
    position: absolute;
    right: calc(
      (-1 * var(--default-button-width) / 2) - var(--common-border-width)
    );

    width: var(--default-button-width);
    height: var(--default-button-height);

    margin: var(--common-spacing) 0;
  }

  #input-panel-switch img {
    width: 16px;
    height: 16px;
  }

  #input-panel-switch img:first-child {
    margin-right: -3px;
  }

  #input-panel-switch img:last-child {
    margin-left: -3px;
  }
</style>
