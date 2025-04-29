<template>
  <div :class="['page-container', { fluid: fluid }]">
    <slot v-if="!error" />
    <Card v-else>
      <div class="page-error-container">
        <img src="@/assets/images/error.png" alt="error image" />
        <h3>Can't fetch the data, please try again later.</h3>
      </div>
    </Card>
  </div>
</template>

<script>
export default {
  props: ['error', 'fluid'],
}
</script>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  max-width: 90rem;
  margin: auto;

  &.fluid {
    max-width: 100rem;
  }
}

.page-error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: $space-16;

  img {
    width: 150px;
    margin-bottom: $space-16;
  }
}
</style>
