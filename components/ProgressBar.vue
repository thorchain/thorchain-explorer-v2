<template>
  <div class="progress-wrapper">
    <div class="progress-bar" :style="{'width': width + '%', backgroundColor: color}" />
    <span v-if="extraText" class="progress-text">{{ extraText }}</span>
  </div>
</template>

<script>
export default {
  props: ['width', 'extraText', 'color']
}
</script>

<style lang="scss">
.progress-wrapper {
  height: 10px;
  border-radius: 5px;
  width: 100%;
  background-color: var(--border-color);

  .progress-bar {
    height: 10px;
    border-radius: 5px;
    width: 1%;
    background-color: var(--primary-color);

    transition: width 700ms;
  }

  .progress-text {
    display: flex;
    justify-content: center;
    color: var(--sec-font-color);
    margin-top: 10px;
    font-size: .875rem;
  }
}
</style>
