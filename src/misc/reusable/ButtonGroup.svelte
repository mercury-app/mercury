<script lang="ts">
  export let buttonAttributes = [];
</script>

<div id="button-group">
  {#each buttonAttributes as attributes}
    <button on:click="{attributes.handler}">
      <slot attributes="{attributes}" />
    </button>
    <div class="vertical-separator"></div>
  {/each}
</div>

<style>
  #button-group {
    height: calc(var(--default-button-height) - 1px);

    display: flex;
    flex-direction: row;

    border: var(--common-border-width) solid var(--main-border-color);
    border-radius: var(--common-radius);
  }

  #button-group button {
    min-width: var(--default-button-width);
    border: 0;
    border-radius: 0;
  }

  #button-group button:first-of-type {
    border-top-left-radius: var(--common-radius);
    border-bottom-left-radius: var(--common-radius);
  }

  #button-group button:last-of-type {
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
  }

  .vertical-separator {
    border-right: var(--common-border-width) solid var(--main-border-color);
  }

  #button-group div:last-of-type {
    display: none;
  }
</style>
