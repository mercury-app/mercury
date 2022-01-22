<script lang="ts">
  import axios from "axios";
  import { onMount, getContext } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { push } from "svelte-spa-router";
  import CommitModal from "./modals/CommitModal.svelte";
  import MessageModal from "./modals/MessageModal.svelte";
  import ButtonGroup from "./reusable/ButtonGroup.svelte";
  import TextInputModal from "../misc/modals/TextInputModal.svelte";

  export let projectId = "";
  let projectName = "Untitled";

  const { open, close } = getContext("simple-modal");

  const openProjectsInterface = async () => {
    push(`/projects`);
  };

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

  const hasProjectUncommittedChanges = async (
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
      return projectAttributes.has_uncommitted_changes;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return false;
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

    if (!(await hasProjectUncommittedChanges(projectId))) {
      open(
        MessageModal,
        {
          messageTitle: "No changes to commit",
          acceptHandler: () => {
            close();
          },
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
    } else if (await isProjectOnLatestCommit(projectId)) {
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

  const renameProject = async (projectId: string) => {
    const _renameProject = async (name: string) => {
      const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
      try {
        await axios.patch(
          url,
          {
            data: {
              type: "nodes",
              id: projectId,
              attributes: {
                name: name,
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
      TextInputModal,
      {
        inputTitle: "Please enter a new name for the project",
        rejectButtonText: "Cancel",
        acceptButtonText: "Rename",
        rejectHandler: () => {
          close();
        },
        acceptHandler: async (newProjectName: string) => {
          close();
          _renameProject(newProjectName);
          projectName = newProjectName;
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

  const vcsButtonAttributes = [
    {
      icon: "/icons/history.svg",
      alt: "Show version control history icon",
      handler: () => openVersionControlInterface(projectId),
    },
    {
      icon: "/icons/git-commit.svg",
      alt: "Commit changes to project icon",
      handler: () => commitChanges(projectId),
    },
  ];

  onMount(async () => (projectName = await fetchProjectName(projectId)));
</script>

<div id="header-bar-container">
  <div id="header-bar">
    <button
      id="header-bar-back-button"
      class="header-bar-item header-bar-button"
      on:click="{openProjectsInterface}"
    >
      <img
        src="/icons/chevron-left.svg"
        alt="Go back to projects icon"
        class="icon"
      />
    </button>
    <div id="header-bar-project-name-container" class="header-bar-item">
      <p>
        {projectName}
      </p>
      <button on:click="{() => renameProject(projectId)}">
        <img
          src="/icons/pencil.svg"
          alt="Edit project name icon"
          class="icon"
        />
      </button>
    </div>
    <div class="header-bar-item">
      <ButtonGroup buttonAttributes="{vcsButtonAttributes}" let:attributes>
        <img src="{attributes.icon}" alt="{attributes.alt}" class="icon" />
      </ButtonGroup>
    </div>
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
  }

  .header-bar-item {
    height: calc(var(--common-toolbar-width) - (var(--common-spacing) * 2));
    margin-left: var(--common-spacing);
  }

  .header-bar-button {
    width: calc(var(--common-toolbar-width) - (var(--common-spacing) * 2));
  }

  #header-bar-project-name-container {
    position: relative;

    display: flex;
    align-items: center;

    width: 200px;
    max-width: 200px;

    border: var(--common-border-width) solid rgba(1, 1, 1, 0);
    border-radius: var(--common-radius);
  }

  #header-bar-project-name-container p {
    padding: var(--common-spacing);

    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    font-weight: bolder;
  }

  #header-bar-project-name-container button {
    position: absolute;
    right: var(--common-spacing);

    width: calc(var(--common-toolbar-width) - (var(--common-spacing) * 4));
    height: calc(var(--common-toolbar-width) - (var(--common-spacing) * 4));

    box-shadow: -6px 0 12px white;

    visibility: hidden;
  }

  #header-bar-project-name-container:hover {
    border: var(--common-border-width) solid var(--main-border-color);
  }

  #header-bar-project-name-container:hover button {
    visibility: visible;
  }
</style>
