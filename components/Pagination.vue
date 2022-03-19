<template>
  <div class="pagination-container">
    <div class="nav-icons" @click="$emit('changePage', 0)">
      <angleDoubleLeft></angleDoubleLeft>
    </div>
    <div class="nav-icons" @click="$emit('changePage', offset-limit)">
      <angleLeft></angleLeft>
    </div>
    <div class="page">
      Page {{ Number.parseInt(offset/limit)+1 }} of {{ finalPage }}
    </div>
    <div class="nav-icons" @click="$emit('changePage', offset+limit)">
      <angleRight></angleRight>
    </div>
    <div class="nav-icons" @click="$emit('changePage', finalOffset)">
      <angleDoubleRight></angleDoubleRight>
    </div>
  </div>
</template>

<script>
import angleDoubleLeft from '@/assets/images/angle-double-left.svg?inline';
import angleLeft from '@/assets/images/angle-left.svg?inline';
import angleRight from '@/assets/images/angle-right.svg?inline';
import angleDoubleRight from '@/assets/images/angle-double-right.svg?inline';

export default {
  name: 'Pagination',
  props: ['offset', 'count', 'limit'],
  components: {
    angleDoubleLeft,
    angleLeft,
    angleRight,
    angleDoubleRight
  },
  computed: {
    finalPage: function() {
      return Math.floor(Number.parseInt(this.count)/this.limit)+1
    },
    finalOffset: function() {
      return Math.floor(Number.parseInt(this.count)/this.limit)*10
    }
  }
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
    margin: 0 .5rem;
    padding: .3rem;
    border-radius: .2rem;

    svg {
      fill: #9F9F9F;
      width: 1.2rem;
      height: 1.2rem;
    }

    &:hover {
        background-color: #191C1E;

      svg {
        fill: #e6e6e6;
      }
    }
  }
  
  .page {
    line-height: 1.8rem;
    margin: 0 .7rem;
  }
}
</style>