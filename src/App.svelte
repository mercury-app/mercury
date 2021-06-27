<script lang="ts">
  import Router from "svelte-spa-router";

  import NotFound from "./misc/NotFound.svelte";
  import ProjectsInterface from "./workspace/ProjectsInterface.svelte";
  import WorkflowBuilder from "./workflow/WorkflowBuilder.svelte";
  import VersionControlInterface from "./workspace/VersionControlInterface.svelte";

  const routes = {
    "/": ProjectsInterface,
    "/projects": ProjectsInterface,
    "/projects/:project_id/workflow_builder": WorkflowBuilder,
    "/projects/:project_id/version_control": VersionControlInterface,

    // Catch any other paths
    "*": NotFound,
  };
</script>

<main>
  <Router routes="{routes}" />
</main>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
      height: 100%;
    }
  }
</style>
