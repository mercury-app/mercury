<script lang="ts">
  import axios from "axios";
  import { push } from "svelte-spa-router";

  const newProjectHandler = async () => {
    const url: string = "http://localhost:3000/v1/workspace/projects";
    try {
      const response = await axios.post(
        url,
        {
          data: {
            type: "projects",
            attributes: {
              name: "Titled",
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
        push(`/${projectId}/workflow_builder`);
      }
    } catch (exception) {
      console.log(`error received from POST ${url}: ${exception}`);
    }
  };
</script>

<div>
  <button on:click="{newProjectHandler}">New project</button>
</div>
