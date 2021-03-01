<script lang="ts">
  import WorkflowCanvas from "./WorkflowCanvas.svelte";
  import "simplebar";
  import "simplebar/dist/simplebar.css";

  const numColumns = 20;
  const numRows = 20;
  const colWidth = 100;
  const rowHeight = 100;
</script>

<main>
  <div id="workflow-canvas-container" data-simplebar>
    <WorkflowCanvas
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
    margin: 0;
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    width: 100%;
  }
</style>
