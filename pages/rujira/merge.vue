<template>
  <Page>
    <StatsPanel :metrics="statsMetrics" />
    <Card
      title="RUJIRA Merge"
      :img-src="require('@/assets/images/ruji-merge.svg')"
    >
      <TableLoader v-if="loading" :cols="cols" />
      <vue-good-table
        v-else
        :columns="cols"
        :rows="rows"
        style-class="vgt-table net-table"
        :sort-options="{
          enabled: true,
        }"
      >
        <template slot="table-column" slot-scope="props">
          <span>
            {{ props.column.label }}
          </span>
        </template>
        <template slot="table-row" slot-scope="props">
          <div
            v-if="props.column.field == 'Asset'"
            v-tooltip="props.row.asset"
            class="cell-content"
          >
            <AssetIcon :asset="props.row.Asset" />
            <span>{{ props.formattedRow[props.column.field] }}</span>
          </div>
          <div v-else-if="props.column.field == 'Amount'">
            {{ props.formattedRow[props.column.field] }}
            / {{ props.row.maxSupply | number('0,0.00a') }}
            <small>
              {{ showAsset(props.row.Asset, true) }}
            </small>
          </div>
          <div
            v-else-if="
              props.column.field == 'Allocation' ||
              props.column.field === 'AllocationMerged'
            "
          >
            {{ props.formattedRow[props.column.field] }}
            <small>RUJI</small>
          </div>
          <div v-else-if="props.column.field == 'contract'">
            <nuxt-link
              class="button-container"
              :to="`/address/${getContractAddress(props.row.Asset)}`"
            >
              Transactions
            </nuxt-link>
          </div>
          <span v-else>
            <span v-if="props.row[props.column.field]">
              {{ props.formattedRow[props.column.field] }}
            </span>
            <span v-else>-</span>
          </span>
        </template>
      </vue-good-table>
    </Card>
    <div>
      <Card style="margin-bottom: 1rem">
        <span>
          Holders of
          <b style="color: var(--sec-font-color)"
            >KUJI, rKUJI, FUZN, NSTK, WINK, and LVN</b
          >
          tokens are able to migrate and convert these tokens into RUJI on
          Rujira, the THORChain app layer.
        </span>
        <br />
        <br />
        <div class="button-more">
          <a
            class="button-container"
            href="https://rujira.network/merge/KUJI"
            target="_blank"
          >
            More Info
          </a>
        </div>
      </Card>
    </div>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { formatAsset } from '~/utils'

export default {
  data() {
    return {
      cols: [
        {
          label: 'Asset',
          field: 'Asset',
          formatFn: formatAsset,
        },
        {
          label: 'Merged',
          field: 'Amount',
          type: 'number',
          formatFn: this.baseAmountFormat,
          tdClass: 'mono',
        },
        {
          label: '% Merged',
          field: 'MergedPct',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Allocation',
          field: 'Allocation',
          type: 'number',
          formatFn: (n) => this.$options.filters.number(n, '0,0.00a'),
          tdClass: 'mono',
        },
        {
          label: 'Allocation Merged',
          field: 'Shares',
          type: 'number',
          formatFn: (n) => this.$options.filters.number(n / 1e8, '0,0.00a'),
          tdClass: 'mono',
        },
        {
          label: 'Tx Count',
          field: 'Count',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Wallet Count',
          field: 'Addresses',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Contract',
          field: 'contract',
          thClass: 'center',
          tdClass: 'center',
          hide: process.env.NODE_ENV !== 'mainnet',
        },
      ],
      rows: [],
      error: false,
      loading: true,
    }
  },
  head: {
    title: 'THORChain Network Explorer | Ruji Merge',
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    mergedRUJI() {
      if (!this.rows) {
        return 0
      }

      return this.rows.reduce((acc, item) => {
        acc += item.AllocationMerged
        return acc
      }, 0)
    },
    totalWallets() {
      if (!this.rows) {
        return 0
      }

      return this.rows.reduce((acc, item) => {
        acc += item.Addresses
        return acc
      }, 0)
    },
    totalAllocation() {
      if (!this.rows) {
        return 0
      }

      return this.rows.reduce((acc, item) => {
        acc += item.Allocation
        return acc
      }, 0)
    },
    totalTxs() {
      if (!this.rows) {
        return 0
      }

      return this.rows.reduce((acc, item) => {
        acc += item.Count
        return acc
      }, 0)
    },
    statsMetrics() {
      const formatMerge = (val) => {
        let formatted = this.$options.filters.number(val, '0,0.00a')
        if (this.totalAllocation > 0) {
          formatted += ` / ${this.$options.filters.number(this.totalAllocation, '0,0.00a')} RUJI - ${this.$options.filters.percent(val / this.totalAllocation, 2)}`
        }
        return formatted
      }

      return [
        {
          label: 'RUJI Merged',
          value: this.mergedRUJI,
          filter: (val) => formatMerge(val),
        },
        {
          label: 'Switch Txs',
          value: this.totalTxs,
          filter: (v) => this.$options.filters.number(v, '0,0'),
        },
        {
          label: 'Wallet Count',
          value: this.totalWallets,
          filter: (v) => this.$options.filters.number(v, '0,0'),
        },
      ]
    },
  },
  async mounted() {
    try {
      const mergeData = (await this.$api.getInfraRUJIMerge()).data.filter(
        (a) => !a.Asset.includes('RUNE')
      )
      mergeData.map((item) => {
        item.Asset = item.Asset.toUpperCase()
        item.Asset = item.Asset.replace('THOR.', 'GAIA.')
        switch (item.Asset) {
          case 'GAIA.KUJI':
            item.maxSupply = 112349807
            item.Allocation = 41_840_000
            break
          case 'GAIA.WINK':
            item.maxSupply = 69000000
            item.Allocation = 1_430_000
            break
          case 'GAIA.RKUJI':
            item.maxSupply = 10000000
            item.Allocation = 3_720_000
            break
          case 'GAIA.FUZN':
            item.maxSupply = 171740000
            item.Allocation = 1_560_000
            break
          case 'GAIA.LVN':
            item.maxSupply = 695260000
            item.Allocation = 5_000_000
            break
          case 'GAIA.NSTK':
            item.maxSupply = 65000000
            item.Allocation = 1_440_000
            break
          default:
            break
        }
        item.MergedPct = item.Amount / 1e8 / item.maxSupply
        item.AllocationMerged = item.MergedPct * item.Allocation
        return item
      })
      this.rows = mergeData
    } catch (e) {
      this.error = true
      console.error(e)
    } finally {
      this.loading = false
    }
  },
  methods: {
    getContractAddress(asset) {
      switch (asset) {
        case 'GAIA.KUJI':
          return 'thor14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s3p2nzy'
        case 'GAIA.WINK':
          return 'thor1yw4xvtc43me9scqfr2jr2gzvcxd3a9y4eq7gaukreugw2yd2f8tsz3392y'
        case 'GAIA.RKUJI':
          return 'thor1yyca08xqdgvjz0psg56z67ejh9xms6l436u8y58m82npdqqhmmtqrsjrgh'
        case 'GAIA.FUZN':
          return 'thor1suhgf5svhu4usrurvxzlgn54ksxmn8gljarjtxqnapv8kjnp4nrsw5xx2d'
        case 'GAIA.LVN':
          return 'thor1ltd0maxmte3xf4zshta9j5djrq9cl692ctsp9u5q0p9wss0f5lms7us4yf'
        case 'GAIA.NSTK':
          return 'thor1cnuw3f076wgdyahssdkd0g3nr96ckq8cwa2mh029fn5mgf2fmcmsmam5ck'
        default:
          return ''
      }
    },
  },
}
</script>

<style lang="scss" scoped>
th.end .table-asset {
  justify-content: flex-end;
}

.button-more {
  display: flex;
  gap: 8px;
}
</style>
