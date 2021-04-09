<script lang="ts">
  import NotebookOverlay from "./NotebookOverlay.svelte";
  import WorkflowActions from "./WorkflowActions.svelte";
  import WorkflowBar from "./WorkflowBar.svelte";
  import WorkflowCanvas, { placeNewNode } from "./WorkflowCanvas.svelte";

  const workflowBarWidth = 48;

  const numCanvasColumns = 24;
  const numCanvasRows = 24;
  const canvasColWidth = 100;
  const canvasRowHeight = 100;

  let notebookOverlayVisible = false;
</script>

<main>
  <div id="workflow-builder-main">
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
        on:editNodeRequested="{() => (notebookOverlayVisible = true)}"
      />
    </div>
    <div class="container" id="workflow-actions-container">
      <WorkflowActions />
    </div>
    <div>
      <NotebookOverlay bind:visible="{notebookOverlayVisible}" />
    </div>
  </div>
</main>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
      height: 100%;
    }

    #workflow-builder-main {
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

  #workflow-actions-container {
    max-width: max-content;

    margin-left: auto;
    margin-right: auto;

    position: absolute;
    bottom: 24px;
    left: 0;
    right: 0;
  }
</style>
