<script lang="ts">
  import WorkflowBar from "./WorkflowBar.svelte";
  import WorkflowCanvas, { placeNewNode } from "./WorkflowCanvas.svelte";

  const workflowBarWidth = 48;

  const numCanvasColumns = 24;
  const numCanvasRows = 24;
  const canvasColWidth = 100;
  const canvasRowHeight = 100;
</script>

<main>
  <div class="container" id="workflow-bar-container">
    <WorkflowBar
      workflowBarWidth="{workflowBarWidth}"
      on:newNodeRequested="{placeNewNode}"
    />
  </div>
  <div class="container" id="workflow-canvas-container">
    <WorkflowCanvas
      numColumns="{numCanvasColumns}"
      numRows="{numCanvasRows}"
      colWidth="{canvasColWidth}"
      rowHeight="{canvasRowHeight}"
    />
  </div>
</main>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
      height: 100%;
      display: grid;
      grid-template-columns: 48px auto;
      grid-template-areas: "workflow-bar-container workflow-canvas-container";
      gap: 0;
    }
  }

  .container {
    margin: 0;
  }

  #workflow-canvas-container {
    overflow: auto;
  }
</style>
