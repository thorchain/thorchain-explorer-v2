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
        <div class="metric-values">
          <b class="metric-value" :title="metric.tooltip">
            <template v-if="metric.valueSlot">
              <slot :name="metric.valueSlot" :metric="metric" />
            </template>
            <template v-else>
              <span v-if="metric.filter && metric.value !== undefined">
                {{ metric.filter(metric.value) }}
              </span>
              <span v-else>
                {{ metric.value || '-' }}
              </span>
            </template>
            <slot :name="`metric-icon-${idx}`"></slot>
          </b>
          <div v-if="metric.subValue" class="metric-sub-value">
            {{ metric.subValue }}
          </div>
        </div>
      </div>
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

    .metric-label {
      font-size: $font-size-sm;
      margin: 0;
    }

    .metric-values {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 5px;

      @include lg {
        align-items: center;
      }
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

    .metric-sub-value {
      font-size: $font-size-s;
      color: var(--font-color);
      margin-top: 2px;
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
</style>
