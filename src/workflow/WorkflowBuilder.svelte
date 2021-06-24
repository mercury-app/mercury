<script lang="ts">
  import NotebookOverlay from "./NotebookOverlay.svelte";
  import WorkflowActions from "./WorkflowActions.svelte";
  import WorkflowBar from "./WorkflowBar.svelte";
  import WorkflowCanvas, {
    placeNewNode,
    addInputOnSelectedNode,
    addOutputOnSelectedNode,
    removeInputOnSelectedNode,
    removeOutputOnSelectedNode,
    executeOnNotebookOverlayClosed,
    runWorkflowRequestedHandler,
    stopWorkflowRequestedHandler,
  } from "./workflowcanvas/WorkflowCanvas.svelte";

  export let params = {
    project_id: "",
  };

  const workflowBarWidth = 48;

  const numCanvasColumns = 24;
  const numCanvasRows = 24;
  const canvasColWidth = 100;
  const canvasRowHeight = 100;

  let notebookOverlayVisible = false;
  let selectedNotebookInputs: Array<string> = [];
  let selectedNotebookOutputs: Array<string> = [];
  const updateNotebookIO = (event: CustomEvent) => {
    selectedNotebookInputs = event.detail.inputNames;
    selectedNotebookOutputs = event.detail.outputNames;
  };

  let notebookUrl = "about:blank";
  const editNotebook = (event: CustomEvent) => {
    notebookUrl = event.detail.notebookUrl;
    notebookOverlayVisible = true;
  };

  const runWorkflowRequested = async (event: CustomEvent) => {
    runningWorkflow = true;
    await runWorkflowRequestedHandler();
    console.log("workflow execution complete");
    runningWorkflow = false;
    reloadIframe = true;
  };

  const stopWorkflowRequested = async (event: CustomEvent) => {
    runningWorkflow = true;
    await stopWorkflowRequestedHandler();
    console.log("workflow stopped");
    runningWorkflow = false;
    reloadIframe = true;
  };

  let runningWorkflow = false;
  let reloadIframe = false;
</script>

<div id="workflow-builder-main">
  <div class="container" id="workflow-bar-container">
    <WorkflowBar
      bind:runningWorkflow
      workflowBarWidth="{workflowBarWidth}"
      on:newNodeRequested="{placeNewNode}"
    />
  </div>
  <div class="container" id="workflow-canvas-container">
    <WorkflowCanvas
      bind:runningWorkflow
      bind:notebookUrl
      projectId="{params.project_id}"
      numColumns="{numCanvasColumns}"
      numRows="{numCanvasRows}"
      colWidth="{canvasColWidth}"
      rowHeight="{canvasRowHeight}"
      on:ioNamesChanged="{updateNotebookIO}"
      on:nodeEditRequested="{editNotebook}"
    />
  </div>
  <div class="container" id="workflow-actions-container">
    <WorkflowActions
      bind:runningWorkflow
      on:workflowRunRequested="{runWorkflowRequested}"
      on:workflowStopRequested="{stopWorkflowRequested}"
    />
  </div>
  <div>
    <NotebookOverlay
      bind:visible="{notebookOverlayVisible}"
      bind:inputs="{selectedNotebookInputs}"
      bind:outputs="{selectedNotebookOutputs}"
      bind:notebookUrl
      bind:reloadIframe
      on:inputAdded="{(event) =>
        addInputOnSelectedNode(event.detail.inputName)}"
      on:outputAdded="{(event) =>
        addOutputOnSelectedNode(event.detail.outputName)}"
      on:inputRemoved="{(event) =>
        removeInputOnSelectedNode(event.detail.inputName)}"
      on:outputRemoved="{(event) =>
        removeOutputOnSelectedNode(event.detail.outputName)}"
      on:notebookPanelRemoved="{() => executeOnNotebookOverlayClosed()}"
    />
  </div>
</div>

<style>
  #workflow-builder-main {
    height: 100%;
    height: calc(
      100% - var(--common-toolbar-width) - var(--common-border-width)
    );
    display: grid;
    grid-template-columns: var(--common-toolbar-width) auto;
    grid-template-areas: "workflow-bar-container workflow-canvas-container";
    gap: 0;
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
