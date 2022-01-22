<script lang="ts">
  export let messageTitle = "";
  export let messageDetail = "";
  export let rejectButtonText = "";
  export let acceptButtonText = "Ok";
  export let rejectHandler = () => null;
  export let acceptHandler = () => null;
</script>

<div>
  <p id="message-title">{messageTitle}</p>
  {#if messageDetail}
    <p id="message-detail">{messageDetail}</p>
  {/if}
  <div id="response-container">
    {#if rejectButtonText}
      <button class="response-button" on:click="{rejectHandler}"
        >{rejectButtonText}</button
      >
    {/if}
    {#if acceptButtonText}
      <button class="response-button" on:click="{acceptHandler}"
        >{acceptButtonText}</button
      >
    {/if}
  </div>
</div>

<style>
  #message-title {
    font-weight: bold;
  }

  #message-detail {
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
