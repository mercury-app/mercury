<script lang="ts" context="module">
  import "@svgdotjs/svg.draggable.js";

  import { WorkflowCanvas } from "./classes/workflowcanvas.js";

  // All node events are handled by the global canvas instance.
  let canvas: WorkflowCanvas = null;

  export const placeNewNode = () => {
    if (canvas !== null) {
      canvas.placeNewNode();
    }
  };

  export const addInputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.addInputOnSelectedNode(name);
    }
  };

  export const addOutputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.addOutputOnSelectedNode(name);
    }
  };

  export const removeInputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.removeInputOnSelectedNode(name);
    }
  };

  export const removeOutputOnSelectedNode = (name: string) => {
    if (canvas !== null) {
      canvas.removeOutputOnSelectedNode(name);
    }
  };
</script>

<script lang="ts">
  import axios from "axios";
  import { createEventDispatcher } from "svelte";
  import { onMount } from "svelte";

  import { WorkflowNode } from "./classes/workflownode";
  import { IOPort } from "./classes/ioport";

  const dispatch = createEventDispatcher();

  export let numColumns: number = 20;
  export let numRows: number = 20;
  export let colWidth: number = 50;
  export let rowHeight: number = 50;

  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;

  onMount(() => {
    canvas = new WorkflowCanvas("workflow-canvas", canvasWidth, canvasHeight);
    canvas.svgNode.style.display = "block";

    canvas.nodePlacedHandler = async (node: WorkflowNode) => {
      const url: string = "http://localhost:3000/v1/caduceus/nodes";
      try {
        const response = await axios.post(url, {});
        const nodeId: string = response.data.response.id;
        const containerId: string = response.data.response.container_id;
        const notebookUrl: string = response.data.response.nodebook_url;
        setTimeout(function () {
          node.nodeId = nodeId;
          node.containerId = containerId;
          node.notebookUrl = notebookUrl;
        }, 1000);
      } catch (exception) {
        console.log(`error received from ${url}: ${exception}`);
      }
    };

    canvas.nodeEditRequestedHandler = () => dispatch("nodeEditRequested");

    canvas.nodeSelectedHandler = (node: WorkflowNode) => {
      const inputNames = node.inputPorts.map((port: IOPort) => {
        return port.name;
      });
      const outputNames = node.outputPorts.map((port: IOPort) => {
        return port.name;
      });
      dispatch("ioNamesChanged", { inputNames, outputNames });
    };
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
