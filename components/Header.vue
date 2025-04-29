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
  padding: $space-16 $space-0;
  margin: $space-0 $space-8;
  padding-top: $space-0;
  align-items: center;
  justify-content: space-between;

  h1 {
    font-family: 'Exo 2';
    color: var(--sec-font-color);
    font-size: $font-size-md;
    margin: $space-0 $space-10;

    @include lg {
      margin: $space-0;
    }
  }
}
</style>
