<script lang="ts">
  import WorkflowCanvas from "./WorkflowCanvas.svelte";
</script>

<main>
  <WorkflowCanvas />
</main>

<style>
  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
