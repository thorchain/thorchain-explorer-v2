<template>
  <div class="overflow-auto">
    <b-pagination
      v-model="currentPage"
      :total-rows="totalRows"
      :per-page="perPage"
      first-number
      last-number
      @change="onPageChange"
      class="custom-pagination"
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
  methods: {
    onPageChange(newPage) {
      this.$emit('change', newPage)
    },
  },
}
</script>

<style scoped>
.custom-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.5rem;
}

.custom-pagination >>> .page-item.active .page-link {
  color: white;
  background-color: var(--green);
  border-color: var(--border-color);
}

.custom-pagination >>> .page-link {
  color: var(--green);
  margin: 0 5px;
  border-radius: 5px;
}

.custom-pagination >>> .page-link:hover {
  color: white;
  background-color: var(--green);
  border-color: var(--border-color);
}
.custom-pagination >>> .page-item.disabled .page-link {
  color: #6c757d;
}
</style>
