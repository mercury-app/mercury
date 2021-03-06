<script lang="ts">
  import NodeBar from "./NodeBar.svelte";
  import WorkflowCanvas from "./WorkflowCanvas.svelte";

  const nodeBarWidth = 48;

  const numCanvasColumns = 20;
  const numCanvasRows = 20;
  const canvasColWidth = 100;
  const canvasRowHeight = 100;
</script>

<main>
  <div id="node-bar-container">
    <NodeBar nodeBarWidth="{nodeBarWidth}" />
  </div>
  <div id="workflow-canvas-container">
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
      grid-template-areas: "node-bar canvas";
      gap: 0;
    }
  }

  #node-bar-container {
    grid-area: node-bar;
  }

  #workflow-canvas-container {
    grid-area: canvas;
    margin: 0;
    overflow: auto;
  }
</style>
