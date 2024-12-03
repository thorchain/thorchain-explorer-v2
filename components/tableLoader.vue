<template>
  <div>
    <vue-good-table
      :columns="cols"
      :rows="limitedRows"
      style-class="vgt-table net-table"
    >
      <template slot="table-row" slot-scope="props">
        <div
          :class="[
            {
              'right-align':
                props.column.type === 'number' ||
                props.column.type === 'percentage',
            },
          ]"
        >
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
      const range = 10
      const rows = []
      for (let i = 0; i < range; i++) {
        rows.push({
          id: i,
        })
      }
      return rows
    },
  },
}
</script>

<style lang="scss" scoped>
.right-align {
  display: flex;
  justify-content: end;
}
</style>
