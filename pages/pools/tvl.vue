<template>
  <div class="container-page tvl-page">
    <Card :is-loading="!tvlOption">
      <VChart
        v-if="tvlOption"
        class="chart"
        :option="tvlOption"
        :loading="!tvlOption"
        :autoresize="true"
        :theme="chartTheme"
      />
    </Card>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components'
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'
import { assetFromString } from '@xchainjs/xchain-util'
import { sortBy, orderBy } from 'lodash'

use([
  SVGRenderer,
  GridComponent,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
])

export default {
  name: 'TVLPool',
  components: {
    VChart,
  },
  data() {
    return {
      tvlOption: undefined,
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  mounted() {
    this.updateDatum()
  },
  methods: {
    async updateDatum() {
      const {
        data: { intervals = [] },
      } = await this.$api.getTVLHistory()

      const pools = {}
      const xAxis = []
      for (let i = 0; i < intervals.length; i++) {
        const s = sortBy(intervals[i]?.poolsDepth, [
          (o) => +o.totalDepth,
        ]).reverse()

        s.forEach((pd) => {
          if (+pd.totalDepth === 0) {
            return
          }

          const { chain } = assetFromString(pd.pool)
          if (chain === 'BNB') {
            return
          }
          const poolUSD = (+pd.totalDepth / 1e8) * +intervals[i].runePriceUSD
          const chainColor = this.getChainColor(chain)

          if (chain in pools) {
            if (i + 1 === pools[chain].data.length) {
              const beforeUSD = pools[chain].data[i]
              pools[chain].data.splice(i, 1, beforeUSD + poolUSD)
            } else {
              pools[chain].data.push(poolUSD)
            }
          } else if (i > 0) {
            pools[chain] = {
              name: chain,
              type: 'bar',
              stack: 'Total',
              showSymbol: false,
              symbol: 'circle',
              areaStyle: {
                color: chainColor,
              },
              lineStyle: {
                color: chainColor,
              },
              itemStyle: {
                color: chainColor,
              },
              data: new Array(i).fill(0).concat([poolUSD]),
              smooth: true,
            }
          } else {
            pools[chain] = {
              name: chain,
              type: 'bar',
              stack: 'Total',
              showSymbol: false,
              symbol: 'circle',
              areaStyle: {
                color: chainColor,
              },
              lineStyle: {
                color: chainColor,
              },
              itemStyle: {
                color: chainColor,
              },
              data: [poolUSD],
              smooth: true,
            }
          }
        })

        xAxis.push(
          moment(
            Math.floor(
              (~~intervals[i].endTime + ~~intervals[i].startTime) / 2
            ) * 1e3
          ).format('YY/MM/DD')
        )
      }

      const seriesPools = Object.values(pools)

      const formatter = (param) => {
        const pds = orderBy(param, ['value'], ['desc'])
        return `
          <div class="tooltip-header">
            ${param[0].axisValue}
          </div>
          ${pds
            .map(
              (p) => `
            <div class="tooltip-body">
              <div class="tooltip-item">
                <div class="data-color" style="background-color: ${p.color}"></div>
                <span>${p.seriesName}</span>
              </div>
              <b>$${this.$options.filters.number(p.value, '0,0.00 a')}</b>
            </div>
          `
            )
            .join('')}
          <hr>
          <div class="tooltip-item space">
            <div style="display: flex; align-items: center;">
              <span>Total</span>
            </div>
            <b>$${this.$options.filters.number(
              pds.reduce((a, b) => a + b.value, 0),
              '0,0.00 a'
            )}</b>
          </div>
        `
      }

      this.tvlOption = this.basicChartFormat(
        undefined,
        seriesPools,
        xAxis,
        {
          legend: {
            type: 'scroll',
            pageIconColor: 'var(--primary-color)',
            icon: 'rect',
            textStyle: {
              color: 'var(--sec-font-color)',
            },
          },
        },
        formatter
      )
    },
  },
  head: {
    title: 'THORChain Network Explorer | TVL',
  },
}
</script>

<style lang="scss">
.tvl-page {
  .echarts {
    width: 100%;
    height: 400px;
  }

  .tooltip-body {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
