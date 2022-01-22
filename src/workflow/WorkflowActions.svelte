<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let runningWorkflow;

  const buttonWidth = 36;
  const buttonHeight = 36;
  const buttonWidthStyle = `width: ${buttonWidth}px;`;
  const buttonHeightStyle = `height: ${buttonHeight}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;

  const numButtons = 3;
  const workflowActionsWidthStyle = `width: ${buttonWidth * numButtons}px;`;
  const workflowActionsHeightStyle = `height: ${buttonHeight}px;`;
  const workflowActionsStyle =
    workflowActionsWidthStyle + workflowActionsHeightStyle;

  const dispatch = createEventDispatcher();
</script>

<div id="workflow-actions" style="{workflowActionsStyle}">
  <button
    style="{buttonStyle}"
    disabled="{runningWorkflow}"
    on:click="{() => dispatch('workflowRunRequested')}"
  >
    <img src="/icons/player-play.svg" alt="Run workflow icon" class="icon" />
  </button>
  <div class="vertical-separator"></div>
  <button
    style="{buttonStyle}"
    disabled="{!runningWorkflow}"
    on:click="{() => dispatch('workflowStopRequested')}"
  >
    <img src="/icons/player-stop.svg" alt="Stop workflow icon" class="icon" />
  </button>
  <div class="vertical-separator"></div>
  <button style="{buttonStyle}">
    <img src="/icons/history.svg" alt="Show workflow logs icon" class="icon" />
  </button>
</div>

<style>
  #workflow-actions {
    display: flex;
    flex-direction: row;

    border: var(--common-border-width) solid var(--main-border-color);
    border-radius: var(--common-radius);
  }

  #workflow-actions button {
    border: 0;
    border-radius: 0;
  }

  #workflow-actions button:first-of-type {
    border-top-left-radius: var(--common-radius);
    border-bottom-left-radius: var(--common-radius);
  }

  #workflow-actions button:last-of-type {
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
  }

  .vertical-separator {
    border-right: var(--common-border-width) solid var(--main-border-color);
  }
</style>
