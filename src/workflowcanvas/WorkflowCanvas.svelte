<script lang="ts" context="module">
  import axios from "axios";
  import "@svgdotjs/svg.draggable.js";

  import { WorkflowCanvas } from "./classes/workflowcanvas.js";

  // All node events are handled by the global canvas instance.
  let canvas: WorkflowCanvas = null;

  let lastMessageFrameOrigin: string = null;

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
  import { WorkflowConnector } from "./classes/workflowconnector.js";

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

  const updateValidConnections = async () => {
    const workflowUrl: string =
      "http://localhost:3000/v1/orchestration/workflows";
    try {
      const workflowResponse = await axios.get(workflowUrl, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      });
      const workflowData = workflowResponse.data.data[0];
      canvas.validSrcToDestMap = new Map(
        Object.entries(workflowData.attributes.valid_connections)
      );
      console.log(workflowData);
    } catch (exception) {
      console.log(`error received from GET ${workflowUrl}: ${exception}`);
    }
  };

  onMount(() => {
    canvas = new WorkflowCanvas("workflow-canvas", canvasWidth, canvasHeight);
    canvas.svgNode.style.display = "block";

    canvas.nodePlacedHandler = async (node: WorkflowNode) => {
      const url: string = "http://localhost:3000/v1/orchestration/nodes";
      try {
        const response = await axios.post(
          url,
          {
            data: {
              type: "nodes",
            },
          },
          {
            headers: {
              Accept: "application/vnd.api+json",
              "Content-Type": "application/vnd.api+json",
            },
          }
        );
        if (response.status === 201) {
          node.nodeId = response.data.data.id;
          node.attributes = response.data.data.attributes;
        }
      } catch (exception) {
        console.log(`error received from POST ${url}: ${exception}`);
      }
      updateValidConnections();
    };

    canvas.nodeDeletedHandler = async (nodeId: string) => {
      const url: string = `http://localhost:3000/v1/orchestration/nodes/${nodeId}`;
      try {
        await axios.delete(url, {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        });
      } catch (exception) {
        console.log(`error received from DELETE ${url}: ${exception}`);
      }
      updateValidConnections();
    };

    canvas.nodeEditRequestedHandler = (node: WorkflowNode) => {
      const notebookUrl = node.attributes.notebook_attributes.url;
      dispatch("nodeEditRequested", { notebookUrl });
      console.log("notebookurl");
      console.log(notebookUrl);
      console.log("iframe loaded");
      console.log(lastMessageFrameOrigin);

      // run only if there is atleast one output and input
      console.log("output code snippet");
      (async () => {
        console.log("inside check cirrrrrrr")
        if (lastMessageFrameOrigin == null)
          return
        const timeStarted: any = new Date();
        var interval = setInterval(() => {
          let DateNow: any = new Date();
          if (
            notebookUrl.split("/")[2] === lastMessageFrameOrigin.split("/")[2]
          ) {
            console.log("correct origin detected");
            console.log("resolved after", DateNow - timeStarted, "ms");
            console.log(node.attributes.notebook_attributes.io.output_code);

            if (node.attributes.input)
              node.InsertInputsMessageMercuryExtension();
            if (node.attributes.output)
              node.InsertOutputsMessageMercuryExtension();
            clearInterval(interval)
          } else if (DateNow - timeStarted > 5000) {
            console.log(
              "Timed out waiting for notebook after ",
              DateNow - timeStarted,
              "ms"
            );
          }
        }, 20);
      })();
    };

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
      const url: string = `http://localhost:3000/v1/orchestration/nodes/${nodeId}`;
      try {
        const response = await axios.patch(
          url,
          {
            data: {
              type: "nodes",
              id: nodeId,
              attributes: {
                input: inputNames,
                output: outputNames,
              },
            },
          },
          {
            headers: {
              Accept: "application/vnd.api+json",
              "Content-Type": "application/vnd.api+json",
            },
          }
        );
        node.attributes = response.data.data.attributes;
      } catch (exception) {
        console.log(`error received from PATCH ${url}: ${exception}`);
      }
    };

    canvas.connectorAddedHandler = async (
      src: IOPort,
      dest: IOPort,
      connector: WorkflowConnector
    ) => {
      const srcNodeId = src.workflowNode.nodeId;
      const outputName = src.name;
      const destNodeId = dest.workflowNode.nodeId;
      const inputName = dest.name;

      const url = "http://localhost:3000/v1/orchestration/connectors";
      try {
        const response = await axios.post(
          url,
          {
            data: {
              type: "connectors",
              attributes: {
                source: {
                  node_id: srcNodeId,
                  output: outputName,
                },
                destination: {
                  node_id: destNodeId,
                  input: inputName,
                },
              },
            },
          },
          {
            headers: {
              Accept: "application/vnd.api+json",
              "Content-Type": "application/vnd.api+json",
            },
          }
        );
        connector.connectorId = response.data.data.id;
      } catch (exception) {
        console.log(`error received from POST ${url}: ${exception}`);
      }

      const srcNodeUrl =
        "http://localhost:3000/v1/orchestration/nodes/" + srcNodeId;
      try {
        const srcNodeResponse = await axios.get(srcNodeUrl, {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        });
        src.workflowNode.attributes = srcNodeResponse.data.data.attributes;
      } catch (exception) {
        console.log(`error received from GET ${srcNodeUrl}: ${exception}`);
      }

      const destNodeUrl =
        "http://localhost:3000/v1/orchestration/nodes/" + destNodeId;
      try {
        const destNodeResponse = await axios.get(destNodeUrl, {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        });
        dest.workflowNode.attributes = destNodeResponse.data.data.attributes;
      } catch (exception) {
        console.log(`error received from GET ${destNodeUrl}: ${exception}`);
      }

      updateValidConnections();
    };

    canvas.connectorDeletedHandler = async (connectorId: string) => {
      const url = `http://localhost:3000/v1/orchestration/connectors/${connectorId}`;
      try {
        await axios.delete(url, {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        });
      } catch (exception) {
        console.log(`error received from DELETE ${url}: ${exception}`);
      }
      updateValidConnections();
    };
  });

  // listen to iframe message event
  window.addEventListener("message", (event) => {
    lastMessageFrameOrigin = event.origin;
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
