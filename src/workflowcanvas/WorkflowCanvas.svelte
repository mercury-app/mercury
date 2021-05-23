<script lang="ts" context="module">
  import axios from "axios";
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

  // For high-latency testing purposes
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  onMount(() => {
    canvas = new WorkflowCanvas("workflow-canvas", canvasWidth, canvasHeight);
    canvas.svgNode.style.display = "block";

    canvas.nodePlacedHandler = async (node: WorkflowNode) => {
      const url: string = "http://localhost:3000/v1/caduceus/nodes";
      try {
        // TODO: remove this
        await sleep(2000);

        const response = await axios.post(url, {});
        node.nodeId = response.data.response.id;
        node.containerId = response.data.response.container_id;
        node.notebookUrl = response.data.response.nodebook_url;
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

    canvas.nodeIOChangedHandler = async (node: WorkflowNode) => {
      const inputNames = node.inputPorts.map((port: IOPort) => {
        return port.name;
      });
      const outputNames = node.outputPorts.map((port: IOPort) => {
        return port.name;
      });

      const nodeId = node.nodeId;
      const url: string = `http://localhost:3000/v1/caduceus/nodes/${nodeId}`;
      try {
        const inputArgs = inputNames.reduce(
          (o, key) => ({ ...o, [key]: "" }),
          {}
        );
        const outputArgs = outputNames.reduce(
          (o, key) => ({ ...o, [key]: "" }),
          {}
        );
        await axios.put(url, {
          input: inputArgs,
          output: outputArgs,
        });
      } catch (exception) {
        console.log(`error received from ${url}: ${exception}`);
      }
    };
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
