<template>
  <Card>
    <div>
      <TableLoader v-if="loading" :cols="columns" :rows="Array(5).fill({})" />
      <template v-else>
        <div v-if="thornames.length > 0">
          <vue-good-table
            :columns="columns"
            :rows="thornames"
            style-class="vgt-table net-table"
            :line-numbers="true"
            :sort-options="{
              enabled: true,
              initialSortBy: { field: 'name', type: 'asc' },
            }"
          >
            <template slot="table-row" slot-scope="props">
              <span v-if="props.column.field === 'name'">
                {{ props.row.name }}
              </span>
              <span v-else-if="props.column.field === 'owner'">
                <Address :address="props.row.owner" />
              </span>
              <span v-else-if="props.column.field === 'affiliate_collector'">
                {{ formatRune(props.row.affiliate_collector_rune) }}
              </span>
              <span v-else-if="props.column.field === 'preferred_asset'">
                {{ props.row.preferred_asset || '-' }}
              </span>
              <span v-else-if="props.column.field === 'expire_block_height'">
                <nuxt-link
                  class="clickable"
                  :to="`/block/${props.row.expire_block_height}`"
                >
                  {{
                    $options.filters.number(
                      props.row.expire_block_height,
                      '0,0'
                    )
                  }}
                </nuxt-link>
              </span>
              <span v-else-if="props.column.field === 'aliases'">
                <template
                  v-if="props.row.aliases && props.row.aliases.length > 0"
                >
                  <template v-for="al in props.row.aliases">
                    <div :key="`asset-` + al.chain" class="mini-bubble">
                      <asset-icon
                        :asset="baseChainAsset(al.chain)"
                        :height="'1.2rem'"
                      />
                      <Address :address="al.address" />
                    </div>
                  </template>
                </template>
                <span v-else class="mini-bubble yellow"> No Aliases </span>
              </span>
            </template>
          </vue-good-table>
        </div>
        <span v-else> NO THORName </span>
      </template>
    </div>
  </Card>
</template>

<script>
import Address from '~/components/transactions/Address.vue'

export default {
  components: {
    Address,
  },
  props: ['address'],
  data() {
    return {
      loading: true,
      thornames: [],
      columns: [
        {
          label: 'Name',
          field: 'name',
          sortable: true,
        },
        {
          label: 'Owner',
          field: 'owner',
          sortable: true,
        },
        {
          label: 'Affiliate Collector',
          field: 'affiliate_collector',
          sortable: true,
        },
        {
          label: 'Preferred Asset',
          field: 'preferred_asset',
          sortable: true,
        },
        {
          label: 'Expire Block',
          field: 'expire_block_height',
          sortable: true,
          type: 'number',
        },
        {
          label: 'Aliases',
          field: 'aliases',
          sortable: false,
        },
      ],
    }
  },
  mounted() {
    this.rlookThorname(this.address)
  },
  methods: {
    checkThornameAddresses(names) {
      if (!names) {
        return
      }

      const promises = []
      names.forEach((n) => {
        const p = this.$api.getThorname(n).then((res) => {
          this.thornames.push({
            name: res.data?.name,
            owner: res.data?.owner,
            affiliate_collector_rune: res.data?.affiliate_collector_rune,
            preferred_asset: res.data?.preferred_asset,
            expire_block_height: res.data?.expire_block_height,
            aliases: res.data?.aliases,
          })
        })
        promises.push(p)
      })

      Promise.allSettled(promises).then((res) => {
        this.loading = false
      })
    },
    rlookThorname(address) {
      this.$api
        .getRevThorname(address)
        .then((res) => {
          const names = res?.data
          this.checkThornameAddresses(names)
        })
        .catch((e) => {
          this.loading = false
          console.error(e)
        })
    },
  },
}
</script>

<style lang="scss" scoped></style>
