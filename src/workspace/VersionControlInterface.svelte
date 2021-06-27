<script lang="ts">
  import axios from "axios";
  import { onMount } from "svelte";

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

  let commits = [];
  onMount(async () => {
    commits = await fetchAllCommits(params.project_id);
  });
</script>

<div id="commit-list-container">
  <div id="commit-list">
    {#each commits as commit}
      <div class="commit-list-item">
        <div class="commit-list-item-message">{commit.attributes.message}</div>
        <div class="commit-list-item-sha">{commit.id.slice(0, 7)}</div>
        <div>
          <button>
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

  .commit-list-item-message {
    flex: auto;
  }
</style>
