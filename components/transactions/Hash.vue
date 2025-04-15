<template>
  <div>
    <template v-if="param">
      <nuxt-link
        class="transaction-hash clickable mono"
        :to="{
          path: `/tx/${param}`,
        }"
      >
        {{ addressFormatV2(param) }}
      </nuxt-link>
      <copy :str-copy="param"></copy>
    </template>
    <span v-else>-</span>
  </div>
</template>

<script>
export default {
  props: ['param'],
}
</script>

<style lang="scss" scoped>
.transaction-hash {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
