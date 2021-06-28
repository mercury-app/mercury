<script lang="ts">
  export let messageTitle = "Message title";
  export let messageDetail = "Message details";
  export let rejectButtonText = "Cancel";
  export let acceptButtonText = "Ok";
  export let rejectHandler = () => null;
  export let acceptHandler = () => null;
</script>

<div>
  <p id="message-title">{messageTitle}</p>
  <p id="message-detail">{messageDetail}</p>
  <div id="response-container">
    <button class="response-button" on:click="{rejectHandler}"
      >{rejectButtonText}</button
    >
    <button class="response-button" on:click="{acceptHandler}"
      >{acceptButtonText}</button
    >
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
