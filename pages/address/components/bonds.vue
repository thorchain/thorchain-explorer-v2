<template>
  <vue-good-table :columns="cols" :rows="bs" style-class="vgt-table net-table">
    <template slot="table-row" slot-scope="props">
      <div v-if="props.column.field == 'node'">
        <nuxt-link class="clickable" :to="`/node/${props.row.node}`">
          {{ props.formattedRow[props.column.field] }}
        </nuxt-link>
      </div>
      <span v-else-if="props.column.field == 'bond'">
        {{ props.formattedRow[props.column.field] }}
        ({{ props.row.share | percent(2) }})
      </span>
      <nuxt-link
        v-else-if="props.column.field == 'operator'"
        class="clickable"
        :to="`/address/${props.row.operator}`"
      >
        {{ props.formattedRow[props.column.field] }}
      </nuxt-link>
      <span v-else>
        {{ props.formattedRow[props.column.field] }}
      </span>
    </template>
  </vue-good-table>
</template>

<script>
export default {
  props: ['nodes', 'address'],
  data() {
    return {
      bs: [],
      cols: [
        {
          label: 'Node',
          field: 'node',
          type: 'text',
          formatFn: this.formatAddress,
        },
        {
          label: 'Bonded',
          field: 'bond',
          tdClass: 'mono',
          type: 'number',
          formatFn: this.numberFormat,
        },
        {
          label: 'Fee',
          field: 'fee',
          tdClass: 'mono',
          type: 'percentage',
        },
        {
          label: 'Node Operator',
          field: 'operator',
          type: 'text',
          formatFn: this.formatAddress,
        },
      ],
    }
  },
  watch: {
    nodes() {
      this.bs = this.formatBonds()
    },
  },
  mounted() {
    this.bs = this.formatBonds()
  },
  methods: {
    formatBonds() {
      if (!this.nodes) {
        return []
      }
      const ret = []
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i]
        if (!node?.bond_providers?.providers) {
          continue
        }
        const bond = node?.bond_providers?.providers?.find(
          (n) => n.bond_address === this.address
        )
        if (bond !== undefined) {
          ret.push({
            node: node.node_address,
            bond: +bond.bond / 1e8,
            fee: +node?.bond_providers?.node_operator_fee / 10000,
            operator: node?.node_operator_address,
            share: +bond.bond / +node.total_bond,
          })
        }
      }
      return ret
    },
  },
}
</script>

<style lang="scss" scoped>
.table-hr {
  border: 1px solid var(--border-color);
  margin: $space-3 $space-0;
}
</style>
