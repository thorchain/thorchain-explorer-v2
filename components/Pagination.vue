<template>
  <div class="pagination-container">
    <div class="nav-icons" @click="$emit('changePage', 0)">
      <angleDoubleLeft />
    </div>
    <div class="nav-icons" @click="$emit('changePage', offset - limit)">
      <angleLeft />
    </div>
    <div class="page">
      Page {{ Number.parseInt(offset / limit) + 1 }} of {{ finalPage }}
    </div>
    <div class="nav-icons" @click="$emit('changePage', offset + limit)">
      <angleRight />
    </div>
    <div class="nav-icons" @click="$emit('changePage', finalOffset)">
      <angleDoubleRight />
    </div>
  </div>
</template>

<script>
import angleDoubleLeft from '@/assets/images/angle-double-left.svg?inline'
import angleLeft from '@/assets/images/angle-left.svg?inline'
import angleRight from '@/assets/images/angle-right.svg?inline'
import angleDoubleRight from '@/assets/images/angle-double-right.svg?inline'

export default {
  name: 'Pagination',
  components: {
    angleDoubleLeft,
    angleLeft,
    angleRight,
    angleDoubleRight,
  },
  props: ['offset', 'count', 'limit'],
  computed: {
    finalPage() {
      return Math.floor(Number.parseInt(this.count) / this.limit) + 1
    },
    finalOffset() {
      return Math.floor(Number.parseInt(this.count) / this.limit) * 10
    },
  },
}
</script>

<style lang="scss">
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 1rem;

  .nav-icons {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 0 0.5rem;
    padding: 0.3rem;
    border-radius: 0.2rem;

    svg {
      fill: var(--font-color);
      width: 1.2rem;
      height: 1.2rem;
    }

    &:hover {
      background-color: var(--bg-color);

      svg {
        fill: var(--sec-font-color);
      }
    }
  }

  .page {
    line-height: 1.8rem;
    margin: 0 0.7rem;
  }
}
</style>
