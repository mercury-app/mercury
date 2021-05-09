<script lang="ts">
  import MainIOPanel from "./MainIOPanel.svelte";

  export let visible = false;
  export let inputs: Array<string> = [];
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
    on:ioAdded
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

    border: 1px solid var(--main-border-color);
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
    border-left: 0;
  }

  #input-panel-divider {
    position: absolute;

    height: 100%;
    width: 0;

    right: calc(
      (var(--default-button-width) / 2) + var(--common-spacing) - 1px
    );

    border-left: 1px solid var(--main-border-color);
  }

  #input-panel-switch {
    position: absolute;
    right: calc((-1 * var(--default-button-width) / 2) - 1px);

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
