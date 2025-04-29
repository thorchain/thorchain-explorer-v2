<template>
  <Page>
    <div class="card-container">
      <Card v-if="votingChart" class="mobile-hidden">
        <VChart
          :option="votingChart"
          :loading="!votingChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
          :style="{
            width: '100%',
            height: '600px',
            minHeight: 'initial',
          }"
        />
      </Card>
    </div>
    <Card :is-loading="!currentVoting" title="Mimir Voting Overview">
      <vue-good-table
        v-if="votesCols && currentVoting"
        :columns="votesCols"
        :rows="currentVoting"
        style-class="vgt-table net-table custom-table"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'result' },
        }"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'result'">
            <div
              :class="[
                'mini-bubble',
                { yellow: props.row.result === 'In Progress' },
              ]"
            >
              {{ props.row.result | capitalize }}
            </div>
          </div>
          <span v-else-if="props.column.field === 'votes'">
            <div class="votes">
              <div
                v-for="(v, index) in props.row.value"
                :key="index"
                class="votes-item"
              >
                <div class="vote-info">
                  <strong class="value">{{ v }}</strong>
                  <span class="votes-needed"
                    >{{ props.row.count[index] }} / {{ nodesNeedToPass }}</span
                  >
                  <progress-bar
                    :width="(props.row.count[index] * 100) / nodesNeedToPass"
                    height="4px"
                  />
                  <span>{{
                    (props.row.count[index] / nodesNeedToPass) | percent(0)
                  }}</span>
                  <div
                    v-if="props.row.currentVal.toString() === v"
                    class="mini-bubble"
                  >
                    Current
                  </div>
                </div>
              </div>
              <div class="votes-item">
                <div class="vote-info">
                  <strong>Not Voted:</strong>
                  <span v-if="network" class="mini-bubble danger">{{
                    network.activeNodeCount -
                    props.row.count.reduce((p, c) => p + +c, 0)
                  }}</span>
                </div>
              </div>
            </div>
          </span>
          <div v-else-if="props.column.field == 'vote'" class="cell-content">
            <strong>
              {{ props.formattedRow[props.column.field] }}
            </strong>
          </div>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
  </Page>
</template>

<script>
import _, { orderBy } from 'lodash'
import { mapGetters } from 'vuex'

import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  components: {
    VChart,
  },
  data() {
    return {
      isLoading: true,
      mimirVotes: undefined,
      mimirs: undefined,
      votingChart: undefined,
      nodesNeedToPass: undefined,
      nodes: undefined,
      cols: [
        {
          label: 'Signer',
          field: 'signer',
          sortable: false,
          tdClass: 'mono',
        },
        {
          label: 'Value',
          field: 'value',
          type: 'number',
          tdClass: 'mono',
        },
      ],
      votesCols: [
        {
          label: 'Vote',
          field: 'vote',
          sortable: false,
        },
        {
          label: 'Result',
          field: 'result',
          thClass: 'center',
          tdClass: 'center',
          type: 'text',
        },
        {
          label: 'Vote Poll',
          field: 'votes',
          tdClass: 'mono',
        },
      ],
    }
  },
  computed: {
    currentVoting() {
      if (this.mimirVotes && this.mimirs && this.nodes) {
        const mimrsVoteConstants = []
        const xaxis = []
        const types = []
        let votesLength = 0
        for (const m of Object.keys(this.mimirs)) {
          if (Object.keys(this.mimirVotes).includes(m)) {
            if (this.mimirVotes[m].every((v) => v.value === undefined)) {
              continue
            }
            votesLength++
          }
        }
        let index = 0
        for (const m of Object.keys(this.mimirVotes)) {
          const filteredVotes = [
            'ADR012',
            'ADR18',
            'ADR013',
            'ALTGAIACHAIN',
            'BAREMETALBADASS',
            'BSCREADY',
            'DEPRECATEILP',
            'ELROND',
            'ENABLEAVAXCHAIN',
            'ENABLEBSC',
            'ENABLEDASHCHAIN',
            'ENABLEDOFM',
            'ENABLEUPDATEMEMOTERRA',
            'FULLIMPLOSSPROTECTIONBLOCKS',
            'KILLSWITCHSTART',
            'L1MINSLIPBPS',
            'MAXBONDPROVIDES',
            'MAXRUNESUPPLY',
            'MULTIPARTITEFORPRESIDENT',
            'NEXTCHAIN',
            'NEXTFEATUREPERPRS',
            'NEXTFEATUREPERPS',
            'REMOVESNXPOOL',
            'SUPPORTTHORCHAINDOTNETWORK',
            'TEST',
            'THISISANEWMIMIR',
            'VOTEDOFM',
            'VOTELENDING',
            'VOTEMAXBONDPROVIDERS',
            'VOTEMAXSYNTHSFORSAVERSYIELD',
            'VOTESTREAMINGSWAPS',
            'ENABLEVAXCHAIN',
            'MAXSYNTHPERASSETDEPTH',
            'MINIMUM1OUTBOUNDFEEUSD',
          ]

          if (
            m.toLowerCase().includes('ragnarok') ||
            filteredVotes.includes(m.toUpperCase())
          ) {
            continue
          }
          const hVotes = this.getVoteHighestBid(this.mimirVotes[m])
          if (this.mimirVotes[m].every((v) => v.value === undefined)) {
            continue
          }
          if (hVotes.values.length === 0) {
            votesLength--
            continue
          }
          xaxis.push(m)
          hVotes.values.forEach((v) => {
            if (v.value === 'undefined') {
              return
            }
            const vIndex = types?.findIndex(
              (t) => t.name?.toString() === v.value?.toString()
            )
            if (vIndex === -1) {
              const initData = _.times(votesLength, _.constant(0))
              initData[index] = v.count
              types.push({
                name: v.value,
                type: 'bar',
                stack: 'total',
                data: initData,
              })
            } else {
              types[vIndex].data[index] = v.count
            }
          })
          hVotes.values = orderBy(hVotes.values, [(o) => +o.count], ['desc'])
          mimrsVoteConstants.push({
            vote: m,
            currentVal: this.mimirs[m] !== undefined ? this.mimirs[m] : '-',
            highestValue: hVotes.value,
            consensus: hVotes.consensus,
            votePassed: hVotes.votePassed,
            remainingVotes: +this.network?.activeNodeCount - hVotes.votePassed,
            result:
              +this.mimirs[m] === +hVotes.value ? 'Passed' : 'In Progress',
            value: hVotes.values.map((v) => v.value),
            count: hVotes.values.map((v) => v.count),
          })
          index++
        }
        let option = this.basicChartFormat(undefined, types, xaxis)
        option = {
          ...option,
          tooltip: {
            trigger: 'axis',
            formatter: (param) => {
              const totalActiveNodes = this.network?.activeNodeCount || 0
              const totalVoted = param.reduce((acc, p) => acc + p.value, 0)
              const missingVotes = Math.max(0, totalActiveNodes - totalVoted)
              const tooltipContent = `
      <div class="tooltip-header" style="text-align:center; font-weight:bold; margin-bottom:5px;">
        ${param[0].axisValue}
      </div>
      <table class="tooltip-table" style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr>
            <th style="padding: 5px; text-align:left;">Value</th>
            <th style="padding: 5px; text-align:center;">Count</th>
            <th style="padding: 5px; text-align:center;">Consensus</th>
            <th style="padding: 5px; text-align:center;">Votes Needed</th>
          </tr>
        </thead>
        <tbody>
          ${param
            .map((p) => {
              if (p.value > 0) {
                const consensusNeeded = Math.ceil(totalActiveNodes * 0.66)
                const consensus = this.$options.filters.percent(
                  p.value / totalActiveNodes,
                  2
                )

                const votesNeeded = Math.max(0, consensusNeeded - p.value)

                return `
                  <tr>
                    <td style="padding: 5px; text-align:left; color: var(--sec-font-color);">${p.seriesName}</td>
                    <td style="padding: 5px; text-align:center; color: var(--sec-font-color);">${p.value}</td>
                    <td style="padding: 5px; text-align:center; color: var(--sec-font-color);">${consensus}</td>
                    <td style="padding: 5px; text-align:center; color: var(--sec-font-color);">${votesNeeded === 0 ? '✅' : votesNeeded}</td>
                  </tr>
                `
              }
              return ''
            })
            .join('')}
        </tbody>
      </table>
      <hr style="margin: 10px 0; border: 1px solid #ddd;">
      <div style="text-align:center; font-size:12px;color: var(--sec-font-color);">
        <b>Voted:</b> ${totalVoted} - <b>Missing votes:</b> ${missingVotes}</div>
    `
              return tooltipContent
            },
          },

          title: {
            text: 'Mimir Voting Chart',
            textStyle: {
              color: 'var(--font-color)',
            },
          },
          grid: {
            left: '2%',
            height: '80%',
            containLabel: true,
          },
          legend: {
            show: false,
          },
          xAxis: {
            type: 'value',
            splitLine: {
              show: false,
            },
          },
          yAxis: {
            type: 'category',
            data: xaxis,
            boundaryGap: ['20%', '10%'],
            axisLabel: {
              interval: 0,
              nameTextStyle: {
                padding: 20,
                margin: 20,
                align: 'center',
              },
            },
          },
        }

        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        this.votingChart = option

        return mimrsVoteConstants
      }
      return []
    },
    ...mapGetters({
      network: 'getNetworkData',
    }),
  },
  mounted() {
    this.$api
      .getMimirVotes()
      .then((res) => {
        this.mimirVotes = this.formatVotes(res.data?.mimirs)
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getMimir()
      .then((res) => {
        this.mimirs = { ...res.data, SYSTEMINCOMEBURNRATEBPS: '0' }
      })
      .catch((e) => {
        console.error(e)
      })

    this.$api
      .getNodes()
      .then((res) => {
        this.nodes = res.data
      })
      .catch((e) => {
        console.error(e)
      })
  },
  methods: {
    formatVotes(mimirs) {
      const votes = {}
      for (const i in mimirs) {
        // if the value if undefined it's zero
        if (!mimirs[i].value) {
          mimirs[i].value = 0
        }
        // filter out old mimirs
        const filteredMimirs = ['KILLSWITCHSTART']
        if (filteredMimirs.includes(mimirs[i].key)) {
          continue
        }
        if (!(mimirs[i].key in votes)) {
          votes[mimirs[i].key] = [
            {
              signer: mimirs[i].signer,
              value: mimirs[i].value,
            },
          ]
        } else {
          votes[mimirs[i].key].push({
            signer: mimirs[i].signer,
            value: mimirs[i].value,
          })
        }
      }
      return votes
    },
    gotoAddr(address) {
      this.$router.push({ path: `/address/${address}` })
    },
    gotoNode(signer) {
      this.$router.push({ path: `/node/${signer}` })
    },
    getVoteHighestBid(voters) {
      if (!voters) {
        return
      }
      if (voters.length === 0 && !this.nodes) {
        return
      }
      const activeVoters = voters?.filter((v) =>
        this.nodes
          ?.filter((n) => n.status === 'Active')
          .map((n) => n.node_address)
          .includes(v.signer)
      )
      const values = activeVoters.map((v) => v.value)
      const voteCount = _.countBy(values)
      const votesObj = Object.keys(voteCount).map((v) => {
        const count = voteCount[v]
        this.nodesNeedToPass =
          parseInt(this.network?.activeNodeCount * (2 / 3)) + 1
        const consensus = count / +this.network?.activeNodeCount
        const consensusNeeded = Math.ceil(+this.network?.activeNodeCount * 0.66)
        const votesNeeded = Math.max(0, consensusNeeded - count)

        return {
          value: v,
          count: voteCount[v],
          votesNeeded,
          consensus,
        }
      })

      const hVote = _.maxBy(votesObj, (o) => o.consensus)

      return {
        consensus: hVote?.consensus ?? 0,
        votePassed: activeVoters?.length ?? 0,
        value: hVote?.value ?? '-',
        values: votesObj,
        totalActiveNodes: this.network?.activeNodeCount || 0,
        consensusNeeded: Math.ceil(this.network?.activeNodeCount * 0.66),
        votesNeeded: votesObj.map((v) => v.votesNeeded),
        count: hVote ? hVote.count : 0,
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | Mimir votes',
  },
}
</script>

<style lang="scss" scoped>
.mobile-hidden {
  display: none;
  @include md {
    display: block;
  }
}

.votes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: $space-10;
  border: 1px solid var(--border-color) !important;
  border-radius: $radius-lg;
}
.data-color {
  margin-right: $space-5;
  width: 10px;
  height: 10px;
  border-radius: $radius-full;
}
.votes-item {
  border-radius: $radius-2lg;
  font-size: $font-size-sm;
}
.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: $space-5;
}
.vote-info {
  display: flex;
  align-items: center;
  margin: $space-3;
  gap: 0.5rem;
}
.tooltip-body {
  margin-top: $space-5;
  width: 120px;
  display: flex;
  flex-direction: column;
  gap: 5px;

  > span {
    display: flex;
    justify-content: space-between;

    b {
      text-align: right;
    }
  }
}

.votes-needed {
  color: var(--sec-font-color);
  background-color: var(--border-color);
  padding: $space-0 $space-4;
  border-radius: $radius-s;
}
</style>
