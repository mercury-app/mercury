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
  import { onMount, getContext } from "svelte";
  import { fade, scale } from "svelte/transition";

  import type { WorkflowCanvasJson } from "./interfaces";
  import type { WorkflowAttributes } from "./types.js";
  import { WorkflowNode } from "./classes/workflownode";
  import { IOPort } from "./classes/ioport";
  import { WorkflowConnector } from "./classes/workflowconnector";
  import MessageModal from "../../misc/modals/MessageModal.svelte";
  import TextInputModal from "../../misc/modals/TextInputModal.svelte";

  const dispatch = createEventDispatcher();
  const { open, close } = getContext("simple-modal");

  export let projectId: string;
  export let numColumns: number = 20;
  export let numRows: number = 20;
  export let colWidth: number = 50;
  export let rowHeight: number = 50;
  export let runningWorkflow = false;
  export let notebookUrl;

  const canvasWidth = numColumns * colWidth;
  const canvasHeight = numRows * rowHeight;
  let workflowId = "";

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

  const createWorkflow = async (
    projectId: string,
    notebooksDir: string,
    workflowAttributes: WorkflowAttributes = {}
  ): Promise<string> => {
    const data = {
      id: projectId,
      type: "workflows",
      attributes: {
        notebooks_dir: notebooksDir,
      },
    };
    if (Object.entries(workflowAttributes).length !== 0) {
      data.attributes = {
        ...data.attributes,
        ...workflowAttributes,
      };
    }

    const workflowUrl = `http://localhost:3000/v1/orchestration/workflows`;
    try {
      const response = await axios.post(
        workflowUrl,
        {
          data,
        },
        {
          headers: {
            Accept: "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json",
          },
        }
      );
      if (response.status === 201) {
        return response.data.data.id;
      }
    } catch (exception) {
      console.log(`error received from POST ${workflowUrl}: ${exception}`);
    }
    return "";
  };

  const fetchWorkflowAttributes = async (
    workflowId: string
  ): Promise<Record<string, unknown>> => {
    const workflowUrl = `http://localhost:3000/v1/orchestration/workflows/${workflowId}`;
    try {
      const workflowResponse = await axios.get(workflowUrl, {
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
      });
      return workflowResponse.data.data.attributes as Record<string, unknown>;
    } catch (exception) {
      console.log(`error received from GET ${workflowUrl}: ${exception}`);
    }
    return {};
  };

  const updateValidConnections = async (workflowId: string) => {
    const workflowAttributes = await fetchWorkflowAttributes(workflowId);
    canvas.validSrcToDestMap = new Map(
      Object.entries(workflowAttributes.valid_connections)
    );
  };

  const fetchProjectAttributes = async (
    projectId: string
  ): Promise<Record<string, unknown>> => {
    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      return response.data.data.attributes;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return {};
  };

  const saveCanvasAndWorkflow = async (
    projectId: string,
    workflowCanvasJson: WorkflowCanvasJson,
    workflowAttributes: WorkflowAttributes
  ): Promise<void> => {
    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      await axios.patch(
        url,
        {
          data: {
            type: "projects",
            id: projectId,
            attributes: {
              canvas: workflowCanvasJson,
              workflow: workflowAttributes,
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

  onMount(async () => {
    canvas = new WorkflowCanvas("workflow-canvas", canvasWidth, canvasHeight);
    canvas.svgNode.style.display = "block";

    canvas.nodeAddedHandler = async (node: WorkflowNode) => {
      open(
        TextInputModal,
        {
          inputTitle: "Please enter a name for this node",
          inputDetail: "",
          acceptButtonText: "Done",
          acceptHandler: async (nodeName: string) => {
            close();

            node.title = nodeName;
            const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/nodes`;
            try {
              const response = await axios.post(
                url,
                {
                  data: {
                    type: "nodes",
                    attributes: {
                      name: node.title,
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
              if (response.status === 201) {
                node.nodeId = response.data.data.id;
                node.attributes = response.data.data.attributes;
              }
            } catch (exception) {
              console.log(`error received from POST ${url}: ${exception}`);
            }
            updateValidConnections(workflowId);

            const workflowAttributes = await fetchWorkflowAttributes(
              workflowId
            );
            saveCanvasAndWorkflow(
              projectId,
              canvas.toJson(),
              workflowAttributes
            );
          },
          validationHandler: (
            title: string
          ): { isValid: boolean; validationMessage: string } => {
            if (title === "") {
              return {
                isValid: false,
                validationMessage: "",
              };
            }
            if (title.match(/[^-_.A-Za-z0-9]/)) {
              return {
                isValid: false,
                validationMessage: "Invalid characters present in given name",
              };
            }
            const existingNodes = canvas.nodes;
            if ([...existingNodes].some((node) => node.title == title)) {
              return {
                isValid: false,
                validationMessage: "A node with that name already exists",
              };
            }
            return { isValid: true, validationMessage: "" };
          },
        },
        {
          closeButton: false,
          closeOnEsc: false,
          closeOnOuterClick: false,
          styleWindow: { "max-width": "max-content", "border-radius": "3px" },
          transitionBg: fade,
          transitionWindow: scale,
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
    };

    canvas.nodeDeletedHandler = async (nodeId: string) => {
      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/nodes/${nodeId}`;
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
      updateValidConnections(workflowId);

      const workflowAttributes = await fetchWorkflowAttributes(workflowId);
      saveCanvasAndWorkflow(projectId, canvas.toJson(), workflowAttributes);
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
      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/nodes/${nodeId}`;
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

      const workflowAttributes = await fetchWorkflowAttributes(workflowId);
      saveCanvasAndWorkflow(projectId, canvas.toJson(), workflowAttributes);
    };

    canvas.nodeMovedHandler = async (_node: WorkflowNode) => {
      const workflowAttributes = await fetchWorkflowAttributes(workflowId);
      saveCanvasAndWorkflow(projectId, canvas.toJson(), workflowAttributes);
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

      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/connectors`;
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
      updateValidConnections(workflowId);

      const workflowAttributes = await fetchWorkflowAttributes(workflowId);
      saveCanvasAndWorkflow(projectId, canvas.toJson(), workflowAttributes);
    };

    canvas.connectorDeletedHandler = async (
      src: IOPort,
      dest: IOPort,
      connectorId: string
    ) => {
      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}/connectors/${connectorId}`;
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
      updateValidConnections(workflowId);

      const workflowAttributes = await fetchWorkflowAttributes(workflowId);
      saveCanvasAndWorkflow(projectId, canvas.toJson(), workflowAttributes);

      // write outputs from source into json when a connector is deleted
      await src.workflowNode.updateAttributes();
      notebookUrl = src.workflowNode.attributes.notebook_attributes.url;
      waitForCorrectIframe(notebookUrl)
        .then(() => console.log("Correct Iframe detected"))
        .then(() => src.workflowNode.insertOutputsMessageMercuryExtension());
    };

    canvas.runWorkflow = async () => {
      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}`;
      try {
        const response = await axios.patch(
          url,
          {
            data: {
              id: workflowId,
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
      const url = `http://localhost:3000/v1/orchestration/workflows/${workflowId}`;
      try {
        const response = await axios.patch(
          url,
          {
            data: {
              id: workflowId,
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

    open(
      MessageModal,
      {
        messageTitle: "Please wait. Your workflow is being restored…",
        acceptButtonText: "",
      },
      {
        closeButton: false,
        closeOnOuterClick: false,
        styleWindow: {
          "max-width": "max-content",
          "border-radius": "3px",
          "min-width": "420px",
        },
        transitionBg: fade,
        transitionWindow: scale,
      }
    );

    // Load any previously saved state for this project
    const projectAttributes = await fetchProjectAttributes(projectId);
    const workflowCanvasJson = projectAttributes[
      "canvas"
    ] as WorkflowCanvasJson;
    const workflowAttributes = projectAttributes[
      "workflow"
    ] as WorkflowAttributes;
    const notebooksDir = projectAttributes["notebooks_dir"] as string;

    // Create a new workflow and store its ID for all future orchestration calls
    workflowId = await createWorkflow(
      projectId,
      notebooksDir,
      workflowAttributes
    );
    canvas.workflowId = workflowId;
    updateValidConnections(workflowId);

    // Restore the canvas for this project, only after the backend is ready
    canvas.fromJson(workflowCanvasJson);

    close();
  });
</script>

<div id="workflow-canvas" tabindex="-1"></div>
