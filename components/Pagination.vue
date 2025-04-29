<template>
  <div class="pagination-container">
    <div class="nav-icons" @click="$emit('prevPage')">
      <angle-left />
      Newer
    </div>
    <div v-if="meta" class="nav-icons mono">
      <template v-if="!loading && timeFrame">
        {{ timeFrame.from }}
        -
        {{ timeFrame.next }}
      </template>
      <span v-else>...</span>
    </div>
    <div class="nav-icons" @click="$emit('nextPage')">
      Older
      <angle-right />
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import angleLeft from '@/assets/images/angle-left.svg?inline'
import angleRight from '@/assets/images/angle-right.svg?inline'

export default {
  name: 'Pagination',
  components: {
    angleLeft,
    angleRight,
  },
  props: {
    meta: {
      type: Array,
      required: false,
      default: undefined,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    timeFrame() {
      if (!this.meta || this.meta.length <= 1) {
        return
      }

      const firstAction = this.meta[0]
      const lastAction = this.meta[this.meta.length - 1]

      const from = moment(firstAction?.date / 1e6).format('MM/DD/YYYY hh:mm:ss')
      const next = moment(lastAction?.date / 1e6).format('MM/DD/YYYY hh:mm:ss')

      return {
        from,
        next,
      }
    },
  },
}
</script>

<style lang="scss">
.pagination-container {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: $space-8;
  border-radius: $radius-lg;

  .divider {
    margin: $space-0 $space-5;
    height: 30px;
    width: 1px;
    background-color: var(--border-color);
  }

  .nav-icons {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: $space-0 $space-5;
    padding: $space-10 $space-8;
    border-radius: $radius-sm;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    font-size: $font-size-xs;
    font-weight: 500;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;

    svg {
      fill: var(--font-color);
      width: 0.75rem;
      height: 0.75rem;
      margin: 0 $space-4;
    }

    &:hover {
      background-color: var(--active-bg-color);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      color: var(--sec-font-color);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
    }
  }

  .page {
    color: var(--font-color);
    line-height: 2rem;
    margin: $space-0 1rem;
    font-size: $font-size-sm;
    font-weight: 500;
  }
}
</style>
