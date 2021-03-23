<script lang="ts">
  export let workflowBarWidth: number = 48;

  const spacing = 6;

  const workflowBarWidthStyle = `width: ${workflowBarWidth}px;`;
  const workflowBarPaddingStyle = `padding-top: ${spacing}px;`;
  const workflowBarStyle = workflowBarWidthStyle + workflowBarPaddingStyle;

  const buttonWidthStyle = `width: ${workflowBarWidth - spacing * 2}px;`;
  const buttonHeightStyle = `height: ${workflowBarWidth - spacing * 2}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;
</script>

<div id="workflow-bar-container" style="{workflowBarWidthStyle}">
  <div id="workflow-bar" style="{workflowBarStyle}">
    <button style="{buttonStyle}">+</button>
  </div>
</div>

<style>
  #workflow-bar-container {
    height: 100%;
    border-right: 1px solid lightgray;
  }

  #workflow-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #workflow-bar button {
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
