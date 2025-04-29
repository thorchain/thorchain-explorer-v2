<template>
  <div
    v-show="tableGeneralStats && tableGeneralStats.length > 0"
    class="header-class"
  >
    <div
      v-for="(stat, i) in tableGeneralStats"
      :key="i"
      class="table-stat-card"
    >
      <div class="name">
        {{ stat.name }}
        <unknown-icon
          v-if="stat.description"
          v-tooltip="stat.description"
          :class="['header-icon', { link: stat.link }]"
          @click="stat.link && $router.push(stat.link)"
        />
      </div>
      <div v-if="stat.change" class="stat-change">
        <progress-icon
          :data-number="stat.change"
          :is-down="stat.isDown"
          size="1rem"
        />
      </div>
      <skeleton-item :loading="!stat.value" class="value">
        {{ stat.value }}
        <small>{{ stat.extraText }}</small>
      </skeleton-item>
    </div>
  </div>
</template>

<script>
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  components: {
    UnknownIcon,
  },
  props: {
    tableGeneralStats: {
      type: Array,
      required: true,
    },
    showChange: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>
.header-class {
  display: grid;
  gap: 15px;
  margin-bottom: $space-16;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;
  margin: $space-16 $space-10;

  @include lg {
    margin: $space-16 $space-0;
  }

  .table-stat-card {
    padding: $space-32 $space-0;
    border-radius: $radius-lg;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    gap: 0.2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .value {
      color: var(--sec-font-color);
      font-size: $font-size-xl;
      text-align: center;
      min-width: 80%;
      margin-bottom: $space-8;
      font-weight: 500;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      small {
        font-size: $font-size-s;
        color: var(--font-color);
        margin-left: $space-5;
      }
    }

    .name {
      color: var(--font-color);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;

      .header-icon {
        fill: var(--font-color);
        margin-left: $space-10;
        height: 0.9rem;
        width: 0.9rem;

        &.link {
          cursor: pointer;
          fill: var(--primary-color);
        }
      }
    }

    .stat-change {
      display: flex;
      justify-content: center;
      margin: $space-4 0;
    }
  }
}
</style>
