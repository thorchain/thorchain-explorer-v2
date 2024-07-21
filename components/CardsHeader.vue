<template>
  <div v-show="tableGeneralStats && tableGeneralStats.length > 0" class="header-class">
    <div v-for="(stat, i) in tableGeneralStats" :key="i" class="table-stat-card">
      <div class="name">
        {{ stat.name }}
        <unknown-icon v-if="stat.description" v-tooltip="stat.description" class="header-icon" />
      </div>
      <div v-if="showChange && stat.change" class="stat-change">
        <progress-icon :data-number="stat.change" :is-down="stat.isDown" size="1rem" />
      </div>
      <skeleton-item :loading="!stat.value" class="value">
        {{ stat.value }}
      </skeleton-item>
    </div>
  </div>
</template>

<script>
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  components: {
    UnknownIcon
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
  }
};
</script>

<style lang="scss">
.header-class {
  display: grid;
  gap: 15px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  grid-template-rows: auto;

  .table-stat-card {
    padding: 2rem 0;
    border-radius: 8px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .value {
      color: var(--sec-font-color);
      font-size: 1.5rem;
      text-align: center;
      min-width: 80%;
      margin-bottom: 8px;
    }

    .name {
      color: var(--font-color);
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;

      .header-icon {
        fill: var(--font-color);
        margin-left: 10px;
        height: 0.9rem;
        width: 0.9rem;
      }
    }

    .stat-change {
      display: flex;
      justify-content: center;
      margin: 0.2rem 0;
    }
  }
}
</style>