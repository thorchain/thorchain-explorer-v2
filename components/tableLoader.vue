<template>
    <div>
      <vue-good-table :columns="cols" :rows="limitedRows" style-class="vgt-table net-table">
        <template slot="table-column" slot-scope="props">
        </template>
        <template slot="table-row" slot-scope="props">
          <div>
            <skeleton-loader :style="{ width: '150px', height: '10px' }" />
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
      rows: {
        type: Array,
        required: true,
      },
    },
    computed: {
      limitedRows() {
        return this.rows.slice(0, 10);
      }
    }
  }
  </script>
  
  <style lang="scss">
</style>
  