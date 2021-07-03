<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

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
    const projectName = window.prompt("Enter project name");

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
  };

  const openProject = async (projectId: string) => {
    push(`/projects/${projectId}/workflow_builder`);
  };

  const deleteProject = async (projectId: string) => {
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
  }

  .project-select-button:hover {
    background-color: #f8f8f8;
    cursor: pointer;
  }

  .project-select-button:hover + .project-delete-button {
    display: flex;
  }

  .project-delete-button {
    position: absolute;
    width: var(--default-button-width);
    height: var(--default-button-height);
    top: calc((100% - var(--default-button-height)) / 2);
    right: calc(var(--common-spacing) * 2);

    /* Hidden by default */
    display: none;
  }

  .horizontal-separator {
    border-bottom: var(--common-border-width) solid var(--main-border-color);
  }
</style>
