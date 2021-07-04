<script lang="ts">
  import axios from "axios";
  import { onMount, getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import MessageModal from "../misc/modals/MessageModal.svelte";
  import TextInputModal from "../misc/modals/TextInputModal.svelte";

  const { open, close } = getContext("simple-modal");

  const fetchAllProjects = async (): Promise<
    Array<Record<string, unknown>>
  > => {
    let projects = [];

    const url = "http://localhost:3000/v1/workspace/projects";
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      projects = response.data.data;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return projects;
  };

  const createAndOpenProject = async () => {
    open(
      TextInputModal,
      {
        inputTitle: "Please enter a name for the project",
        inputDetail: "",
        rejectButtonText: "Cancel",
        acceptButtonText: "Create",
        rejectHandler: () => {
          close();
        },
        acceptHandler: async (projectName: string) => {
          close();

          const url = "http://localhost:3000/v1/workspace/projects";
          try {
            const response = await axios.post(
              url,
              {
                data: {
                  type: "projects",
                  attributes: {
                    name: projectName,
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
            if (response.status === 200) {
              const projectId = response.data.data.id;
              openProject(projectId);
            }
          } catch (exception) {
            console.log(`error received from POST ${url}: ${exception}`);
          }
        },
      },
      {
        closeButton: false,
        closeOnOuterClick: false,
        styleWindow: { "max-width": "max-content", "border-radius": "3px" },
        transitionBg: fade,
        transitionWindow: scale,
      }
    );
  };

  const openProject = async (projectId: string) => {
    push(`/projects/${projectId}/workflow_builder`);
  };

  const deleteProject = async (projectId: string) => {
    open(
      MessageModal,
      {
        messageTitle: `Confirm project deletion`,
        messageDetail:
          "This action cannot be undone. Your workflow, application and " +
          "notebooks will be permanently deleted. Do you want to continue?",
        rejectButtonText: "No",
        acceptButtonText: "Yes",
        rejectHandler: () => {
          close();
        },
        acceptHandler: async () => {
          close();

          const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
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
          projects = await fetchAllProjects();
        },
      },
      {
        closeButton: false,
        closeOnOuterClick: false,
        styleWindow: { "max-width": "max-content", "border-radius": "3px" },
        transitionBg: fade,
        transitionWindow: scale,
      }
    );
  };

  let projects = [];
  onMount(async () => {
    projects = await fetchAllProjects();
  });
</script>

<div id="project-interface-container">
  <div id="project-interface-header">
    <h1>Projects</h1>
    <button on:click="{createAndOpenProject}">Create new</button>
  </div>
  {#if projects.length > 0}
    <div id="project-list">
      {#each projects as project}
        <div class="project-list-item">
          <button
            class="project-select-button"
            on:click="{() => openProject(project.id)}"
          >
            {project.attributes.name}
          </button>
          <button
            class="project-delete-button"
            on:click="{() => deleteProject(project.id)}"
          >
            <img src="/icons/trash.svg" alt="Delete project" class="icon" />
          </button>
        </div>
        <div class="horizontal-separator"></div>
      {/each}
    </div>
  {:else}
    <div id="project-list-empty-label">
      <h4>It seems like there are no existing projects in this workspace.</h4>
      <h4>Please create a new project to get started.</h4>
    </div>
  {/if}
</div>

<style>
  #project-interface-container {
    height: 100%;
    margin: 0 20%;
  }

  #project-interface-header {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  #project-interface-header h1 {
    flex: auto;
  }

  #project-interface-header button {
    height: var(--default-button-height);
    padding: var(--common-spacing);
  }

  #project-list {
    width: 100%;
    max-height: 80%;
    overflow: auto;

    border: var(--common-border-width) solid var(--main-border-color);
    border-radius: var(--common-radius);
  }

  /* This hides the last vertical separator */
  #project-list div:last-of-type {
    display: none;
  }

  .project-list-item {
    display: flex;
    flex-direction: row;
    position: relative;
    height: calc(var(--default-button-height) + (var(--common-spacing) * 4));
  }

  .project-select-button {
    flex: auto;
    padding: calc(var(--common-spacing) * 2);
    border: none;
    justify-content: left;

    background-color: white;
    font-weight: bolder;
  }

  .project-select-button:hover {
    background-color: #f8f8f8;
    cursor: pointer;
  }

  .project-select-button:hover + .project-delete-button {
    visibility: visible;
  }

  .project-delete-button {
    position: absolute;
    width: var(--default-button-width);
    height: var(--default-button-height);
    top: calc((100% - var(--default-button-height)) / 2);
    right: calc(var(--common-spacing) * 2);

    /* Hidden by default */
    visibility: hidden;
  }

  .horizontal-separator {
    border-bottom: var(--common-border-width) solid var(--main-border-color);
  }

  #project-list-empty-label {
    margin: 10% 25%;
    text-align: center;
    line-height: 0.2em;
    color: gray;
  }
</style>
