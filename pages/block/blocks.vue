<template>
  <page>
    <card title="Blocks" :is-loading="loading">
      <template v-if="blocks && blocks.length > 0">
        <vue-good-table
          :columns="cols"
          :rows="blocks"
          style-class="vgt-table net-table"
          :pagination-options="{
            enabled: true,
            perPage: 10,
            perPageDropdownEnabled: false,
          }"
        >
          <template slot="table-row" slot-scope="props">
            <span v-if="props.column.field === 'height'">
              <nuxt-link class="clickable" :to="`/block/${props.row.height}`">
                {{ props.formattedRow[props.column.field] | number('0,0') }}
              </nuxt-link>
            </span>
            <span v-else-if="props.column.field === 'date'">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span
              v-else-if="props.column.field === 'txs'"
              style="text-align: center"
            >
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span
              v-else-if="props.column.field === 'size'"
              style="text-align: center"
            >
              {{ props.formattedRow[props.column.field] | number('0,0') }}
            </span>
            <span v-else>
              {{ props.formattedRow[props.column.field] }}
            </span>
          </template>
        </vue-good-table>
      </template>
    </card>
  </page>
</template>
<script>
import moment from 'moment'

export default {
  name: 'Blocks',
  data() {
    return {
      blocks: [],
      blocksTime: [],
      cols: [
        {
          label: 'Block Height',
          field: 'height',
          type: 'text',
        },
        {
          label: 'Timestamp',
          field: 'date',
          type: 'text',
        },
        {
          label: 'Tx Size',
          field: 'txs',
          type: 'number',
        },
        {
          label: 'Block Size',
          field: 'size',
          type: 'number',
        },
      ],
      loading: false,
    }
  },
  mounted() {
    this.getActions()
  },
  methods: {
    formatTendermintBlocks(blocks) {
      return blocks.map((block) => ({
        height: block?.header?.height,
        date: moment(block?.header?.time).fromNow(),
        txs: block?.num_txs,
        size: block?.block_size,
        time: block?.header?.time,
      }))
    },
    getActions(params) {
      this.loading = true
      this.$api
        .getTendermintLatestBlocks(params)
        .then((res) => {
          const formattedBlocks = this.formatTendermintBlocks(
            res?.data?.result.block_metas
          )
          this.blocks = formattedBlocks
          this.loading = false
        })
        .catch((error) => {
          console.error(error)
          this.loading = false
        })
    },
  },
}
</script>

<style lang="scss" scoped></style>
