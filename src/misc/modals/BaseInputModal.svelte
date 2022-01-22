<script lang="ts">
  export let inputTitle = "";
  export let inputDetail = "";
  export let rejectButtonText = "";
  export let acceptButtonText = "Ok";
  export let rejectHandler = () => null;
  export let acceptHandler = (_value: unknown) => null;
  export let inputIsValid = true;
  export let inputInvalidMessage = "";
</script>

<div>
  <p id="input-title">{inputTitle}</p>
  {#if inputDetail}
    <p id="input-detail">{inputDetail}</p>
  {/if}
  <slot>
    <input />
  </slot>
  <div id="controls-container">
    <div id="controls-filler">
      <p hidden="{inputIsValid}" id="input-invalid-message">
        {inputInvalidMessage}
      </p>
    </div>
    {#if rejectButtonText}
      <button class="response-button" on:click="{rejectHandler}"
        >{rejectButtonText}</button
      >
    {/if}
    <button
      class="response-button"
      disabled="{!inputIsValid}"
      on:click="{acceptHandler}">{acceptButtonText}</button
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

  #controls-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  #controls-filler {
    flex: auto;
    max-height: var(--default-button-height);
    margin: 0 calc(var(--common-spacing) * 3) 0 0;
  }

  #input-invalid-message {
    margin: 0;
    word-wrap: break-word;
    color: red;
    font-size: 0.9em;
  }

  .response-button {
    margin-left: var(--common-spacing);
    min-width: calc(var(--default-button-width) * 2);
    min-height: var(--default-button-height);
  }
</style>
