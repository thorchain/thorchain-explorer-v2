<template>
  <div>
    <vue-good-table
      :columns="cols"
      :rows="limitedRows"
      style-class="vgt-table net-table"
    >
      <template slot="table-row" slot-scope="props">
        <div>
          <skeleton-loader :style="{ width: '80px', height: '8px' }" />
        </div>
      </template>
    </vue-good-table>
  </div>
</template>

<script>
export default {
  name: 'TableLoader',
  props: {
    cols: {
      type: Array,
      required: true,
    },
  },
  computed: {
    limitedRows() {
      return [
        {
          id: 1,
        },
        {
          id: 2,
        },
      ]
    },
  },
}
</script>

<style lang="scss"></style>
