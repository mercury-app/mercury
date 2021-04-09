<script lang="ts">
  export let visible = false;

  const hiddenClass = "hidden";
  const visibleClass = "visible";
  $: {
    const notebookPanel = document.getElementById("notebook-panel");
    if (notebookPanel !== null) {
      if (visible) {
        notebookPanel.classList.remove(hiddenClass);
        notebookPanel.classList.add(visibleClass);
      } else {
        notebookPanel.classList.remove(visibleClass);
        notebookPanel.classList.add(hiddenClass);
      }
    }
  }

  const params = [
    "param_1",
    "param_2",
    "param_3",
    "param_4",
    "param_5",
    "param_6",
    "param_7",
    "param_8",
    "param_9",
    "param_10_is_very_very_long"
  ]
</script>

<div id="notebook-panel" class="{hiddenClass}">
  <button id="back-button" on:click="{() => (visible = false)}">
    <img src="/icons/chevron-left.svg" alt="Go back icon" class="icon" />
  </button>

  <iframe
    src="http://localhost:8888/notebooks/work/scripts/Untitled.ipynb"
    title="Jupyter notebook"
  >
  </iframe>

  <div id="input-panel">
    <button id="input-panel-switch">
      <img src="/icons/chevron-left.svg" alt="Hide panel" class="icon" />
      <img src="/icons/chevron-right.svg" alt="Show panel" class="icon" />
    </button>

    <div id="input-panel-content">
      <div id="input-title">
        <p class="input-text-item">Inputs</p>
      </div>
      <div id="input-param-list">
        {#each params as param}
          <div class="input-param">
            <div><p class="input-text-item">{param}</p></div>
            <button>
              <img src="/icons/x.svg" alt="delete parameter" class="icon" />
            </button>
          </div>
        {/each}
      </div>
    </div>

    <div id="input-panel-divider"></div>
  </div>
</div>

<style>
  #notebook-panel {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    background-color: #eee;
    transition: all 0.5s ease-in-out;
  }

  #back-button {
    position: absolute;
    top: 6px;
    left: 6px;
    width: var(--default-button-width);
    height: var(--default-button-height);
  }

  #notebook-panel iframe {
    width: 100%;
    height: 100%;
    border: 0;
  }

  #notebook-panel.hidden {
    transform: translateY(100%);
  }

  #notebook-panel.visible {
    transform: translateY(0%);
  }

  #input-panel {
    display: flex;
    flex-direction: row;

    position: absolute;
    top: 30%;
    width: 20%;
    height: 40%;
    padding: 0 8px;

    background-color: #fff;

    border: 1px solid var(--main-border-color);
    border-top-right-radius: var(--common-radius);
    border-bottom-right-radius: var(--common-radius);
    border-left: 0;
  }

  #input-panel-content {
    display: flex;
    flex-direction: column;

    height: 100%;
    width: calc(100% - (var(--default-button-width) / 2) - 8px);
  }

  #input-title {
    display: flex;
    align-items: center;
    min-height: var(--default-button-height);

    margin: 8px 0;

    font-size: 0.8em;
    font-weight: bold;
  }

  #input-param-list {
    flex: auto;
    width: 100%;
    margin: 0;
    padding: 0;
    overflow: auto;

    border: 1px solid var(--main-border-color);
  }

  #input-param-list .input-param {
    display: flex;
    align-items: center;
    padding: 4px;
  }

  #input-param-list .input-param:hover {
    background-color: #f4f4f4;
  }

  #input-param-list .input-param div {
    display: flex;
    align-items: center;
    flex: auto;
    overflow: hidden;
  }

  #input-param-list .input-param button {
    min-width: calc(var(--default-button-width) / 1.5);
    min-height: calc(var(--default-button-height) / 1.5);
    margin-left: 4px;

    background-color: #fff0;
    border: 0;
  }

  #input-param-list .input-param button:hover {
    border: 1px solid var(--main-border-color);
  }

  #input-param-list .input-param button:not(:disabled):active {
    background-color: #ddd;
  }

  #input-param-list .input-text-item {
    margin: 0;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    font-size: 0.8em;
  }

  #input-panel-divider {
    height: 100%;
    width: 1px;

    margin: 0 8px;

    border-left: 1px solid var(--main-border-color);
  }

  #input-panel-switch {
    position: absolute;
    right: calc(-1 * var(--default-button-width) / 2);

    width: var(--default-button-width);
    height: var(--default-button-height);

    margin: 8px 0;
  }

  #input-panel-switch img {
    width: 16px;
    height: 16px;
  }

  #input-panel-switch img:first-child {
    margin-right: -3px;
  }

  #input-panel-switch img:last-child {
    margin-left: -3px;
  }
</style>
