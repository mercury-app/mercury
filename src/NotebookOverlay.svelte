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
      <div id="input-title">Inputs</div>
      <div id="input-param-list">
        <div class="input-param">
          <div>param_1</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_2</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_3</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_4</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_5</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_6</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_7</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_8</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_9</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
        <div class="input-param">
          <div>param_10</div>
          <button>
            <img src="/icons/x.svg" alt="delete parameter" class="icon" />
          </button>
        </div>
      </div>
    </div>
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
    position: absolute;
    top: 30%;
    width: 25%;
    height: 40%;
    padding: 8px;

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
  }

  #input-title {
    display: flex;
    align-items: center;
    min-height: var(--default-button-height);
  }

  #input-param-list {
    flex: auto;
    width: 100%;
    margin: 8px 0;
    padding: 0;
    overflow: auto;

    border: 1px solid var(--main-border-color);
  }

  #input-param-list .input-param {
    display: flex;
    align-items: center;
    padding: 4px;
  }

  #input-param-list .input-param div {
    display: flex;
    align-items: center;
    flex: auto;
  }

  #input-param-list .input-param button {
    width: calc(var(--default-button-width) / 2);
    height: calc(var(--default-button-height) / 2);
    border: 0;
  }

  #input-panel-switch {
    position: absolute;
    right: calc(-1 * var(--default-button-width) / 2);
    width: var(--default-button-width);
    height: var(--default-button-height);
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
