<script lang="ts">
  import Headerbar from "./Headerbar.svelte";
  import WorkflowCanvas from "./WorkflowCanvas.svelte";

  const headerbarHeight = 44;

  const numCanvasColumns = 20;
  const numCanvasRows = 20;
  const canvasColWidth = 100;
  const canvasRowHeight = 100;
</script>

<main>
  <Headerbar headerbarHeight="{headerbarHeight}" />
  <div id="workflow-canvas-container" style="top: {headerbarHeight}px;">
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
    }
  }

  #workflow-canvas-container {
    margin: 0;
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: scroll;
  }
</style>
