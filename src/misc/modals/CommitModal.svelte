<script lang="ts">
  export let cancelHandler = () => null;
  export let commitHandler = (commitMessage: string) => commitMessage;

  let commitMessage = "";
</script>

<div>
  <p id="commit-modal-title">Please enter a commit message for your changes:</p>
  <textarea
    id="commit-message"
    name="commit-message"
    rows="5"
    cols="72"
    placeholder="..."
    bind:value="{commitMessage}"></textarea>
  <div id="response-container">
    <button class="response-button" on:click="{cancelHandler}">Cancel</button>
    <button
      class="response-button"
      disabled="{commitMessage === ''}"
      on:click="{() => commitHandler(commitMessage)}">Commit</button
    >
  </div>
</div>

<style>
  #commit-modal-title {
    display: block;
    font-weight: bold;
  }

  textarea {
    margin: var(--common-spacing) 0;
    padding: 10px;
    height: 96px;
    min-height: 96px;
    resize: vertical;

    font-family: monospace;
    font-size: larger;
    line-height: 1.2;

    border-radius: var(--common-radius);
    border: var(--common-border-width) solid var(--main-border-color);
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
