<template>
  <Page :error="error && !loading" :fluid="true">
    <div class="grid-network">
      <info-card :options="topBonds" />
    </div>
    <card :is-loading="!activeNodes">
      <node-table :rows="activeNodes" :cols="activeCols" name="active-nodes" />
    </card>
    <card :is-loading="!stbNodes">
      <node-table :rows="stbNodes" :cols="activeCols" name="rdy-nodes" />
    </card>
    <card :is-loading="!whiteListedNodes">
      <node-table
        :rows="whiteListedNodes"
        :cols="otherNodes"
        name="other-nodes"
      />
    </card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { orderBy } from 'lodash'
import NodeTable from './component/nodeTable.vue'
import { fillNodeData, availableChains } from '~/utils'

export default {
  name: 'NodesPage',
  components: {
    NodeTable,
  },
  data() {
    return {
      loading: true,
      mode: 'active',
      statusMode: 'node-stat',
      nodesQuery: undefined,
      popoverText: 'Test',
      nodesExtra: undefined,
      minBond: 30000000000000,
      newNodesChurn: 2,
      lastBlockHeight: undefined,
      churnInterval: undefined,
      churnOption: undefined,
      bondMetrics: undefined,
      mimirs: undefined,
      provDist: undefined,
      intervalId: undefined,
      churnHalted: undefined,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      chainsHeight: 'getChainsHeight',
    }),
    error() {
      return !this.nodesQuery
    },
    activeCols() {
      if (!this.nodesQuery) {
        return this.cols
      }

      const chains = availableChains(
        this.nodesQuery?.filter((n) => n.status === 'Active')
      )
        ?.sort()
        .map((c) => ({
          label: c,
          field: `behind.${c}`,
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center no-padding',
        }))

      return [
        {
          label: 'Highlight',
          field: 'highlight',
          tdClass: 'center',
          thClass: 'center no-padding',
        },
        {
          label: 'Address',
          field: 'address',
          formatFn: this.addressFormatV2,
          tdClass: 'mono',
        },
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.aSort,
        },
        {
          label: 'ISP',
          field: 'isp',
          type: 'text',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Location',
          field: 'location',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.cSort,
        },
        {
          label: 'Status',
          field: 'status',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Version',
          field: 'version',
          type: 'text',
          tdClass: 'center',
          sortFn: this.versionSort,
        },
        {
          label: 'Fee',
          field: 'fee',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Providers',
          field: 'providers',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center',
          sortFn: this.pSort,
        },
        {
          label: 'Award',
          field: 'award',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono',
        },
        {
          label: 'Bond',
          field: 'total_bond',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono',
        },
        {
          label: 'Slash',
          field: 'slash',
          type: 'number',
          formatFn: this.normalFormat,
          tdClass: 'mono',
        },
        {
          label: 'Score',
          field: 'score',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'APY',
          field: 'apy',
          type: 'percentage',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'Leave',
          field: 'leave',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Churn',
          field: 'churn',
          thClass: 'center no-padding',
        },
        ...chains,
      ]
    },
    otherNodes() {
      if (!this.nodesQuery) {
        return this.cols
      }

      return [
        {
          label: 'Address',
          field: 'address',
          formatFn: this.addressFormatV2,
          tdClass: 'mono',
        },
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.aSort,
        },
        {
          label: 'Status',
          field: 'status',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'ISP',
          field: 'isp',
          type: 'text',
          tdClass: 'center',
        },
        {
          label: 'Location',
          field: 'location',
          tdClass: 'center',
          sortFn: this.cSort,
        },
        {
          label: 'Version',
          field: 'version',
          type: 'text',
          tdClass: 'center',
          sortFn: this.versionSort,
        },
        {
          label: 'Fee',
          field: 'fee',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Providers',
          field: 'providers',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center',
          sortFn: this.pSort,
        },
      ]
    },
    topBonds() {
      return [
        {
          title: 'Active Bonds',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Total Node Count',
              value: this.bondMetrics?.activeNodeCount,
            },
            {
              name: 'Total Bond',
              value: this.bondMetrics?.bondMetrics?.totalActiveBond / 10 ** 8,
              usdValue: true,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Average Bond',
              value: this.bondMetrics?.bondMetrics?.averageActiveBond / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Maximum Bond',
              value: Math.floor(
                Math.floor(
                  (Number.parseInt(
                    this.bondMetrics?.bondMetrics?.maximumActiveBond
                  ) ?? 0) /
                    10 ** 8
                )
              ),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Median Bond',
              value: Math.floor(
                (Number.parseInt(
                  this.bondMetrics?.bondMetrics?.medianActiveBond
                ) ?? 0) /
                  10 ** 8
              ),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Minimum Bond',
              value: Math.floor(
                (Number.parseInt(
                  this.bondMetrics?.bondMetrics?.minimumActiveBond
                ) ?? 0) /
                  10 ** 8
              ),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Max efficient bond',
              value: this.calculateHardCap(),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
          ],
        },
        {
          title: 'Standby Bonds',
          rowStart: 1,
          colSpan: 1,
          items: [
            {
              name: 'Total Node Count',
              value: this.bondMetrics?.standbyNodeCount,
            },
            {
              name: 'Total Bond',
              value: this.bondMetrics?.bondMetrics?.totalStandbyBond / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Average Bond',
              value:
                this.bondMetrics?.bondMetrics?.averageStandbyBond / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Maximum Bond',
              value: Math.floor(
                (Number.parseInt(
                  this.bondMetrics?.bondMetrics?.maximumStandbyBond
                ) ?? 0) /
                  10 ** 8
              ),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Median Bond',
              value: this.calMedianBond(),
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
            {
              name: 'Minimum Bond',
              value:
                this.bondMetrics?.bondMetrics?.minimumStandbyBond / 10 ** 8,
              filter: (v) =>
                `${this.runeCur()} ${this.$options.filters.number(v, '0,0')}`,
              usdValue: true,
            },
          ],
        },
      ]
    },
    activeNodes() {
      if (this.nodesQuery) {
        if (!this.nodesQuery) {
          return
        }
        const actNodes = this.nodesQuery.filter((e) => e.status === 'Active')
        const filteredNodes = []

        // bond, slash, oldest
        let lowestBond = null
        let highestSlash = 0
        let oldest = 0
        for (let i = 0; i < actNodes.length; i++) {
          const el = actNodes[i]
          if (+el.slash_points > highestSlash) {
            highestSlash = +el.slash_points
          }

          if (el.age.number > oldest) {
            oldest = el.age.number
          }

          if (!lowestBond || lowestBond > +el.total_bond) {
            lowestBond = +el.total_bond
          }
        }

        actNodes.forEach((el, index) => {
          fillNodeData(filteredNodes, el)
          // add churn data
          if (+el.total_bond === lowestBond) {
            filteredNodes[index].churn = {
              name: 'Lowest Bond',
              icon: require('@/assets/images/cheap.svg?inline'),
            }
          }

          if (el.age.number === oldest) {
            filteredNodes[index].churn = {
              name: 'Oldest',
              icon: require('@/assets/images/old.svg?inline'),
            }
          }

          if (+el.slash_points === highestSlash) {
            filteredNodes[index].churn = {
              name: 'Highest Slashes',
              icon: require('@/assets/images/angry.svg?inline'),
            }
          }
        })

        return filteredNodes
      } else {
        return undefined
      }
    },
    stbNodes() {
      if (this.nodesQuery) {
        const activeVersion = this.nodesQuery.find(
          (e) => e.status === 'Active'
        ).version

        let stbNodes = this.nodesQuery?.filter(
          (e) =>
            (e.status === 'Standby' || e.status === 'Ready') &&
            e.version === activeVersion
        )

        stbNodes = orderBy(stbNodes, [(o) => +o.total_bond], ['desc'])

        const filteredNodes = []
        const churnInNumbers = 3 + this.newNodesChurn
        let churnNodes = 0
        for (let i = 0; i < stbNodes.length; i++) {
          const el = stbNodes[i]
          fillNodeData(filteredNodes, el)
          if (churnInNumbers > churnNodes) {
            if (el.jail && el.jail.release_height > this.chainsHeight?.THOR) {
              continue
            }
            filteredNodes[i].churn = {
              name: 'Churning In',
              icon: require('@/assets/images/circle-up.svg?inline'),
            }
            churnNodes++
          }
        }

        return filteredNodes
      } else {
        return undefined
      }
    },
    whiteListedNodes() {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery?.filter(
          (e) =>
            e.status !== 'Standby' &&
            e.status !== 'Active' &&
            e.status !== 'Ready'
        )
        const filteredNodes = []

        actNodes.forEach((el) => {
          fillNodeData(filteredNodes, el)
        })

        return filteredNodes
      } else {
        return undefined
      }
    },
  },
  watch: {
    chainsHeight(n, o) {
      if (!this.bondMetrics || !this.churnInterval) {
        return
      }

      const churnValue =
        1 - (this.bondMetrics?.nextChurnHeight - n.THOR) / this.churnInterval

      this.$store.commit('setExtraHeaderInfo', [
        {
          name: 'Churn',
          value: churnValue,
          filter: (v) => this.$options.filters.percent(v, '0,0.000'),
        },
      ])
    },
  },
  mounted() {
    const mimirProm = this.$api
      .getMimir()
      .then((res) => {
        this.churnHalted = res.data.HALTCHURNING
        this.minBond = +res.data.MINIMUMBONDINRUNE
        this.churnInterval = +res.data.CHURNINTERVAL
        this.newNodesChurn = +res.data.NUMBEROFNEWNODESPERCHURN
      })
      .catch((e) => {
        console.error(e)
      })

    const netProm = this.$api
      .getNetwork()
      .then((res) => {
        this.bondMetrics = res.data
      })
      .catch((e) => {
        console.error(e)
      })

    this.updateNodes().then((_) => {
      this.loading = false
    })

    this.intervalId = setInterval(() => {
      this.updateNodes()
    }, 10 * 1e3)

    Promise.all([netProm, mimirProm]).then((_) => {})
  },
  methods: {
    calculateChurnValue() {
      const churnValue =
        1 -
        (this.bondMetrics?.nextChurnHeight - this.chainsHeight.THOR) /
          this.churnInterval

      const churnArray = [
        {
          name: 'extraHeaderInfo',
          value: churnValue,
          filter: this.$options.filters.percent(churnValue, '0,0.000'),
        },
      ]

      this.$store.commit('setExtraHeaderInfo', churnArray)
    },

    async updateNodes() {
      const { data: nodesInfo } = await this.$api.getNodesInfo()
      this.nodesQuery = nodesInfo
    },
    calculateHardCap() {
      if (!this.nodesQuery) {
        return null
      }

      const actNodes = this.nodesQuery?.filter((n) => n.status === 'Active')
      if (actNodes?.length === 0) {
        return 0
      }
      actNodes?.sort((a, b) => +a.total_bond - +b.total_bond)
      const lowerNodes = actNodes?.slice(
        0,
        Math.floor((actNodes.length * 2) / 3)
      )
      return Math.floor(
        (Number.parseInt(lowerNodes?.slice(-1)[0].total_bond) ?? 0) / 10 ** 8
      )
    },
    destroyed() {
      this.clearIntervalId(this.intervalId)
    },
    calMedianBond() {
      const eNodes = this.bondMetrics?.standbyBonds.filter(
        (b) => b >= this.minBond
      )
      return (
        eNodes?.sort((a, b) => +a - +b)[Math.floor(eNodes.length / 2)] / 10 ** 8
      )
    },
    pSort(x, y, col, rowX, rowY) {
      return x?.length < y?.length ? -1 : x?.length > y?.length ? 1 : 0
    },
    cSort(x, y, col, rowX, rowY) {
      return x?.code < y?.code ? -1 : x?.code > y?.code ? 1 : 0
    },
    aSort(x, y, col, rowX, rowY) {
      return x?.number < y?.number ? -1 : x?.number > y?.number ? 1 : 0
    },
  },
  head: {
    title: 'THORChain Network Explorer | Nodes',
  },
}
</script>

<style lang="scss" scoped>
.grid-network {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(auto, 1fr));
  grid-gap: 0.5rem;
  gap: 0.5rem;
}

.extra {
  font-size: 0.7rem;
}
</style>
