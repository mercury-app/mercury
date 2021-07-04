<script lang="ts">
  export let inputTitle = "";
  export let inputDetail = "";
  export let rejectButtonText = "";
  export let acceptButtonText = "Ok";
  export let rejectHandler = () => null;
  export let acceptHandler = (_value: unknown) => null;
</script>

<div>
  <p id="input-title">{inputTitle}</p>
  {#if inputDetail}
    <p id="input-detail">{inputDetail}</p>
  {/if}
  <slot>
    <input />
  </slot>
  <div id="response-container">
    {#if rejectButtonText}
      <button class="response-button" on:click="{rejectHandler}"
        >{rejectButtonText}</button
      >
    {/if}
    <button class="response-button" on:click="{acceptHandler}"
      >{acceptButtonText}</button
    >
  </div>
</div>

<style>
  #input-title {
    font-weight: bold;
  }

  #input-detail {
    font-size: 0.9em;
  }

  #response-container {
    display: flex;
    flex-direction: row;
    justify-content: end;
  }

  .response-button {
    margin-left: var(--common-spacing);
    min-width: calc(var(--default-button-width) * 2);
    min-height: var(--default-button-height);
  }
</style>
