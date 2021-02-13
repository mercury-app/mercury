<script lang="ts">
  import WorkflowCanvas from "./WorkflowCanvas.svelte";
  import "simplebar";
  import "simplebar/dist/simplebar.css";

  const numColumns = 20;
  const numRows = 20;
  const colWidth = 100;
  const rowHeight = 100;
  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;
</script>

<main>
  <div id="workflow-canvas-container" data-simplebar>
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
    border-left: 1px solid lightgray;
    border-right: 1px solid lightgray;
  }
</style>
