<template>
  <Page>
    <div class="card-container">
      <Card v-if="votingChart && currentVoting">
        <VChart
          :option="votingChart"
          :loading="!votingChart"
          :autoresize="true"
          :loading-options="showLoading"
          :theme="chartTheme"
        />
      </Card>
    </div>
    <Card :is-loading="!currentVoting" title="Mimir Voting Overview">
      <vue-good-table
        v-if="votesCols && currentVoting"
        :columns="votesCols"
        :rows="currentVoting"
        style-class="vgt-table net-table bordered"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
        :sort-options="{
          enabled: true,
          initialSortBy: { field: 'result' },
        }"
      >
        <template slot="table-row" slot-scope="props">
          <div v-if="props.column.field == 'result'" class="cell-content">
            <div
              :class="[
                'bubble-container',
                { yellow: props.row.result === 'In Progress' },
              ]"
            >
              {{ props.row.result | capitalize }}
            </div>
          </div>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card>
    <!-- <Card v-for="(v, k, i) in mimirVotes" :key="i" :title="`${k} Voters`">
      <vue-good-table
        v-if="cols && v.length > 0"
        :columns="cols"
        :rows="v"
        style-class="vgt-table net-table vgt-compact"
        :line-numbers="true"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'signer'">
            <span class="clickable" @click="gotoNode(props.row.signer)">
              {{ props.row.signer }}
            </span>
          </span>
          <span v-else>
            {{ props.formattedRow[props.column.field] }}
          </span>
        </template>
      </vue-good-table>
    </Card> -->
  </Page>
</template>

<script>
import _ from 'lodash'
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
          label: 'Current Mimir Value',
          field: 'currentVal',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Highest Voted Value',
          field: 'highestValue',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Voted',
          field: 'votePassed',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Missing',
          field: 'remainingVotes',
          type: 'number',
          tdClass: 'mono',
        },
        {
          label: 'Consensus',
          field: 'consensus',
          type: 'percentage',
          tdClass: 'mono',
        },
        {
          label: 'Result',
          field: 'result',
          type: 'text',
        },
      ],
    }
  },
  computed: {
    currentVoting() {
      if (this.mimirVotes && this.mimirs) {
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
        console.log(this.mimirVotes)
        let index = 0
        for (const m of Object.keys(this.mimirs)) {
          if (Object.keys(this.mimirVotes).includes(m)) {
            if (m.toLowerCase().includes('ragnarok')) {
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
            const consensusPercent = hVotes.consensus * 100
            const isPassed = +this.mimirs[m] === +hVotes.value
            if (isPassed && consensusPercent < 30) {
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
                  itemStyle: {
                    borderRadius: [2, 2, 0, 0],
                  },
                })
              } else {
                types[vIndex].data[index] = v.count
              }
            })
            mimrsVoteConstants.push({
              vote: m,
              currentVal: this.mimirs[m] === -1 ? '-' : this.mimirs[m],
              highestValue: hVotes.value,
              consensus: hVotes.consensus,
              votePassed: hVotes.votePassed,
              remainingVotes:
                +this.network?.activeNodeCount - hVotes.votePassed,
              result:
                +this.mimirs[m] === +hVotes.value ? 'Passed' : 'In Progress',
              votedValues: hVotes.values,
            })
            index++
          }
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
                    <td style="padding: 5px; text-align:left; color:#333;">${p.seriesName}</td>
                    <td style="padding: 5px; text-align:center; color:#333;">${p.value}</td>
                    <td style="padding: 5px; text-align:center; color:#333;">${consensus}</td>
                    <td style="padding: 5px; text-align:center; color:#333;">${votesNeeded}</td>
                  </tr>
                    
                `
              }
              return ''
            })
            .join('')}
        </tbody>
      </table>
      <hr style="margin: 10px 0; border: 1px solid #ddd;">
      <div style="text-align:center; font-size:12px; color:#333;">
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
            height: '90%',
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
            boundaryGap: ['20%', '40%'],
            axisLabel: {
              interval: 0,
              nameTextStyle: {
                padding: 20,
                margin: 20,
                align: 'right',
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
      nodes: 'getNodesData',
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
        this.mimirs = res.data
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
      if ((!voters || voters.length == 0) && !this.nodes) {
        return
      }
      const activeVoters = voters.filter((v) =>
        this.nodes
          ?.filter((n) => n.status == 'Active')
          .map((n) => n.node_address)
          .includes(v.signer)
      )
      const values = activeVoters.map((v) => v.value)
      const voteCount = _.countBy(values)
      const votesObj = Object.keys(voteCount).map((v, i) => ({
        value: v,
        count: voteCount[v],
        consensus: voteCount[v] / +this.network?.activeNodeCount,
      }))
      const hVote = _.maxBy(votesObj, (o) => o.consensus)
      return {
        consensus: hVote?.consensus ?? 0,
        votePassed: activeVoters?.length ?? 0,
        value: hVote?.value ?? '-',
        values: votesObj,
      }
    },
  },
  head: {
    title: 'THORChain Network Explorer | Mimir votes',
  },
}
</script>

<style lang="scss" scoped>
.card-container {
  height: 900px !important;
}

.data-color {
  margin-right: 6px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.tooltip-header {
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}

.tooltip-body {
  margin-top: 5px;
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
</style>
