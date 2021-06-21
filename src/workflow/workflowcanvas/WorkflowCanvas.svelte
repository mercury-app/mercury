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

  export const runWorkflowRequestedHandler = async () => {
    if (canvas != null) {
      canvas.toggleNodeSelectionMenuButtons(true);
      await canvas.runWorkflowRequestedHandler();
      canvas.toggleNodeSelectionMenuButtons(false);
    }
  };

  export const stopWorkflowRequestedHandler = async () => {
    if (canvas != null) {
      canvas.toggleNodeSelectionMenuButtons(true);
      await canvas.stopWorkflowRequestedHandler();
      canvas.toggleNodeSelectionMenuButtons(false);
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

  export let projectId: string;
  export let numColumns: number = 20;
  export let numRows: number = 20;
  export let colWidth: number = 50;
  export let rowHeight: number = 50;
  export let runningWorkflow = false;
  export let notebookUrl;

  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;

  // For high-latency testing purposes
  function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  const waitForCorrectIframe = async (
    notebookUrl: string
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      let correctIframe = false;
      const timeStarted: Date = new Date();
      const interval = setInterval(() => {
        const DateNow: Date = new Date();
        if (
          lastMessageFrameOrigin !== null &&
          notebookUrl.split("/")[2] === lastMessageFrameOrigin.split("/")[2]
        ) {
          console.log("correct origin detected");
          const resolvedTime = DateNow.getTime() - timeStarted.getTime();
          console.log("resolved after", resolvedTime, "ms");
          correctIframe = true;
          clearInterval(interval);
          resolve(true);
        } else if (DateNow.getTime() - timeStarted.getTime() > 25000) {
          console.log(lastMessageFrameOrigin);
          console.log(
            "Timed out waiting for notebook after ",
            DateNow.getTime() - timeStarted.getTime(),
            "ms"
          );
          clearInterval(interval);
        }
      }, 20);
    });
  };

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
      canvas.workflowId = workflowData.id;
      canvas.validSrcToDestMap = new Map(
        Object.entries(workflowData.attributes.valid_connections)
      );
      console.log(workflowData);
    } catch (exception) {
      console.log(`error received from GET ${workflowUrl}: ${exception}`);
    }
    console.log(canvas.toJson());
  };

  onMount(() => {
    canvas = new WorkflowCanvas("workflow-canvas", canvasWidth, canvasHeight);
    canvas.svgNode.style.display = "block";
    console.log(projectId);

    canvas.nodeAddedHandler = async (node: WorkflowNode) => {
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

      const websocket = new WebSocket(
        `ws://localhost:3000/v1/orchestration/nodes/${node.nodeId}/ws`
      );

      websocket.onopen = (event) => {
        console.log(`WebSocket opened for node`);
      };

      websocket.onmessage = (event) => {
        console.log(`Message received`);
        const message = JSON.parse(event.data);
        node.attributes = message.attributes;
        node.title = "Untitled";
        let kernelStatus;

        if (runningWorkflow) {
          kernelStatus =
            node.attributes.notebook_attributes.workflow_kernel_state;
        } else kernelStatus = node.attributes.notebook_attributes.kernel_state;

        if (kernelStatus == "busy") {
          node.kernelStatusElement.fill("darkgrey");
        }

        if (kernelStatus == "idle") {
          node.kernelStatusElement.fill("#E8E8E8");
        }
      };

      websocket.onclose = (event) => {
        console.log("websocket closed for node");
      };

      node.ws = websocket;
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

      waitForCorrectIframe(notebookUrl)
        .then(() => node.updateAttributes())
        .then(() => console.log("Correct Iframe detected"))
        .then(() => node.insertInputsMessageMercuryExtension())
        .then(() => node.insertOutputsMessageMercuryExtension());
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
      // for this we also need to set the active iframae as the source node of the connector
      // and wait for the iframe to be loaded for injecting the cell
      await src.workflowNode.updateAttributes();
      notebookUrl = src.workflowNode.attributes.notebook_attributes.url;
      waitForCorrectIframe(notebookUrl)
        .then(() => console.log("Correct Iframe detected"))
        .then(() => src.workflowNode.insertOutputsMessageMercuryExtension());
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
      await src.workflowNode.updateAttributes();
      notebookUrl = src.workflowNode.attributes.notebook_attributes.url;
      waitForCorrectIframe(notebookUrl)
        .then(() => console.log("Correct Iframe detected"))
        .then(() => src.workflowNode.insertOutputsMessageMercuryExtension());
    };

    canvas.runWorkflow = async () => {
      const url = `http://localhost:3000/v1/orchestration/workflows/${canvas.workflowId}`;
      try {
        const response = await axios.patch(
          url,
          {
            data: {
              id: canvas.workflowId,
              type: "workflows",
              attributes: {
                state: "run",
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
        console.log(
          "workflow execution exit code: ",
          response.data.data.attributes.run_exit_code
        );
      } catch (exception) {
        console.log(`error received from PATCH ${url}: ${exception}`);
      }
    };

    canvas.stopWorkflow = async () => {
      const url = `http://localhost:3000/v1/orchestration/workflows/${canvas.workflowId}`;
      try {
        const response = await axios.patch(
          url,
          {
            data: {
              id: canvas.workflowId,
              type: "workflows",
              attributes: {
                state: "stop",
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
      } catch (exception) {
        console.log(`error received from PATCH ${url}: ${exception}`);
      }
    };

    // listen to iframe message event
    window.addEventListener("message", (event) => {
      console.log(`message received from ${event.origin}`);
      if ("scope" in event.data) {
        if (event.data.scope === "mercury") {
          lastMessageFrameOrigin = event.origin;
          console.log("message received from mercury nbextension");
        }
      }
    });
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
