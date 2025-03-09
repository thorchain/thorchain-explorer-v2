<template>
  <div class="overflow-auto">
    <b-pagination
      v-model="currentPage"
      :total-rows="limitedTotalRows"
      :per-page="perPage"
      first-number
      last-number
      class="custom-pagination"
      @change="onPageChange"
    ></b-pagination>
  </div>
</template>

<script>
export default {
  props: {
    totalRows: {
      type: Number,
      required: true,
    },
    perPage: {
      type: Number,
      default: 30,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
  },
  computed: {
    limitedTotalRows() {
      const maxPages = 200
      const maxRows = maxPages * this.perPage
      return Math.min(this.totalRows, maxRows)
    },
  },
  methods: {
    onPageChange(newPage) {
      this.$emit('change', newPage)
    },
  },
}
</script>

<style lang="scss">
.custom-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
  gap: 8px;

  .page-item {
    border-radius: 5px;
    .page-link {
      border-color: var(--border-color);
      border-radius: 5px;
    }

    &.active .page-link {
      color: var(--primary-color);
    }
  }
}
</style>
