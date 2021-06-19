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

  export const executeOnNotebookOverlayClosed = () => {
    if (canvas != null) {
      canvas.executeOnNotebookOverlayClosed();
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

      (async () => {
        await node.updateAttributes();
        console.log("inside check cirrrrrrr");
        if (lastMessageFrameOrigin == null) return;
        const timeStarted: any = new Date();
        var interval = setInterval(() => {
          let DateNow: any = new Date();
          if (
            notebookUrl.split("/")[2] === lastMessageFrameOrigin.split("/")[2]
          ) {
            console.log("correct origin detected");
            console.log("resolved after", DateNow - timeStarted, "ms");
            if (node.attributes.input) {
              console.log("starting input injection");
              console.log(
                "code- ",
                node.attributes.notebook_attributes.io.input_code
              );
              node.executeInputCodeInNotebookKernel();
              node.insertInputsMessageMercuryExtension();
              node.insertOutputsMessageMercuryExtension();
            }
            clearInterval(interval);
          } else if (DateNow - timeStarted > 5000) {
            console.log(
              "Timed out waiting for notebook after ",
              DateNow - timeStarted,
              "ms"
            );
            clearInterval(interval);
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

      // on creation of a connector, the source node tries to write its outputs to the json
      src.workflowNode.writeOutputsFromNotebookKernel();
      updateValidConnections();
    };

    canvas.connectorDeletedHandler = async (
      src: IOPort,
      dest: IOPort,
      connectorId: string
    ) => {
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

      // write outputs from source into json when a connector is deleted
      src.workflowNode.writeOutputsFromNotebookKernel();
      updateValidConnections();
    };

    // listen to iframe message event
    window.addEventListener("message", (event) => {
      lastMessageFrameOrigin = event.origin;
    });
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
