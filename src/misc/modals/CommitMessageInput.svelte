<script lang="ts">
  export let cancelHandler = () => null;
  export let commitHandler = (commitMessage: string) => commitMessage;

  let commitMessage = "";
</script>

<div>
  <label for="commit">Please enter a commit message for your changes:</label>
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
  label {
    display: block;
  }

  textarea {
    margin: var(--common-spacing) 0;
    padding: 10px;
    height: 96px;
    min-height: 96px;
    resize: vertical;

    font-family: monospace;
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
