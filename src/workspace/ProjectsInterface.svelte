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

  let projects = [];
  onMount(async () => {
    projects = await fetchAllProjects();
  });
</script>

<div>
  <button on:click="{createAndOpenProject}">New project</button>
  <div id="project-list">
    {#each projects as project}
      <button on:click="{() => openProject(project.id)}">
        {project.attributes.name}
      </button>
    {/each}
  </div>
</div>
