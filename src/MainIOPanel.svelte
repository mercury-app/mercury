<script lang="ts">
  export let title = "";
  export let newEntryPlaceholder = "";

  let params = [];
  let newParam = "";

  const addParam = () => {
    if (newParam !== "") {
      params = [...params, newParam];
      newParam = "";
    }
  };

  const removeParam = (param: string) => {
    params = params.filter((item) => item !== param);
  };
</script>

<div id="io-panel-content">
  <div id="io-title">
    <p class="io-text-item">{title}</p>
  </div>

  <div id="io-param-list">
    {#each params as param}
      <div class="io-param">
        <div><p class="io-text-item">{param}</p></div>
        <button on:click="{() => removeParam(param)}">
          <img src="/icons/x.svg" alt="delete parameter" class="icon" />
        </button>
      </div>
    {/each}
  </div>

  <div id="io-new-param-container">
    <input
      id="io-new-param-entry"
      type="text"
      placeholder="{newEntryPlaceholder}"
      bind:value="{newParam}"
      on:keydown="{(event) => {
        if (event.key === 'Enter') addParam();
      }}"
    />
    <button id="io-new-param-button" on:click="{addParam}">
      <img src="/icons/plus.svg" alt="add parameter" class="icon" />
    </button>
  </div>
</div>

<style>
  #io-panel-content {
    display: flex;
    flex-direction: column;

    max-height: 100%;
    width: calc(
      100% - (var(--default-button-width) / 2) - (var(--common-spacing) * 3)
    );
    padding: var(--common-spacing);

    background-color: #fafafa;
  }

  #io-title {
    display: flex;
    align-items: center;
    height: var(--default-button-height);

    font-size: 0.8em;
    font-weight: bold;
  }

  #io-param-list {
    flex: auto;
    width: calc(100% - 2px);
    margin: 0;
    padding: 0;
    overflow: auto;

    margin: var(--common-spacing) 0;

    border: 1px solid var(--main-border-color);
    border-radius: var(--common-radius);

    background-color: #fff;
  }

  #io-param-list .io-param {
    display: flex;
    align-items: center;
    padding: 4px;
  }

  #io-param-list .io-param:hover {
    background-color: #f4f4f4;
  }

  #io-param-list .io-param div {
    display: flex;
    align-items: center;
    flex: auto;
    overflow: hidden;
  }

  #io-param-list .io-param button {
    min-width: calc(var(--default-button-width) / 1.5);
    min-height: calc(var(--default-button-height) / 1.5);
    margin-left: 4px;

    background-color: #fff0;
    border: 0;
  }

  #io-param-list .io-param button:hover {
    border: 1px solid var(--main-border-color);
  }

  #io-param-list .io-param button:not(:disabled):active {
    background-color: #ddd;
  }

  #io-param-list .io-text-item {
    margin: 0;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    font-size: 0.8em;
  }

  #io-new-param-container {
    display: flex;
    flex-direction: row;

    width: 100%;
  }

  #io-new-param-container #io-new-param-entry {
    width: calc(100% - var(--default-button-width));
    margin: 0;

    border-right: 0;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;

    font-size: 0.8em;
  }

  #io-new-param-container #io-new-param-button {
    min-width: var(--default-button-width);
    min-height: var(--default-button-height);

    margin: 0;

    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    font-size: 0.8em;
  }
</style>
