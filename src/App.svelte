<script lang="ts">
  import WorkflowCanvas from "./WorkflowCanvas.svelte";

  const numColumns = 20;
  const numRows = 20;
  const colWidth = 100;
  const rowHeight = 100;
  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;
</script>

<main>
  <div id="workflow-canvas-container">
    <WorkflowCanvas
      canvasWidth="{canvasWidth}"
      canvasHeight="{canvasHeight}"
      numColumns="{numColumns}"
      numRows="{numRows}"
      colWidth="{colWidth}"
      rowHeight="{rowHeight}"
    />
  </div>
</main>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }

  /* To remove the scrollbars */
  #workflow-canvas-container {
    margin: 0 auto;
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 800px;
    overflow: scroll;
    border-left: 1px solid lightgray;
    border-right: 1px solid lightgray;
  }
</style>
