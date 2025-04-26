<template>
  <div class="header-wrapper">
    <h1>{{ title }}</h1>
  </div>
</template>
<script>
export default {
  props: ['title'],
}
</script>
<style lang="scss">
.header-wrapper {
  display: flex;
  padding: 1rem 0;
  margin: 0 8px;
  padding-top: 0;
  align-items: center;
  justify-content: space-between;

  h1 {
    font-family: 'Exo 2';
    color: var(--sec-font-color);
    font-size: 1.17rem;
    margin: 0 10px;

  @include lg {
    margin: 0px;
  }
  }
}
</style>
