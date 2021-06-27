<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

  export let projectId = "";
  let projectName = "Untitled";

  const fetchProjectName = async (projectId: string): Promise<string> => {
    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      return response.data.data.attributes.name;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return "";
  };

  const openVersionControlInterface = async (projectId: string) => {
    push(`/projects/${projectId}/version_control`);
  };

  onMount(async () => (projectName = await fetchProjectName(projectId)));
</script>

<div id="header-bar-container">
  <div id="header-bar">
    <button id="header-bar-project-button" class="header-bar-item">
      {projectName}
    </button>
    <button
      class="header-bar-item header-bar-button"
      on:click="{() => openVersionControlInterface(projectId)}"
    >
      <img
        src="/icons/history.svg"
        alt="Show version control history for project"
        class="icon"
      />
    </button>
    <button
      class="header-bar-item header-bar-button"
      on:click="{() => console.log('commit!')}"
    >
      <img
        src="/icons/git-commit.svg"
        alt="Commit changes to project"
        class="icon"
      />
    </button>
  </div>
</div>

<style>
  #header-bar-container {
    height: var(--common-toolbar-width);
    width: 100%;
    border-bottom: var(--common-border-width) solid var(--main-border-color);
  }

  #header-bar {
    display: flex;
    flex-direction: row;
    align-items: center;

    height: var(--common-toolbar-width);
    padding-left: var(--common-spacing);
  }

  #header-bar-project-button {
    width: 160px;
    max-width: 160px;

    display: inline-block;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: start;
  }

  .header-bar-item {
    height: calc(var(--common-toolbar-width) - (var(--common-spacing) * 2));
    padding: var(--common-spacing);
  }

  .header-bar-button {
    width: calc(var(--common-toolbar-width) - (var(--common-spacing) * 2));
    margin-left: var(--common-spacing);
  }
</style>
