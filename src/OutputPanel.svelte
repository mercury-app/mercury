<script lang="ts">
  import MainIOPanel from "./MainIOPanel.svelte";

  export let visible = false;
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
    on:ioAdded
  />
</div>

<style>
  #output-panel {
    display: flex;
    flex-direction: row;

    width: 100%;
    height: 100%;
    padding-left: calc(
      (var(--default-button-width) / 2) + var(--common-spacing) - 1px
    );

    background-color: #fff;

    border: 1px solid var(--main-border-color);
    border-top-left-radius: var(--common-radius);
    border-bottom-left-radius: var(--common-radius);
    border-right: 0;
  }

  #output-panel-divider {
    position: absolute;

    height: 100%;
    width: 0;

    left: calc((var(--default-button-width) / 2) + var(--common-spacing) - 1px);

    border-left: 1px solid var(--main-border-color);
  }

  #output-panel-switch {
    position: absolute;
    left: calc((-1 * var(--default-button-width) / 2) - 1px);

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
