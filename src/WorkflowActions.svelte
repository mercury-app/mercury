<script lang="ts">
  const buttonWidth = 36;
  const buttonHeight = 36;
  const buttonWidthStyle = `width: ${buttonWidth}px;`;
  const buttonHeightStyle = `height: ${buttonHeight}px;`;
  const buttonStyle = buttonWidthStyle + buttonHeightStyle;

  const numButtons = 3;
  const workflowActionsWidthStyle = `width: ${buttonWidth * numButtons}px;`;
  const workflowActionsHeightStyle = `height: ${buttonHeight}px;`;
  const workflowActionsStyle =
    workflowActionsWidthStyle + workflowActionsHeightStyle;
</script>

<div id="workflow-actions" style="{workflowActionsStyle}">
  <button style="{buttonStyle}"></button>
  <div class="vertical-separator"></div>
  <button style="{buttonStyle}"></button>
  <div class="vertical-separator"></div>
  <button style="{buttonStyle}"></button>
</div>

<style>
  #workflow-actions {
    display: flex;
    flex-direction: row;

    border: 1px solid var(--main-border-color);
    border-radius: var(--common-radius);
  }

  #workflow-actions button {
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;

    border: 0;
    border-radius: 0;
  }

  #workflow-actions button:first-of-type {
    border-top-left-radius: var(--common-radius);
    border-bottom-left-radius: var(--common-radius);
  }

  #workflow-actions button:last-of-type {
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
  }

  .vertical-separator {
    border-right: 1px solid var(--main-border-color);
  }
</style>
