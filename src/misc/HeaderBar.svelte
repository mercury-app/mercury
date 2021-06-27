<script lang="ts">
  import axios from "axios";
  import { onMount, getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import CommitMessageInput from "./modals/CommitMessageInput.svelte";

  export let projectId = "";
  let projectName = "Untitled";

  const { open, close } = getContext("simple-modal");

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

  const sendCommitRequest = async (
    projectId: string,
    commitMessage: string
  ): Promise<void> => {
    const url = `http://localhost:3000/v1/workspace/projects/${projectId}/commits`;
    try {
      await axios.post(
        url,
        {
          data: {
            type: "commits",
            attributes: {
              message: commitMessage,
            },
          },
        },
        {
          headers: {
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
        }
      );
    } catch (exception) {
      console.log(`error received from POST ${url}: ${exception}`);
    }
  };

  const openVersionControlInterface = async (projectId: string) => {
    push(`/projects/${projectId}/version_control`);
  };

  const commitChanges = (projectId: string): void => {
    open(
      CommitMessageInput,
      {
        cancelHandler: () => {
          close();
        },
        commitHandler: (commitMessage: string) => {
          sendCommitRequest(projectId, commitMessage);
          close();
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
    );
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
      on:click="{() => commitChanges(projectId)}"
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
