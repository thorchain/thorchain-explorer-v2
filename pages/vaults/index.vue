<template>
  <Page>
    <cards-header :table-general-stats="vaultsGeneralStats" />
    <Card title="Vaults">
      <template v-if="loading">
        <tableLoader :cols="cols" />
      </template>
      <template v-else>
        <vue-good-table
          v-if="cols"
          :columns="cols"
          :rows="[...asgard]"
          style-class="vgt-table net-table"
        >
          <template slot="table-row" slot-scope="props">
            <span
              v-if="props.column.field == 'hash'"
              style="display: flex; gap: 5px; align-items: center"
            >
              <span
                v-tooltip="props.row.pubKey"
                class="mono clickable"
                @click="gotoAddr(props.row.hash)"
              >
                {{ addressFormatV2(props.row.pubKey) }}
              </span>
              <color-hash
                v-tooltip="
                  'Vault colors are identical to the nodes vault membership'
                "
                :name="props.row.pubKey"
              ></color-hash>
              <copy
                :str-copy="props.row.pubKey"
                size="small"
                style="margin-left: 0.1rem"
              ></copy>
            </span>
            <span v-else-if="props.column.field == 'bond'">
              <span
                v-if="props.row.bond"
                v-tooltip="curFormat(runePrice * props.row.bond)"
                class="mono hoverable"
              >
                <span class="extra">{{ runeCur() }}</span>
                {{ numberFormat(props.row.bond) }}
              </span>
              <span v-else> - </span>
            </span>
            <span v-else-if="props.column.field == 'total_value'">
              <span
                v-if="props.row.total_value"
                v-tooltip="curFormat(runePrice * props.row.total_value)"
                class="mono hoverable"
              >
                <span class="extra">{{ runeCur() }}</span>
                {{ numberFormat(props.row.total_value) }}
              </span>
              <span v-else> - </span>
            </span>
            <span v-else-if="props.column.field == 'membership_count'">
              <div>
                <v-tooltip>
                  <span
                    v-if="props.row.membership_count"
                    class="mono clickable"
                  >
                    {{ props.row.membership_count }}
                  </span>
                  <template slot="popper">
                    <div class="popper-card">
                      <div class="card-header">Node Members</div>
                      <div class="card-body grid-template">
                        <small
                          v-for="(node, i) in props.row.membership"
                          :key="i"
                          class="mono"
                        >
                          .{{ node.node_address.slice(-4) }}
                        </small>
                      </div>
                    </div>
                  </template>
                </v-tooltip>
                <span v-if="!props.row.membership_count"> - </span>
              </div>
            </span>
            <span v-else-if="props.column.field == 'since'">
              <span>{{ props.row.since | number('0,0') }}</span>
            </span>
            <span v-else-if="props.column.field == 'age'">
              <span>{{ duration(props.row.age) }}</span>
            </span>
            <span v-else-if="props.column.field == 'status'">
              <div
                :class="[
                  'mini-bubble big',
                  { yellow: props.row.status == 'Retiring' },
                ]"
              >
                <span>{{ props.row.status }}</span>
              </div>
            </span>
          </template>
        </vue-good-table>
      </template>
    </Card>
    <div class="footer-stat">
      <small>
        <sup>*</sup>
        Hover on the table elements to see more info!
      </small>
    </div>
  </Page>
</template>

<script>
import { duration } from 'moment'
import { props } from 'qrcode.vue'
import { mapGetters } from 'vuex'
import { runeCur } from '~/utils'

export default {
  data() {
    return {
      loading: true,
      cols: [
        {
          label: 'Hash',
          field: 'hash',
        },
        {
          label: 'Status',
          field: 'status',
        },
        {
          label: 'Height',
          field: 'height',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Bond',
          field: 'bond',
          type: 'number',
        },
        {
          label: 'Balance',
          field: 'total_value',
          type: 'number',
        },
        {
          label: 'Value/Bond',
          field: 'vb',
          type: 'percentage',
        },
        {
          label: 'Node Members',
          field: 'membership_count',
          type: 'number',
        },
        {
          label: 'Ins',
          field: 'ins',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Outs',
          field: 'outs',
          type: 'number',
          formatFn: this.numberFormat,
          tdClass: 'mono',
        },
        {
          label: 'Status Since',
          field: 'since',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'AVG TSS',
          field: 'avgTSS',
          type: 'number',
          formatFn: (v) =>
            `${this.$options.filters.number(v / 1e3, '0,0.00')} secs`,
          tdClass: 'mono',
        },
      ],
      vaultsGeneralStats: [
        {
          name: 'Bond',
        },
        {
          name: 'Balance',
        },
        {
          name: 'Balance/Bond',
        },
        {
          name: 'Ins/Outs',
        },
      ],
      yggdrasil: [],
      asgard: [],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
  },
  mounted() {
    this.fetchVaultsData()
  },
  methods: {
    fetchVaultsData() {
      this.$api
        .getAsgard()
        .then(async (res) => {
          const poolsPrice = await this.formatPoolPrice()
          const nodes = await this.formatNodes()
          const tss = await this.formatTSS()
          this.asgard = await this.formatVaults(
            res?.data,
            'Asgard',
            poolsPrice,
            nodes,
            tss
          )
          this.updateGeneralStats()
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
    duration(since) {
      return duration(since * 6, 's').humanize()
    },
    updateGeneralStats() {
      const asgard = this.asgard.filter((a) => a.status === 'Active')

      const totalBond = asgard?.reduce((total, o) => {
        return total + o.bond * this.runePrice
      }, 0)

      const totalValue = asgard?.reduce((total, o) => {
        return total + o.total_value * this.runePrice
      }, 0)

      const valuePerBond = totalValue / totalBond

      const totalIns = asgard?.reduce((total, o) => {
        return total + (o.ins ?? 0)
      }, 0)

      const totalOuts = asgard?.reduce((total, o) => {
        return total + (o.outs ?? 0)
      }, 0)

      this.vaultsGeneralStats = [
        {
          name: 'Bond',
          value: '$' + this.$options.filters.number(totalBond || 0, '0,0a'),
        },
        {
          name: 'Balance',
          value: '$' + this.$options.filters.number(totalValue || 0, '0,0a'),
        },
        {
          name: 'Balance/Bond',
          value: this.$options.filters.percent(valuePerBond),
        },
        {
          name: 'Ins / Outs',
          value: `${this.$options.filters.number(totalIns)} / ${this.$options.filters.number(totalOuts)}`,
        },
      ]
    },

    async formatTSS() {
      try {
        const res = await this.$api.getTSSMetrics()
        return res?.data?.keygen ?? '-'
      } catch (error) {
        console.warn("Can't get the TSS metrics")
      }
    },
    formatStatus(status) {
      if (status === 'ActiveVault') {
        return 'Active'
      } else if (status === 'RetiringVault') {
        return 'Retiring'
      }
      return status
    },
    async formatPoolPrice() {
      const pools = await this.$api.getPools()
      const poolsPrice = []
      pools.data.map((p) => (poolsPrice[p.asset] = p.assetPrice))
      return poolsPrice
    },
    async formatNodes() {
      const nodes = await this.$api.getNodes()
      const nodesFormat = []
      nodes.data.map((n) => (nodesFormat[n.pub_key_set?.secp256k1] = n))
      return nodesFormat
    },
    async formatVaults(
      data,
      type = 'Yggdrasil',
      poolsPrice = undefined,
      nodes = undefined,
      tss = undefined
    ) {
      const y = []
      for (const vault of data) {
        let bond = vault?.bond / 1e8
        let totalValue =
          +vault?.total_value < 100 ? 0.1 : vault?.total_value / 1e8
        let vb
        if (type === 'Asgard' && poolsPrice) {
          totalValue = 0
          vault.coins?.forEach((a) => {
            totalValue += (+(poolsPrice[a.asset] || 0) * +a.amount) / 1e8
          })
          bond = 0
          vault.membership?.forEach((m) => {
            bond += nodes[m].total_bond / 1e8
          })
          vb = totalValue / bond
        }
        let height = this.chainsHeight
        if (!this.chainsHeight) {
          height = (await this.$api.getChainsHeight()).data
        }
        let avgTSS
        if (tss) {
          const nodesTSS = tss
            .find((t) => t?.pub_key === vault?.pub_key)
            ?.node_tss_times.map((n) => n.tss_time)

          if (nodesTSS) {
            avgTSS = nodesTSS?.reduce((a, c) => a + c, 0) / nodesTSS?.length
          }
        }
        y.push({
          hash: vault?.addresses.find((e) => e.chain === 'THOR').address,
          type,
          status: this.formatStatus(vault?.status),
          ins: vault?.inbound_tx_count,
          bond,
          total_value: totalValue,
          membership_count: vault?.membership?.length,
          membership: vault?.membership?.map((v) => nodes[v]),
          vb,
          outs: vault?.outbound_tx_count,
          height: vault?.block_height,
          since: vault?.status_since,
          age: height?.THOR ? height?.THOR - vault?.block_height : 0,
          pubKey: vault?.pub_key,
          avgTSS,
        })
      }
      return y
    },
    runeCur() {
      return runeCur()
    },
    curFormat(number) {
      return this.$options.filters.currency(number)
    },
    numberFormat(number) {
      return this.$options.filters.number(number, '0,0')
    },
  },
  head: {
    title: 'THORChain Network Explorer | Vaults',
  },
}
</script>

<style>
.grid-template {
  display: grid;
  row-gap: 0.3rem;
  column-gap: 0.8rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
</style>
