<script lang="ts">
  import axios from "axios";
  import { onMount, getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import CommitModal from "./modals/CommitModal.svelte";
  import MessageModal from "./modals/MessageModal.svelte";

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

  const isProjectOnLatestCommit = async (
    projectId: string
  ): Promise<boolean> => {
    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      const projectAttributes = response.data.data.attributes;
      return (
        projectAttributes.current_commit === projectAttributes.latest_commit
      );
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return false;
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

  const commitChanges = async (projectId: string): Promise<void> => {
    const openCommitMessageModal = () => {
      open(
        CommitModal,
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
          closeOnOuterClick: false,
          styleWindow: {
            "max-width": "max-content",
            "border-radius": "3px",
          },
          transitionBg: fade,
          transitionWindow: scale,
        }
      );
    };

    if (await isProjectOnLatestCommit(projectId)) {
      openCommitMessageModal();
    } else {
      open(
        MessageModal,
        {
          messageTitle: "Attempting commit on an older version",
          messageDetail:
            "You are about to add a commit on top of a base commit that is " +
            "not the latest for this project. All changes added from the " +
            "base to the current latest will be lost once you add this " +
            "commit. Do you still want to continue?",
          rejectButtonText: "No",
          acceptButtonText: "Yes",
          rejectHandler: () => {
            close();
          },
          acceptHandler: () => {
            close();
            openCommitMessageModal();
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
    }
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
