<template>
  <Page :error="error && !loading" :fluid="true">
    <div class="grid-network">
      <Card>
        <info-card :options="activeInfo" :inner="true" />
      </Card>
      <Card>
        <info-card :options="standbyInfo" :inner="true" />
      </Card>
    </div>
    <div class="grid-network">
      <Card>
        <info-card :options="churnInfo" :inner="true">
          <template #churn="{ item }">
            <skeleton-item :loading="!item.value">
              <span style="font-family: Montserrat">
                {{ item.value }}
              </span>
            </skeleton-item>
          </template>
        </info-card>
      </Card>
      <Card>
        <info-card :options="blockRewardInfo" :inner="true" />
      </Card>
    </div>
    <div class="search-container">
      <div id="nodes-search-container">
        <input
          v-model="searchTerm"
          placeholder="Search All Tables"
          class="search-input"
        />
        <SearchIcon class="search-icon" />
      </div>

      <div class="filter-btns">
        <button
          class="filter-button"
          :class="{ 'enabled-btn': !hides.isp }"
          @click="
            hides.isp = !hides.isp
            saveFilters()
          "
        >
          <caret :class="['filter-icon', { disable: hides.isp }]" />
          ISP
        </button>
        <button
          class="filter-button"
          :class="{ 'enabled-btn': !hides.fee }"
          @click="
            hides.fee = !hides.fee
            saveFilters()
          "
        >
          <caret :class="['filter-icon', { disable: hides.fee }]" />
          Fee
        </button>
        <button
          class="filter-button"
          :class="{ 'enabled-btn': !hides.score }"
          @click="
            hides.score = !hides.score
            saveFilters()
          "
        >
          <caret :class="['filter-icon', { disable: hides.score }]" />
          Score
        </button>
        <button
          class="filter-button"
          :class="{ 'enabled-btn': !hides.age }"
          @click="
            hides.age = !hides.age
            saveFilters()
          "
        >
          <caret :class="['filter-icon', { disable: hides.age }]" />
          Age
        </button>
      </div>
    </div>

    <card
      :img-src="require('@/assets/images/active.svg')"
      title="Active Nodes"
      :is-loading="!activeNodes"
    >
      <node-table
        :rows="activeNodes"
        :cols="activeCols"
        :search-term="searchTerm"
        name="active-nodes"
        :sort-column="sortColumn"
        :sort-order="sortOrder"
        @sort-changed="onSortChange"
      />
    </card>
    <card
      :img-src="require('@/assets/images/churn.svg')"
      title="Eligible Nodes"
      :is-loading="!stbNodes"
    >
      <node-table
        :rows="stbNodes"
        :cols="stbCols"
        :search-term="searchTerm"
        name="rdy-nodes"
      />
    </card>
    <card
      :img-src="require('@/assets/images/whitelist.svg')"
      title="Whitelisted Nodes"
      :is-loading="!whiteListedNodes"
    >
      <node-table
        :rows="whiteListedNodes"
        :cols="otherNodes"
        :search-term="searchTerm"
        name="other-nodes"
      />
    </card>
  </Page>
</template>

<script>
import { mapGetters } from 'vuex'
import { rcompare } from 'semver'
import { orderBy, countBy } from 'lodash'
import moment from 'moment'
import NodeTable from './component/nodeTable.vue'
import { fillNodeData, availableChains, blockTime } from '~/utils'
import SearchIcon from '~/assets/images/search.svg?inline'
import Caret from '~/assets/images/caret.svg?inline'

export default {
  name: 'NodesPage',
  components: {
    NodeTable,
    Caret,
    SearchIcon,
  },
  data() {
    return {
      network: [],
      loading: true,
      mode: 'active',
      statusMode: 'node-stat',
      nodesQuery: undefined,
      nodesExtra: undefined,
      minBond: 30000000000000,
      extraNodeChurn: 0,
      newNodesChurn: 2,
      lastBlockHeight: undefined,
      churnInterval: undefined,
      churnOption: undefined,
      bondMetrics: undefined,
      mimirs: undefined,
      provDist: undefined,
      intervalId: undefined,
      secondInterval: undefined,
      churnHalted: undefined,
      searchTerm: '',
      churnProgressValue: 0,
      totalAwards: undefined,
      leastBondChurn: 0,
      retiringVaults: [],
      enteringBond: 0,
      enteringCount: 0,
      leavingBond: 0,
      leavingCount: 0,
      hides: {
        isp: false,
        score: true,
        fee: false,
        age: false,
      },
      sortColumn: null,
      sortOrder: null,
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
          sortFn: (x, y, col, rowX, rowY) =>
            this.highlightSort(x, y, col, rowX, rowY, 'active-nodes'),
        },
        {
          label: 'Address',
          field: 'address',
          formatFn: this.addressFormatV2,
          tdClass: 'mono',
        },
        {
          label: 'Churn',
          field: 'churn',
          thClass: 'center min-padding',
        },
        {
          label: 'ISP',
          field: 'isp',
          width: '50px',
          type: 'text',
          tdClass: 'center',
          thClass: 'center',
          hidden: this.hides?.isp ?? false,
        },
        {
          label: 'Location',
          field: 'location',
          width: '50px',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.cSort,
        },
        {
          label: 'Status',
          field: 'status',
          width: '70px',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Version',
          field: 'version',
          type: 'text',
          width: '80px',
          tdClass: 'center',
          sortFn: this.versionSort,
        },
        {
          label: 'Fee',
          field: 'fee',
          width: '80px',
          type: 'percentage',
          tdClass: 'mono',
          hidden: this.hides?.fee ?? false,
        },
        {
          label: 'Operator',
          field: 'operator',
          type: 'text',
          width: '90px',
          tdClass: 'mono center',
          thClass: 'center',
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
          hidden: this.hides?.score ?? false,
        },
        {
          label: 'APY',
          field: 'apy',
          type: 'percentage',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'Vault',
          field: 'vault',
          type: 'text',
          tdClass: 'center',
          thClass: 'center min-padding',
        },
        ...chains,
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.aSort,
          hidden: this.hides?.age ?? false,
        },
      ]
    },
    stbCols() {
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
          sortFn: (x, y, col, rowX, rowY) =>
            this.highlightSort(x, y, col, rowX, rowY, 'rdy-nodes'),
        },
        {
          label: 'Address',
          field: 'address',
          formatFn: this.addressFormatV2,
          tdClass: 'mono',
        },
        {
          label: 'Churn',
          field: 'churn',
          thClass: 'center min-padding',
        },
        {
          label: 'ISP',
          field: 'isp',
          width: '50px',
          type: 'text',
          tdClass: 'center',
          thClass: 'center',
          hidden: this.hides?.isp ?? false,
        },
        {
          label: 'Location',
          field: 'location',
          width: '50px',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.cSort,
        },
        {
          label: 'Status',
          field: 'status',
          width: '70px',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Version',
          field: 'version',
          width: '80px',
          type: 'text',
          tdClass: 'center',
          sortFn: this.versionSort,
        },
        {
          label: 'Fee',
          field: 'fee',
          width: '80px',
          type: 'percentage',
          tdClass: 'mono',
          hidden: this.hides?.fee ?? false,
        },
        {
          label: 'Operator',
          field: 'operator',
          type: 'text',
          width: '90px',
          tdClass: 'mono center',
          thClass: 'center',
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
        ...chains,
        {
          label: 'Age',
          field: 'age',
          type: 'number',
          tdClass: 'center',
          thClass: 'center',
          sortFn: this.aSort,
          hidden: this.hides?.age ?? false,
        },
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
          label: 'ISP',
          field: 'isp',
          width: '50px',
          type: 'text',
          tdClass: 'center',
        },
        {
          label: 'Location',
          field: 'location',
          width: '50px',
          tdClass: 'center',
          sortFn: this.cSort,
        },
        {
          label: 'Status',
          field: 'status',
          width: '70px',
          tdClass: 'center',
          thClass: 'center',
        },
        {
          label: 'Version',
          field: 'version',
          width: '80px',
          type: 'text',
          tdClass: 'center',
          sortFn: this.versionSort,
        },
        {
          label: 'Fee',
          field: 'fee',
          width: '80px',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Operator',
          field: 'operator',
          type: 'text',
          width: '100px',
          tdClass: 'mono center',
          thClass: 'center',
        },
        {
          label: 'Bond',
          field: 'total_bond',
          type: 'number',
          formatFn: this.normalFormat,
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
      ]
    },
    activeInfo() {
      return [
        {
          title: 'Active',
          rowStart: 1,
          colSpan: 1,
          grid: true,
          icon: require('@/assets/images/active.svg'),
          items: [
            {
              name: 'Node',
              value: this.network?.activeNodeCount,
            },
            {
              name: 'Bond',
              value: this.bondMetrics?.totalActiveBond / 10 ** 8,
              usdValue: true,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            },
            {
              name: 'Average',
              value: this.bondMetrics?.averageActiveBond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Maximum',
              value: Math.floor(this.bondMetrics?.maximumActiveBond / 10 ** 8),
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Minimum',
              value: Math.floor(this.bondMetrics?.minimumActiveBond / 10 ** 8),
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Max efficient',
              value: this.calculateHardCap(),
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              extraInfo: `${this.$options.filters.number(this.calculateHardCap(), '0,0.00')} RUNE`,
              usdValue: true,
            },
          ],
        },
      ]
    },
    standbyInfo() {
      return [
        {
          title: 'Standby',
          rowStart: 1,
          colSpan: 1,
          grid: true,
          icon: require('@/assets/images/standby.svg'),
          items: [
            {
              name: 'Nodes',
              value: this.network?.standbyNodeCount,
            },
            {
              name: 'Bond',
              value: this.bondMetrics?.totalStandbyBond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Average',
              value: this.bondMetrics?.averageStandbyBond / 10 ** 8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Maximum',
              value: Math.floor(this.bondMetrics?.maximumStandbyBond / 10 ** 8),
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Minimum',
              value: this.bondMetrics?.minimumStandbyBond / 10 ** 8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Least Churn',
              value: this.leastBondChurn,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
          ],
        },
      ]
    },
    churnInfo() {
      let churnValue

      if (this.churnProgressTime > 600) {
        churnValue = blockTime(this.churnProgressTime, true)
      } else if (this.churnProgressTime) {
        churnValue = `${this.churnProgressTime} Block`
      }

      if (this.churnProgressValue) {
        churnValue += ` | ${this.$options.filters.percent(this.churnProgressValue, '0,0.000')}`
      }

      if (this.churnHalted) {
        churnValue = 'Churn Halted'
      }

      return [
        {
          title: 'Current Churn',
          rowStart: 2,
          colSpan: 1,
          grid: true,
          icon: require('@/assets/images/next-churn.svg'),
          items: [
            {
              name: 'Next Churn',
              value: churnValue ?? 'No Churns',
              valueSlot: 'churn',
            },
            {
              name: 'Churn Interval',
              value: this.churnInterval,
              filter: (v) =>
                `${this.churnInterval ? blockTime(v, true) : 'N/A'}`,
            },
            {
              name: 'Total Rewards',
              value: this.totalAwards / 1e8,
              usdValue: true,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
            },
            {
              name: 'Average APY ',
              value: this.averageApysCalc(),
              filter: (v) => `${this.$options.filters.percent(v, 2)} `,
            },
            {
              name: 'Monthly Node Return',
              value: this.monthlyNodeReturn() / 1e8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Annual Node Return ',
              value: this.annualNodeReturn() / 1e8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Churn Duration',
              value: this.churn ? `${this.churn.date}` : '',
            },
            {
              name: 'Churn Start',
              value: this.churn ? `${this.churn.height}` : '',
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
          ],
        },
      ]
    },
    blockRewardInfo() {
      return [
        {
          title: 'Next Churn',
          rowStart: 2,
          colSpan: 1,
          grid: true,
          icon: require('@/assets/images/churn.svg'),
          items: [
            {
              name: 'Leaving Count',
              value: this.leavingCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Leaving Bond',
              value: this.leavingBond / 1e8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Entering Count',
              value: this.enteringCount,
              filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
            },
            {
              name: 'Entering Bond',
              value: this.enteringBond / 1e8,
              filter: (v) =>
                `${this.$options.filters.number(v, '0,0.00a')} RUNE`,
              usdValue: true,
            },
            {
              name: 'Bond Difference',
              value: (this.enteringBond - this.leavingBond) / 1e8,
              filter: (v) => `${this.$options.filters.number(v, '0,0a')} RUNE`,
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
        let actNodes = this.nodesQuery.filter((e) => e.status === 'Active')

        actNodes = orderBy(actNodes, [(o) => +o.slash_points])
        const filteredNodes = []

        // bond, slash, oldest, not updated
        let lowestBond = null
        let highestSlash = 0
        let oldest = this.chainsHeight?.THOR ?? Number.MAX_SAFE_INTEGER
        let oldestIndex

        // get all active version
        const lowVersions = []
        const nodesVersion = actNodes.map((r) => r.version).sort(rcompare)
        const versions = countBy(nodesVersion)

        for (let i = 0; i < actNodes.length; i++) {
          const el = actNodes[i]
          if (+el.slash_points > highestSlash) {
            highestSlash = +el.slash_points
          }

          if (el.status_since < oldest && el.requested_to_leave === false) {
            oldest = el.status_since
            oldestIndex = i
          }

          if (
            (!lowestBond || lowestBond > +el.total_bond) &&
            el.requested_to_leave === false
          ) {
            lowestBond = +el.total_bond
          }

          if (
            Object.keys(versions).length > 1 &&
            el.version !== Object.keys(versions)[0] &&
            Object.keys(versions)[0] > Math.floor((actNodes.length * 2) / 3)
          ) {
            lowVersions.push(el.node_address)
          }
        }

        let extraChurn = 0
        let leavingCount = 0
        let leavingBond = 0
        actNodes.forEach((el, index) => {
          fillNodeData(filteredNodes, el, index)

          filteredNodes[index].churn = []

          // Add churn data
          if (+el.total_bond === lowestBond) {
            filteredNodes[index].churn.push({
              name: 'Lowest Bond',
              icon: require('@/assets/images/cheap.svg?inline'),
              type:
                this.churnProgressValue > 0.5
                  ? 'churn-out'
                  : 'churn-out-candidate',
            })
            leavingBond += +el.total_bond
            leavingCount += 1
          }

          if (index === oldestIndex) {
            filteredNodes[index].churn.push({
              name: 'Oldest',
              icon: require('@/assets/images/old.svg?inline'),
              type:
                this.churnProgressValue > 0.5
                  ? 'churn-out'
                  : 'churn-out-candidate',
            })
            leavingBond += +el.total_bond
            leavingCount += 1
          }

          if (+el.slash_points === highestSlash) {
            filteredNodes[index].churn.push({
              name: 'Highest Slashes',
              icon: require('@/assets/images/angry.svg?inline'),
              type:
                this.churnProgressValue > 0.5
                  ? 'churn-out'
                  : 'churn-out-candidate',
            })
            leavingBond += +el.total_bond
            leavingCount += 1
          }

          if (
            lowVersions.includes(el.node_address) &&
            this.churnProgressValue > 0.9
          ) {
            filteredNodes[index].churn.push({
              name: 'Low Version',
              icon: require('@/assets/images/version.svg?inline'),
              type: this.churnProgressValue > 0.9 ? 'churn-out' : '',
            })
            extraChurn += 1
          }

          if (el.requested_to_leave) {
            filteredNodes[index].churn.push({
              name: 'Requested to leave',
              icon: require('@/assets/images/arrow-down-square.svg?inline'),
              type: 'leave',
            })

            if (
              this.mimirs &&
              +this.mimirs?.DESIREDVALIDATORSET > actNodes.length + extraChurn
            ) {
              extraChurn += 1
            }
            leavingBond += +el.total_bond
            leavingCount += 1
          }
        })

        this.setExtraChurn(extraChurn)
        this.setLeaving(leavingBond, leavingCount)
        return filteredNodes
      } else {
        return undefined
      }
    },
    stbNodes() {
      if (this.nodesQuery) {
        const actNodes = this.nodesQuery?.filter((e) => e.status === 'Active')
        const nodesVersion = actNodes?.map((r) => r.version).sort(rcompare)
        const versions = countBy(nodesVersion)
        const activeVersion = Object.keys(versions)

        // Check if the latest version is more than 2/3
        const latestVersion = activeVersion[0]
        let justLatest = false
        if (versions[latestVersion] > Math.floor((actNodes.length * 2) / 3)) {
          justLatest = true
        }

        let stbNodes = this.nodesQuery?.filter(
          (e) =>
            (e.status === 'Standby' || e.status === 'Ready') &&
            (activeVersion.includes(e.version) || e.total_bond >= this.minBond)
        )

        if (stbNodes.length === 0) {
          return []
        }

        stbNodes = orderBy(stbNodes, [(o) => +o.total_bond], ['desc'])

        const filteredNodes = []
        const churnInNumbers = 3 + this.newNodesChurn + this.extraNodeChurn
        let lastChurnIndex = 0
        let churnNodes = 0
        let enteringBond = 0
        let enteringCount = 0
        for (let i = 0; i < stbNodes.length; i++) {
          const el = stbNodes[i]
          fillNodeData(filteredNodes, el)

          const chainHeight = this.chainsHeight?.THOR

          filteredNodes[i].churn = []

          if (el.jail?.release_height > chainHeight) {
            filteredNodes[i].churn.push({
              name: {
                ...el.jail,
                releaseTime: moment
                  .duration(
                    (el.jail?.release_height - chainHeight) * 6,
                    'seconds'
                  )
                  .humanize(),
              },
              icon: require('@/assets/images/handcuffs.svg?inline'),
              type: 'jail',
            })
            continue
          }

          if (churnInNumbers > churnNodes) {
            if (justLatest && el.version !== latestVersion) {
              continue
            }
            if (el.jail && el.jail.release_height > this.chainsHeight?.THOR) {
              continue
            }
            if (+el.total_bond < this.minBond) {
              continue
            }
            filteredNodes[i].churn.push({
              name: 'Churning In',
              icon: require('@/assets/images/circle-up.svg?inline'),
              type:
                this.churnProgressValue > 0.5
                  ? 'churn-in'
                  : 'churn-in-candidate',
            })
            churnNodes++
            enteringBond += +el.total_bond
            enteringCount += 1
            lastChurnIndex = i
          }

          if (this.retiringVaults.includes(el.pub_key_set?.secp256k1)) {
            filteredNodes[i].churn.push({
              name: "Retiring Vault, Can't unbond",
              icon: require('@/assets/images/walker.svg?inline'),
            })
          }
        }

        this.setEntering(enteringBond, enteringCount)

        // Detect the last churn node
        this.setTheLeastBondChurn(filteredNodes[lastChurnIndex]?.total_bond)

        return filteredNodes
      } else {
        return undefined
      }
    },
    whiteListedNodes() {
      if (this.nodesQuery) {
        const actNodes = this.activeNodes?.map((n) => n.address)
        const stbNodes = this.stbNodes?.map((n) => n.address)

        let whtNodes = this.nodesQuery?.filter(
          (e) =>
            !actNodes.includes(e.node_address) &&
            e.status !== 'Disabled' &&
            e.age.number < 300 &&
            !stbNodes.includes(e.node_address)
        )

        whtNodes = orderBy(whtNodes, [(o) => +o.total_bond], ['desc'])

        const filteredNodes = []

        whtNodes.forEach((el) => {
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
      this.churnProgress()
      this.totalAwardsCalc()
    },
  },
  mounted() {
    this.getNodeOverview()

    this.$api
      .getAsgard()
      .then((res) => {
        this.retiringVaults = this.getRetiringVault(res.data)
      })
      .catch((e) => {
        console.error(e)
      })

    this.updateNodes().then((_) => {
      this.loading = false
    })

    this.$api.getMimir().then(({ data }) => {
      this.mimirs = data
    })

    this.intervalId = setInterval(() => {
      this.updateNodes()
    }, 10 * 1e3)

    this.secondInterval = setInterval(() => {
      this.getNodeOverview()
    }, 60 * 1e3)

    this.churnProgress()
    const savedFilters = localStorage.getItem('filterSettings')
    if (savedFilters) {
      this.hides = JSON.parse(savedFilters)
    }

    const savedSorting = JSON.parse(localStorage.getItem('tableSorting'))
    if (savedSorting) {
      this.sortColumn = savedSorting.column
      this.sortOrder = savedSorting.order
    }
  },
  destroyed() {
    this.clearIntervalId(this.intervalId)
    this.clearIntervalId(this.secondInterval)
  },
  methods: {
    getRetiringVault(vaults) {
      return vaults
        .filter((v) => v.status === 'RetiringVault')
        .map((v) => v.membership)
        .flat()
    },
    getNodeOverview() {
      this.$api
        .getNodeOverview()
        .then(({ data }) => {
          const { network, churn, blockRewards } = data

          this.network = network
          this.bondMetrics = network.bondMetrics
          this.churn = churn
          this.churnHalted = blockRewards.HALTCHURNING
          this.minBond = +blockRewards.MINIMUMBONDINRUNE
          this.churnInterval = +blockRewards.CHURNINTERVAL
          this.newNodesChurn = +blockRewards.NUMBEROFNEWNODESPERCHURN
        })
        .catch((e) => {
          console.error(e)
        })
    },
    async updateNodes() {
      const { data: nodesInfo } = await this.$api.getNodesInfo()
      this.nodesQuery = nodesInfo
    },
    saveFilters() {
      localStorage.setItem('filterSettings', JSON.stringify(this.hides))
    },
    setActiveCol(col) {
      this.activeCols = []
      if (col === 'isp') {
        this.activeCols.push({ field: 'isp', label: 'ISP' })
      } else if (col === 'fee') {
        this.activeCols.push({ field: 'fee', label: 'Fee' })
      } else if (col === 'score') {
        this.activeCols.push({ field: 'score', label: 'Score' })
      } else if (col === 'age') {
        this.activeCols.push({ field: 'age', label: 'Age' })
      }
    },
    setExtraChurn(num) {
      this.extraNodeChurn = num
    },
    setTheLeastBondChurn(bond) {
      this.leastBondChurn = bond
    },
    setEntering(bond, count) {
      this.enteringBond = bond
      this.enteringCount = count
    },
    setLeaving(bond, count) {
      this.leavingBond = bond
      this.leavingCount = count
    },
    totalAwardsCalc() {
      this.totalAwards = 0
      for (const a in this.nodesQuery) {
        this.totalAwards = this.totalAwards + +this.nodesQuery[a].current_award
      }
    },
    monthlyNodeReturn() {
      if (!this.totalAwards || !this.churnProgressValue || !this.network) {
        return
      }

      const churnProgress = this.churnProgressValue
      let churnPeriodInDays = ((this.churnInterval * 6) / 86400) * churnProgress
      const thisChurnBlock = this.chainsHeight?.THOR - +this.churn?.height
      if (thisChurnBlock > this.churnInterval) {
        churnPeriodInDays = (thisChurnBlock * 6) / 86400
      }

      const calculatedValue =
        (this.totalAwards / this.network?.activeNodeCount) *
        (30 / churnPeriodInDays)

      return calculatedValue
    },
    annualNodeReturn() {
      if (!this.totalAwards || !this.nodesQuery || !this.churnProgressValue) {
        return
      }

      const churnProgress = this.churnProgressValue
      let churnPeriodInDays = ((this.churnInterval * 6) / 86400) * churnProgress
      const thisChurnBlock = this.chainsHeight?.THOR - +this.churn?.height
      if (thisChurnBlock > this.churnInterval) {
        churnPeriodInDays = (thisChurnBlock * 6) / 86400
      }

      const annualNodes =
        (this.totalAwards / this.network?.activeNodeCount) *
        (365 / churnPeriodInDays)

      return annualNodes
    },

    averageApysCalc() {
      if (!this.nodesQuery || this.nodesQuery.length === 0) {
        this.averageApy = 0
        return
      }

      let totalApy = 0
      for (const node of this.nodesQuery) {
        totalApy += +node.apy
      }
      const totalActiveNodes = this.nodesQuery.filter(
        (node) => node.status === 'Active'
      ).length

      return totalApy / totalActiveNodes
    },
    churnProgress() {
      if (!this.network || !this.churnInterval) {
        return
      }

      const churnValue =
        1 -
        (this.network?.nextChurnHeight - this.chainsHeight?.THOR) /
          this.churnInterval

      this.churnProgressValue = churnValue

      const churnTime = this.network?.nextChurnHeight - this.chainsHeight?.THOR

      this.churnProgressTime = churnTime
    },
    calculateHardCap() {
      if (!this.nodesQuery) {
        return null
      }

      const actNodes = this.nodesQuery?.filter((n) => n.status === 'Active')
      if (actNodes?.length === 0) {
        return 0
      }
      if (actNodes?.length < 2) {
        return actNodes[0].total_bond
      }
      actNodes?.sort((a, b) => +a.total_bond - +b.total_bond)
      const lowerNodes = actNodes?.slice(
        0,
        Math.floor((actNodes.length * 2) / 3)
      )
      return Math.floor(
        (Number.parseInt(lowerNodes?.slice(-1)[0]?.total_bond) ?? 0) / 10 ** 8
      )
    },
    calMedianBond() {
      const eNodes = this.bondMetrics?.standbyBonds.filter(
        (b) => b >= this.minBond
      )
      return (
        eNodes?.sort((a, b) => +a - +b)[Math.floor(eNodes.length / 2)] / 10 ** 8
      )
    },
    cSort(x, y, col, rowX, rowY) {
      return x?.code < y?.code ? -1 : x?.code > y?.code ? 1 : 0
    },
    aSort(x, y, col, rowX, rowY) {
      return x?.number < y?.number ? -1 : x?.number > y?.number ? 1 : 0
    },
    highlightSort(x, y, col, rowX, rowY, name) {
      const favs =
        JSON.parse(localStorage.getItem(name))?.map((f) => f.address) || []
      if (!favs) {
        return 0
      }
      if (favs.includes(rowX.address)) {
        return 1
      }
      if (favs.includes(rowY.address)) {
        return -1
      }
      return 0
    },
    saveSorting(column, order) {
      localStorage.setItem('tableSorting', JSON.stringify({ column, order }))
    },
    onSortChange({ column, order }) {
      this.sortColumn = column
      this.sortOrder = order
      localStorage.setItem('tableSorting', JSON.stringify({ column, order }))
    },
  },
  head: {
    title: 'THORChain Network Explorer | Nodes',
  },
}
</script>

<style lang="scss" scoped>
.search-container {
  display: flex;
  flex-wrap: wrap;
  margin: $space-0 $space-10;
  gap: 0.5rem;

  @include lg {
    margin: $space-0;
    gap: $space-0;
  }
}

.filter-btns {
  display: flex;
  margin-left: $space-5;
  gap: $space-5;

  .enabled-btn {
    color: var(--primary-color) !important;
    border: 1px solid var(--primary-color) !important;
  }

  .filter-button {
    background-color: var(--bg-color);
    color: var(--sec-font-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-2lg;
    margin: $space-2 $space-0;
    padding: $space-8 $space-16;
    display: inline-flex;
    align-items: center;
    gap: $space-5;
    font-size: $font-size-sm;
    cursor: pointer;

    &:hover {
      color: var(--primary-color);
    }
  }
}

#nodes-search-container {
  display: flex;
  position: relative;
  flex: 1;

  .search-input {
    flex: 1;
    color: var(--sec-font-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: $radius-lg;
    outline: none;
    margin: $space-2;
    padding: $space-12;
    font-size: $font-size-mobile;
    font-weight: 450;

    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
      color: var(--primary-color);
    }
  }

  .search-icon {
    position: absolute;
    width: 20px;
    height: 24px;
    fill: var(--font-color);
    right: 0.8rem;
    top: calc(50% - 0.8rem);
    cursor: pointer;
    transition: fill 0.3s ease;
    box-sizing: content-box;
    background: var(--card-bg-color);
    padding-left: $space-8;
  }
}

.grid-network {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 0.5rem;
  gap: 0.5rem;
}

.extra {
  font-size: $font-size-xs;
}

.filter-icon {
  fill: currentColor;
  width: 1rem;
  height: 1rem;
  transform: rotate(180deg);

  &.disable {
    transform: rotate(0);
  }
}
</style>
