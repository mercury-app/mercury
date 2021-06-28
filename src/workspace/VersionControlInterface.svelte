<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";
  import { set_attributes } from "svelte/internal";

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
    } catch (exception) {
      console.log(`error received from PATCH ${url}: ${exception}`);
    }

    return checkedOutRef;
  };

  let commits = [];
  let currentCommitRef = "";
  onMount(async () => {
    commits = await fetchAllCommits(params.project_id);
    currentCommitRef = await getCurrentRef(params.project_id);
  });
</script>

<div id="commit-list-container">
  <div id="commit-list">
    {#each commits as commit}
      <div
        class="commit-list-item"
        class:highlighted="{commit.id === currentCommitRef}"
      >
        <div class="commit-list-item-message">{commit.attributes.message}</div>
        <div class="commit-list-item-sha">{commit.id.slice(0, 7)}</div>
        <div>
          <button
            on:click="{async () => {
              currentCommitRef = await checkoutRef(
                params.project_id,
                commit.id
              );
            }}"
          >
            <img
              src="/icons/arrow-right.svg"
              alt="Switch to this commit in history"
              class="icon"
            />
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  #commit-list-container {
    position: relative;
    height: 100%;
    margin: 0 10%;
  }

  #commit-list {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);

    width: 100%;
    max-height: 80%;
    overflow: auto;
  }

  .commit-list-item {
    display: flex;
    flex-direction: row;
  }

  .commit-list-item.highlighted {
    background-color: antiquewhite;
  }

  .commit-list-item-message {
    flex: auto;
  }
</style>
