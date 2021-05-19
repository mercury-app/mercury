<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let workflowBarWidth: number = 48;

  const spacing = 6;

  const workflowBarWidthStyle = `width: ${workflowBarWidth}px;`;
  const workflowBarPaddingStyle = `padding-top: ${spacing}px;`;
  const workflowBarStyle = workflowBarWidthStyle + workflowBarPaddingStyle;

  const buttonWidthStyle = `width: ${workflowBarWidth - spacing * 2}px;`;
  const buttonHeightStyle = `height: ${workflowBarWidth - spacing * 2}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;

  const dispatch = createEventDispatcher();
</script>

<div id="workflow-bar-container" style="{workflowBarWidthStyle}">
  <div id="workflow-bar" style="{workflowBarStyle}">
    <button
      style="{buttonStyle}"
      on:click="{() => dispatch('newNodeRequested')}" 
    >
      <img src="/icons/plus.svg" alt="Add node icon" class="icon" />
    </button>
  </div>
</div>

<style>
  #workflow-bar-container {
    height: 100%;
    /* main-border-color is global css property defined in public/global.css */
    border-right: 1px solid var(--main-border-color); 
  }

  #workflow-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
