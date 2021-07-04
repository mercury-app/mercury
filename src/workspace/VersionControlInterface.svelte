<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { push } from "svelte-spa-router";

  export let params = {
    project_id: "",
  };

  const fetchAllCommits = async (
    projectId: string
  ): Promise<Array<Record<string, unknown>>> => {
    let commits = [];

    const url = `http://localhost:3000/v1/workspace/projects/${projectId}/commits`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      commits = response.data.data;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return commits;
  };

  const getCurrentRef = async (projectId: string): Promise<string> => {
    let currentCommitRef = "";

    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/vnd.api+json",
        },
      });
      currentCommitRef = response.data.data.attributes.current_commit;
    } catch (exception) {
      console.log(`error received from GET ${url}: ${exception}`);
    }

    return currentCommitRef;
  };

  const checkoutRef = async (
    projectId: string,
    ref: string
  ): Promise<string> => {
    let checkedOutRef = await getCurrentRef(projectId);

    const url = `http://localhost:3000/v1/workspace/projects/${projectId}`;
    try {
      const response = await axios.patch(
        url,
        {
          data: {
            type: "nodes",
            id: projectId,
            attributes: {
              current_commit: ref,
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
      checkedOutRef = response.data.data.attributes.current_commit;
      push(`/projects/${projectId}/workflow_builder`);
    } catch (exception) {
      console.log(`error received from PATCH ${url}: ${exception}`);
    }

    return checkedOutRef;
  };

  const dateString = (timestamp: number): string => {
    const then = new Date(timestamp * 1000);
    const month = then.toLocaleString("default", {
      month: "short",
    });

    const today = new Date();
    if (then.getFullYear() === today.getFullYear()) {
      return `${month} ${then.getDate()}`;
    } else {
      return `${month} ${then.getDate()}, ${then.getFullYear()}`;
    }
  };

  let commits = [];
  let currentCommitRef = "";
  onMount(async () => {
    commits = await fetchAllCommits(params.project_id);
    currentCommitRef = await getCurrentRef(params.project_id);
  });
</script>

<div id="commit-list-container">
  <div>
    <h1>Commit history</h1>
  </div>
  <div id="commit-list">
    {#each commits as commit}
      <div
        class="commit-list-item"
        class:highlighted="{commit.id === currentCommitRef}"
      >
        <div class="commit-list-item-message-container">
          <p class="commit-list-item-message">{commit.attributes.message}</p>
          <p class="commit-list-item-subtext">
            <strong>{commit.attributes.author_name}</strong> committed on
            {dateString(commit.attributes.timestamp)}
          </p>
        </div>
        <div class="commit-list-item-sha">{commit.id.slice(0, 7)}</div>
        <button
          class="commit-checkout-button"
          on:click="{async () => {
            currentCommitRef = await checkoutRef(params.project_id, commit.id);
          }}"
        >
          <img
            src="/icons/arrow-right.svg"
            alt="Switch to this commit in history"
            class="icon"
          />
        </button>
      </div>
      <div class="horizontal-separator"></div>
    {/each}
  </div>
</div>

<style>
  #commit-list-container {
    height: 100%;
    margin: 0 20%;
    display: flex;
    flex-direction: column;
  }

  #commit-list {
    width: 100%;
    overflow: auto;
    margin: 0 0 10% 0;

    border: var(--common-border-width) solid var(--main-border-color);
    border-radius: var(--common-radius);
  }

  /* This hides the last vertical separator */
  #commit-list div:last-of-type {
    display: none;
  }

  .commit-list-item {
    display: flex;
    flex-direction: row;
    align-items: center;

    position: relative;
    height: calc(var(--default-button-height) + (var(--common-spacing) * 4));
  }

  .commit-list-item.highlighted {
    background-color: #f4f4f4;
  }

  .commit-list-item.highlighted .commit-checkout-button {
    visibility: hidden;
  }

  .commit-list-item-message-container {
    display: flex;
    flex-direction: column;

    flex: auto;
    padding: var(--common-spacing) calc(var(--common-spacing) * 2);
    border: none;
    justify-content: left;
  }

  .commit-list-item-message {
    color: #4a4a4a;
    font-weight: bolder;
    line-height: 0.1em;
    margin-top: 4px;
    margin-bottom: 10px;
  }

  .commit-list-item-subtext {
    color: gray;
    font-size: 0.8em;
    line-height: 0.1em;
    margin-top: 10px;
    margin-bottom: 4px;
  }

  .commit-checkout-button {
    position: absolute;
    width: var(--default-button-width);
    height: var(--default-button-height);
    top: calc((100% - var(--default-button-height)) / 2);
    right: calc(var(--common-spacing) * 2);
  }

  .horizontal-separator {
    border-bottom: var(--common-border-width) solid var(--main-border-color);
  }
</style>
