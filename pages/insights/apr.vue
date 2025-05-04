<template>
  <Card title="Historical Pool APR">
    <div class="pool-nav-wrapper">
      <div>
        <span>Pool:</span>
        <Select :options="poolOptions" :option.sync="poolOption" name="pool">
          <template>
            <span class="overflow-label">{{ poolOption.label }}</span>
          </template>
        </Select>
      </div>
      <div>
        <span>Period:</span>
        <Select
          :options="periodOptions"
          :option.sync="periodOption"
          name="period"
        />
      </div>
    </div>
    <div class="chart-wrapper">
      <VChart
        :option="aprChart"
        :loading="aprLoading"
        :autoresize="true"
        :loading-options="showLoading"
        :theme="chartTheme"
      />
    </div>
  </Card>
</template>

<script>
import { compact } from 'lodash'

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

import moment from 'moment'

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
      periodOption: {
        label: '30 days',
        value: 30,
      },
      periodOptions: [
        {
          label: '30 days',
          value: 30,
        },
        {
          label: '60 days',
          value: 60,
        },
        {
          label: '90 days',
          value: 90,
        },
        {
          label: '180 days',
          value: 180,
        },
      ],
      poolOption: {
        label: 'BTC.BTC',
        value: 'BTC.BTC',
      },
      poolOptions: [],
      aprChart: undefined,
      aprLoading: true,
    }
  },
  watch: {
    poolOption(val) {
      this.calPoolAPR()
    },
    periodOption(val) {
      this.calPoolAPR()
    },
  },
  mounted() {
    this.$api.getPools().then(({ data }) => {
      this.poolOptions = compact(
        data.map((p) => {
          if (p.status !== 'available') {
            return false
          }
          return {
            value: p.asset,
            label: p.asset,
          }
        })
      )
    })

    this.calPoolAPR()
  },
  methods: {
    calPoolAPR() {
      this.aprLoading = true
      this.getDepth(this.poolOption.value, this.periodOption.value).then(
        (result) => {
          this.aprLoading = false
          this.aprFormat(result)
        }
      )
    },
    async getDepth(p, c) {
      let now = (await this.$api.getPoolDepth(p, 365)).data.intervals
      const then = (
        await this.$api.getPoolDepth(
          p,
          365,
          moment(~~now[0].startTime * 1e3)
            .subtract(c, 'days')
            .unix()
        )
      ).data.intervals.reverse()
      now = now.reverse()

      const aprs = []
      if (now) {
        for (let i = 0; i < then.length - 1; i++) {
          const firstLuvi = then[i]?.luvi
          const secondLuvi = now[i]?.luvi

          // calculating APR
          const increase = (100 * (secondLuvi - firstLuvi)) / firstLuvi
          const apr = (365 * increase) / c
          aprs.unshift({
            increase: apr,
            time: moment(now[i].startTime * 1e3).format('MM/DD/YYYY'),
          })
        }
      }
      return aprs
    },
    aprFormat(d) {
      const xAxis = []
      const apr = []
      d.forEach((t) => {
        xAxis.push(t.time)
        apr.push(t.increase)
      })

      const option = {
        title: {
          show: false,
        },
        tooltip: {
          confine: true,
          trigger: 'axis',
          valueFormatter: (value) => `${value.toFixed(2)} %`,
        },
        legend: {
          x: 'center',
          y: 'bottom',
          icon: 'rect',
          textStyle: {
            color: 'var(--font-color)',
          },
        },
        xAxis: {
          data: xAxis,
          boundaryGap: false,
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f',
            },
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans',
          },
        },
        yAxis: {
          show: false,
        },
        grid: {
          left: '20px',
          right: '20px',
        },
        series: [
          {
            type: 'line',
            name: 'APR (In percentage)',
            showSymbol: false,
            data: apr,
            smooth: true,
            areaStyle: {},
          },
        ],
      }

      this.aprChart = option
    },
  },
}
</script>

<style lang="scss" scoped>
.pool-nav-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;

  > div {
    display: flex;
    align-items: center;
    gap: 10px;
  }
}

.chart-wrapper {
  padding: $space-16 $space-0;
}

.overflow-label {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
