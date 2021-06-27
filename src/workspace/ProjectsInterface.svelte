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

<div>
  <button on:click="{createAndOpenProject}">New project</button>
  <div id="project-list">
    {#each projects as project}
      <div class="project-list-item">
        <button on:click="{() => openProject(project.id)}">
          {project.attributes.name}
        </button>
        <button on:click="{() => deleteProject(project.id)}">
          <img src="/icons/trash.svg" alt="Delete project" class="icon" />
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .project-list-item {
    display: flex;
    flex-direction: row;
  }
</style>
