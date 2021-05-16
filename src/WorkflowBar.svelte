<script lang="ts">
  import { createEventDispatcher } from "svelte"; // importing from the svelte library

  // export denotes that this is exported from the prop set in app.svelte
  // 48 is the default value taken if prop is not passed 
  export let workflowBarWidth: number = 48;

  const spacing = 6;

  const workflowBarWidthStyle = `width: ${workflowBarWidth}px;`;
  const workflowBarPaddingStyle = `padding-top: ${spacing}px;`;
  const workflowBarStyle = workflowBarWidthStyle + workflowBarPaddingStyle;

  const buttonWidthStyle = `width: ${workflowBarWidth - spacing * 2}px;`;
  const buttonHeightStyle = `height: ${workflowBarWidth - spacing * 2}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;

  const dispatch = createEventDispatcher(); //creates a dispatch function
</script>

<div id="workflow-bar-container" style="{workflowBarWidthStyle}">
  <div id="workflow-bar" style="{workflowBarStyle}">
    <!-- what is dispatching an event in svelte? -->
        <!-- event forwarding? events from here can be forwarded to the component definition in app.svelte -->
    <!-- when a component wants to change data belonging to parent component. event forwarding won't work as data
    is not being passed. a custom event needs to be  dispatched from the child component along with the data and 
  send to the parent component --> 
  <!-- The second argument of dispatch is the data along with the event newnoderequested. -->
    <button
      style="{buttonStyle}"
      on:click="{() => dispatch('newNodeRequested')}" 
    >
    <!-- coming from public/icons/ folder -->
      <img src="/icons/plus.svg" alt="Add node icon" class="icon" />
    </button>
  </div>
</div>

<!-- component specific style -->
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
