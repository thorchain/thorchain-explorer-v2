<template>
  <card class="stats-panel">
    <div class="stats-summary">
      <div
        v-for="(metric, idx) in metrics"
        :key="metric.label"
        class="metric-item"
        :class="{ 'with-separator': idx > 0 }"
      >
        <h6 class="metric-label">{{ metric.label }}</h6>
        <b class="metric-value">
          <span v-if="metric.format">
            {{ metric.format(metric.value) }}
          </span>
          <span v-else>
            {{ metric.value || '-' }}
          </span>
        </b>
      </div>
    </div>

    <div v-if="displayExtraSection" class="extra-section">
      <h3 class="extra-title">{{ extraTitle }}</h3>
      <slot name="extraStats"></slot>
    </div>
  </card>
</template>

<script>
export default {
  name: 'StatsPanel',
  props: {
    metrics: {
      type: Array,
      required: true,
      validator: (items) => {
        return items.every(
          (item) => item.hasOwnProperty('label') && item.hasOwnProperty('value')
        )
      },
    },
    extraStats: {
      type: Boolean,
      default: false,
    },
    extraTitle: {
      type: String,
      default: 'Distributions',
    },
  },
}
</script>

<style lang="scss" scoped>
.stats-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: column;

  @include lg {
    flex-direction: row;
  }

  .metric-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $space-8 0;
    width: 100%;
    gap: $space-5;

    @include lg {
      flex: 1;
      justify-content: center;
      padding: $space-8 $space-24;
      flex-direction: column;
      width: initial;
    }

    &:first-of-type {
      padding-left: 0;
    }

    .metric-label {
      font-size: $font-size-sm;
      margin: 0;
    }

    .metric-value {
      display: flex;
      align-items: center;
      gap: $space-4;
      font-size: $font-size-sm;
      color: var(--sec-font-color);

      @include lg {
        font-size: $font-size-md;
      }
    }

    &.with-separator {
      border-top: 1px solid var(--border-color);

      @include lg {
        border-top: none;
        border-left: 1px solid var(--border-color);
      }
    }
  }
}

.extra-section {
  padding: $space-16;
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  margin-top: $space-16;

  .extra-title {
    font-size: $font-size-md;
    margin: 0 0 $space-8 0;
    color: var(--sec-font-color);
  }
}
</style>
