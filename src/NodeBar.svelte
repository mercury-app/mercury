<script lang="ts">
  export let nodeBarWidth: number = 48;

  const spacing = 3;

  const nodeBarWidthStyle = `width: ${nodeBarWidth}px;`;
  const nodeBarPaddingStyle = `padding-top: ${spacing}px;`;
  const nodeBarStyle = nodeBarWidthStyle + nodeBarPaddingStyle;

  const buttonWidthStyle = `width: ${nodeBarWidth - spacing * 2}px;`;
  const buttonHeightStyle = `height: ${nodeBarWidth - spacing * 2}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;
</script>

<div id="node-bar-container" style="{nodeBarWidthStyle}">
  <div id="node-bar" style="{nodeBarStyle}">
    <button style="{buttonStyle}">+</button>
  </div>
</div>

<style>
  #node-bar-container {
    height: 100%;
    border-right: 1px solid lightgray;
  }

  #node-bar {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  #node-bar button {
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
