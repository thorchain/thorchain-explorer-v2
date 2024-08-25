<template>
  <div class="pagination-container">
    <div class="nav-icons" @click="$emit('changePage', offset - limit)">
      <angle-left />
      Prev Page
    </div>
    <div class="nav-icons" @click="$emit('changePage', offset + limit)">
      Next Page
      <angle-right />
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
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;

  .nav-icons {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin: 0 0.3rem;
    padding: 10px 8px;
    border-radius: 0.25rem;
    background-color: var(--card-bg-color);
    color: var(--font-color);
    font-size: 0.75rem;
    font-weight: 500;
    transition:
      background-color 0.3s ease,
      transform 0.2s ease;

    svg {
      fill: var(--font-color);
      width: 0.75rem;
      height: 0.75rem;
      margin: 0 0.2rem;
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
    margin: 0 1rem;
    font-size: 0.875rem;
    font-weight: 500;
  }
}
</style>
