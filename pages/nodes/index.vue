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

      <div class="dropdown-container" ref="dropdownContainer">
        <button class="dropdown-toggle" @click="toggleDropdown">
          <Caret :class="['dropdown-icon', { open: dropdownOpen }]" />
          Filters
          <span v-if="activeFilterCount > 0" class="filter-count">
            {{ activeFilterCount }}
          </span>
        </button>

        <transition name="dropdown">
          <div v-if="dropdownOpen" class="dropdown-menu">
            <div class="filter-options">
              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.isp"
                  @change="toggleFilter('isp')"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">ISP</span>
              </label>

              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.fee"
                  @change="toggleFilter('fee')"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">Fee</span>
              </label>

              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.score"
                  @change="toggleFilter('score')"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">Score</span>
              </label>

              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.age"
                  @change="toggleFilter('age')"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">Age</span>
              </label>

              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.RPC && !hides.BFR"
                  @change="toggleHealthFilter"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">Health</span>
              </label>

              <label class="filter-option">
                <input
                  type="checkbox"
                  :checked="!hides.runebond"
                  @change="toggleFilter('runebond')"
                  class="custom-checkbox"
                />
                <span class="custom-checkbox-label"></span>
                <span class="filter-label">Runebond</span>
              </label>
            </div>
            <div class="dropdown-footer">
              <button class="clear-all-btn" @click="clearAllFilters">
                Clear All
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <card :img-src="require('@/assets/images/active.svg')" title="Active Nodes">
      <TableLoader
        v-if="loading"
        :cols="activeCols"
        :rows="Array(10).fill({})"
      />
      <node-table
        v-else
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
    >
      <TableLoader v-if="loading" :cols="stbCols" :rows="Array(10).fill({})" />
      <node-table
        v-else
        :rows="stbNodes"
        :cols="stbCols"
        :search-term="searchTerm"
        name="rdy-nodes"
      />
    </card>
    <card
      :img-src="require('@/assets/images/whitelist.svg')"
      title="Whitelisted Nodes"
    >
      <TableLoader
        v-if="loading"
        :cols="otherNodes"
        :rows="Array(10).fill({})"
      />
      <node-table
        v-else
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
import TableLoader from '~/components/tableLoader.vue'

export default {
  name: 'NodesPage',
  components: {
    NodeTable,
    Caret,
    SearchIcon,
    TableLoader,
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
        RPC: true,
        BFR: true,
        runebond: true,
      },
      sortColumn: null,
      sortOrder: null,
      dropdownOpen: false,
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
    activeFilterCount() {
      let count = 0

      if (!this.hides.isp) count++
      if (!this.hides.fee) count++
      if (!this.hides.score) count++
      if (!this.hides.age) count++

      if (!this.hides.RPC && !this.hides.BFR) count++
      
      if (!this.hides.runebond) count++

      return count
    },
    activeCols() {
      const chains = this.nodesQuery
        ? availableChains(this.nodesQuery.filter((n) => n.status === 'Active'))
            ?.sort()
            ?.map((c) => ({
              label: c,
              field: `behind.${c}`,
              type: 'number',
              tdClass: 'mono center',
              thClass: 'center no-padding',
            })) || []
        : []

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
          label: '',
          field: 'missing_blocks',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center no-padding',
        },
        {
          label: 'RPC',
          field: 'rpcHealth',
          type: 'text',
          tdClass: 'mono center',
          thClass: 'center no-padding',
          hidden: this.hides?.RPC ?? false,
        },
        {
          label: 'BFR',
          field: 'bifrostHealth',
          type: 'text',
          tdClass: 'mono center',
          thClass: 'center no-padding',
          hidden: this.hides?.BFR ?? false,
        },
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
      const chains = this.nodesQuery
        ? availableChains(this.nodesQuery.filter((n) => n.status === 'Active'))
            ?.sort()
            ?.map((c) => ({
              label: c,
              field: `behind.${c}`,
              type: 'number',
              tdClass: 'mono center',
              thClass: 'center no-padding',
            })) || []
        : []

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
          label: '',
          field: 'missing_blocks',
          type: 'number',
          tdClass: 'mono center',
          thClass: 'center no-padding',
        },
        {
          label: 'RPC',
          field: 'rpcHealth',
          type: 'text',
          width: '40px',
          tdClass: 'mono center',
          thClass: 'center no-padding',
          hidden: this.hides?.RPC ?? false,
        },
        {
          label: 'BFR',
          field: 'bifrostHealth',
          type: 'text',
          width: '40px',
          tdClass: 'mono center',
          thClass: 'center no-padding',
          hidden: this.hides?.BFR ?? false,
        },
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
              filter: (v) => this.formatRune(v, '0,0.00a'),
            },
            {
              name: 'Average',
              value: this.bondMetrics?.averageActiveBond / 10 ** 8,
              filter: (v) => this.formatRune(v, '0,0'),
              usdValue: true,
            },
            {
              name: 'Minimum',
              value: Math.floor(this.bondMetrics?.minimumActiveBond / 10 ** 8),
              filter: (v) => this.formatRune(v, '0,0'),
              usdValue: true,
            },
            {
              name: 'Max Effective',
              value: this.calculateHardCap(),
              filter: (v) => this.formatRune(v, '0,0'),
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
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Average',
              value: this.bondMetrics?.averageStandbyBond / 10 ** 8,
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Maximum',
              value: Math.floor(this.bondMetrics?.maximumStandbyBond / 10 ** 8),
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Minimum',
              value: this.bondMetrics?.minimumStandbyBond / 10 ** 8,
              filter: (v) => this.formatRune(v, '0,0.00a'),
              usdValue: true,
            },
            {
              name: 'Least Churn',
              value: this.leastBondChurn,
              filter: (v) => this.formatRune(v, '0,0.00a'),
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
              filter: (v) => this.formatRune(v, '0,0a'),
            },
            {
              name: 'Average APY ',
              value: this.averageApysCalc(),
              filter: (v) => `${this.$options.filters.percent(v, 2)} `,
            },
            {
              name: 'Monthly Node Return',
              value: this.monthlyNodeReturn() / 1e8,
              filter: (v) => this.formatRune(v, '0,0a'),
              usdValue: true,
            },
            {
              name: 'Annual Node Return ',
              value: this.annualNodeReturn() / 1e8,
              filter: (v) => this.formatRune(v, '0,0a'),
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
              filter: (v) => this.formatRune(v, '0,0.00a'),
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
              filter: (v) => this.formatRune(v, '0,0.00a'),
              usdValue: true,
            },
            {
              name: 'Bond Difference',
              value: (this.enteringBond - this.leavingBond) / 1e8,
              filter: (v) => this.formatRune(v, '0,0a'),
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
              +this.mimirs?.DESIREDVALIDATORSET >= actNodes.length + extraChurn
            ) {
              extraChurn += 1
            }
            leavingBond += +el.total_bond
            leavingCount += 1
          }

          if (el.runebond && el.runebond.available === true && !this.hides.runebond) {
            filteredNodes[index].churn.push({
              name: 'This node is available to be bonded on RUNEBond',
              icon: require('@/assets/images/runebond.svg?inline'),
              link: `https://app.runebond.com/nodes/${el.node_address}`,
              type: 'runebond',
              minRune: el.runebond.minRune,
              maxRune: el.runebond.maxRune,
            })
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
        const remainingCount =
          +this.mimirs?.DESIREDVALIDATORSET -
          this.activeNodes?.length +
          this.leavingCount
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
            if (!activeVersion.includes(el.version)) {
              continue
            }
            if (el.jail && el.jail.release_height > this.chainsHeight?.THOR) {
              continue
            }
            if (+el.total_bond < this.minBond) {
              continue
            }
            // if (el.status === 'Ready' && el.age.number < 300) {
            //   continue
            // }
            if (remainingCount <= churnNodes) {
              continue
            }
            if (el.maintenance) {
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

          if (el.maintenance) {
            filteredNodes[i].churn.push({
              name: "Maintenance mode, won't churn",
              icon: require('@/assets/images/hammer.svg?inline'),
            })
          }

          if (el.runebond && el.runebond.available === true && !this.hides.runebond) {
            filteredNodes[i].churn.push({
              name: 'This node is available to be bonded on RUNEBond',
              icon: require('@/assets/images/runebond.svg?inline'),
              link: `https://app.runebond.com/nodes/${el.node_address}`,
              type: 'runebond',
              minRune: el.runebond.minRune,
              maxRune: el.runebond.maxRune,
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

        whtNodes.forEach((el, index) => {
          fillNodeData(filteredNodes, el)

          if (el.runebond && el.runebond.available === true && !this.hides.runebond && filteredNodes[index] && filteredNodes[index].churn) {
            filteredNodes[index].churn.push({
              name: 'This node is available to be bonded on RUNEBond',
              icon: require('@/assets/images/runebond.svg?inline'),
              link: `https://app.runebond.com/nodes/${el.node_address}`,
              type: 'runebond',
              minRune: el.runebond.minRune,
              maxRune: el.runebond.maxRune,
            })
          }
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
    document.addEventListener('click', this.handleClickOutside)
  },
  beforeDestroy() {
    this.clearIntervalId(this.intervalId)
    this.clearIntervalId(this.secondInterval)
    document.removeEventListener('click', this.handleClickOutside)
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
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen
    },
    toggleFilter(filterName) {
      this.hides[filterName] = !this.hides[filterName]
      this.saveFilters()
    },
    toggleHealthFilter() {
      this.hides.RPC = !this.hides.RPC
      this.hides.BFR = !this.hides.BFR
      this.saveFilters()
    },
    clearAllFilters() {
      this.hides = {
        isp: true,
        score: true,
        fee: true,
        age: true,
        RPC: true,
        BFR: true,
        runebond: true,
      }
      this.saveFilters()
    },
    saveFilters() {
      localStorage.setItem('filterSettings', JSON.stringify(this.hides))
    },
    handleClickOutside(event) {
      if (
        this.dropdownOpen &&
        !this.$refs.dropdownContainer?.contains(event.target)
      ) {
        this.dropdownOpen = false
      }
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
      } else if (col === 'RPC') {
        this.activeCols.push({ field: 'RPC', label: 'RPC' })
      } else if (col === 'BFR') {
        this.activeCols.push({ field: 'BFR', label: 'BFR' })
      } else if (col === 'runebond') {
        this.activeCols.push({ field: 'runebond', label: 'Runebond' })
      }
    },
    setNewNodesChurn(num) {
      this.newNodesChurn = num
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
        return 0
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
    formatRune(value, format) {
      return this.$options.filters.number(value, format) + ' RUNE'
    },
    clearIntervalId(intervalId) {
      if (intervalId) {
        clearInterval(intervalId)
      }
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
  gap: 1rem;
  align-items: center;
  position: relative;

  @include lg {
    margin: $space-0;
    gap: $space-0;
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

.dropdown-container {
  position: relative;
}

.dropdown-toggle {
  background-color: var(--bg-color);
  color: var(--sec-font-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-2lg;
  padding: $space-12 $space-16;
  display: inline-flex;
  align-items: center;
  gap: $space-8;
  font-size: $font-size-sm;
  cursor: pointer;
  min-width: 120px;
  justify-content: center;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .filter-count {
    background-color: var(--primary-color);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-xs;
    margin-left: auto;
  }
}

.dropdown-icon {
  fill: currentColor;
  width: 1rem;
  height: 1rem;
  transition: transform 0.3s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-lg;
  margin-top: $space-8;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
}

.dropdown-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: $space-12 $space-16;
  border-top: 1px solid var(--border-color);
  font-size: $font-size-sm;
  font-weight: 500;

  .clear-all-btn {
    background: none;
    border: 1px solid var(--border-color);
    color: var(--sec-font-color);
    font-size: $font-size-xs;
    cursor: pointer;
    padding: $space-4 $space-8;
    border-radius: $radius-sm;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(var(--primary-color-rgb), 0.1);
      color: var(--primary-color);
    }
  }
}

.filter-options {
  padding: $space-8;
}

.filter-option {
  display: flex;
  align-items: center;
  padding: $space-8 $space-12;
  cursor: pointer;
  border-radius: $radius-sm;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: rgba(var(--primary-color-rgb), 0.05);

    .custom-checkbox-label {
      border-color: var(--primary-color);
    }
  }

  input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    margin: 0;
  }

  .custom-checkbox-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-radius: 5px;
    margin-right: $space-8;
    position: relative;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    background-color: var(--card-bg-color);
    flex-shrink: 0;

    &::after {
      content: '';
      width: 12px;
      height: 6px;
      border-left: 2px solid transparent;
      border-bottom: 2px solid transparent;
      transform: rotate(-45deg) scale(0);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      position: absolute;
      top: 2px;
    }
  }

  input[type='checkbox']:checked + .custom-checkbox-label {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    animation: checkAnim 0.3s ease;

    &::after {
      border-color: white;
      transform: rotate(-45deg) scale(1);
    }
  }

  input[type='checkbox']:focus + .custom-checkbox-label {
    box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
  }

  .filter-label {
    font-size: $font-size-sm;
    color: var(--font-color);
    flex: 1;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  input[type='checkbox']:checked ~ .filter-label {
    color: var(--primary-color);
  }
}

@keyframes checkAnim {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
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
</style>
