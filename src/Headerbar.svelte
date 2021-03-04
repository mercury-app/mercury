<script lang="ts">
  export let headerbarHeight: number;
</script>

<div id="headerbar" style="height: {headerbarHeight}px">
  <button>Add nodebook</button>
</div>

<style>
  #headerbar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1;
    background-color: lightgray;
  }
</style>
