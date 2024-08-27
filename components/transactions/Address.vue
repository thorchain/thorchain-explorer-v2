<template>
  <div>
    <template v-if="param">
      <component
        :is="disable ? 'span' : 'nuxt-link'"
        :class="['mono', { clickable: !disable }]"
        :to="{
          path: `/address/${param}`,
        }"
      >
        {{ addressFormatV2(param) }}
      </component>
      <copy v-if="!disable" :str-copy="param"></copy>
    </template>
    <span v-else>-</span>
  </div>
</template>

<script>
export default {
  props: ['param', 'disable'],
}
</script>

<style lang="scss" scoped></style>
