<template>
  <div class="toggle-container">
    <input id="switch" type="checkbox" :checked="checked" />
    <label for="switch">Toggle</label>
  </div>
</template>

<script>
export default {
  props: ['checked'],
}
</script>

<style lang="scss">
.toggle-container {
  display: flex;

  input[type='checkbox'] {
    height: 0;
    width: 0;
    visibility: hidden;
  }

  label {
    pointer-events: none;
    cursor: pointer;
    text-indent: -9999px;
    width: 40px;
    height: 24px;
    background: grey;
    display: block;
    border-radius: 20px;
    position: relative;
  }

  label:after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: $radius-full;
    transition: 0.3s;
  }

  input:checked + label {
    background: var(--primary-color);
  }

  input:checked + label:after {
    left: calc(100% - 2px);
    transform: translateX(-100%);
  }

  label:active:after {
    width: 20px;
  }
}
</style>
