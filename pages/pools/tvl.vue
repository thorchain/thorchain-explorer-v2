<template>
  <div class="container-page">
    <Card>
      <VChart v-if="tvlOption" class="chart" :option="tvlOption" :loading="!tvlOption" :autoresize="true" />
    </Card>
  </div>
</template>

<script>
import moment from 'moment'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { mapGetters } from 'vuex'
import VChart from 'vue-echarts'

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'TVLPool',
  components: {
    VChart
  },
  data () {
    return {
      tvlOption: undefined
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  mounted () {
    this.updateDatum()
  },
  methods: {
    async updateDatum () {
      const { data: { intervals = [] } } = await this.$api.tvlHistory()

      const pools = {}
      const xAxis = []
      for (let i = 0; i < intervals.length; i++) {
        intervals[i]?.poolsDepth.forEach((pd) => {
          if (+pd.totalDepth === 0) {
            return
          }

          const poolUSD = (pd.totalDepth / 1e8) * this.runePrice

          if (pd.pool in pools) {
            pools[pd.pool].data.push(poolUSD)
          } else {
            pools[pd.pool] = {
              name: pd.pool,
              type: 'line',
              stack: 'total',
              lineStyle: {
                color: this.getAssetColor(pd.pool)
              },
              areaStyle: {
                color: this.getAssetColor(pd.pool)
              },
              emphasis: {
                areaStyle: {
                  color: this.getAssetColor(pd.pool)
                }
              },
              data: [poolUSD]
            }
          }
        })

        xAxis.push(
          moment(
            Math.floor((~~intervals[i].endTime + ~~intervals[i].startTime) / 2) * 1e3
          ).format('YY/MM/DD')
        )
      }

      const seriesPools = Object.values(pools)
      this.tvlOption = this.basicChartFormat('', seriesPools, xAxis)
    }
  }
}
</script>

<style>
.echarts {
  width: 100%;
  height: 400px;
}
</style>
