<script lang="ts">
  import BaseInputModal from "./BaseInputModal.svelte";

  export let inputTitle = "";
  export let inputDetail = "";
  export let rejectButtonText = "";
  export let acceptButtonText = "";
  export let rejectHandler = () => null;
  export let acceptHandler = (_value: string) => null;
  export let validationHandler = (
    _value: unknown
  ): { isValid: boolean; validationMessage: string } => {
    return { isValid: true, validationMessage: "" };
  };

  let value = "";

  const init = (element: HTMLElement) => {
    element.focus();
  };
</script>

<BaseInputModal
  inputTitle="{inputTitle}"
  inputDetail="{inputDetail}"
  rejectButtonText="{rejectButtonText}"
  acceptButtonText="{acceptButtonText}"
  rejectHandler="{rejectHandler}"
  acceptHandler="{() => acceptHandler(value)}"
  inputIsValid="{validationHandler(value).isValid}"
  inputInvalidMessage="{validationHandler(value).validationMessage}"
>
  <input
    bind:value
    use:init
    on:keydown="{(event) => {
      if (event.key === 'Enter') acceptHandler(value);
    }}"
    class:invalid-input="{validationHandler(value).validationMessage !== ''}"
    id="text-input"
  />
</BaseInputModal>

<style>
  #text-input {
    margin: var(--common-spacing) 0;
    width: 100%;
    min-width: 420px;
  }

  .invalid-input:focus {
    outline: none;
    outline: 2px solid red;
  }
</style>
