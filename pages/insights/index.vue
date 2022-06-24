<template>
  <Page>
    <Card title="⏰ Churn History" :isLoading="!churnHistory">
      <vue-good-table
        v-if="churnHistory"
        :columns="cols"
        :rows="churnHistory"
        styleClass="vgt-table net-table bordered"
        :pagination-options="{
          enabled: true,
          perPage: 30,
          perPageDropdownEnabled: false,
        }"
      >
        <template slot="table-row" slot-scope="props">
          <span v-if="props.column.field == 'timestamp'">
            {{timeFormat(props.row.timestamp)}}
            <span style="font-size: .75rem;">
              ({{fromNow(props.row.timestamp)}})
            </span> 
          </span>
          <span v-else>
            {{props.formattedRow[props.column.field]}}
          </span>
        </template>
      </vue-good-table>
      <span class="footer">
        Powered By <strong>Multipartite</strong>
      </span>
    </Card>
    <Card :isLoading="!option" title="🔒 Total Value Locked (from Flipside)">
      <VChart v-if="option" class="chart" :option="option" :loading="!option" :autoresize="true"></VChart>
    </Card>
  </Page>
</template>

<script>
import moment from "moment";
import { momentTimeFormat, runeCur } from '~/utils';

import { use } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from "echarts/components";
import VChart from "vue-echarts";

use([
  SVGRenderer,
  GridComponent,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
]);

export default {
  components: {
    VChart
  },
  data() {
    return {
      churnHistory: undefined,
      cols: [
        {
          label: 'Churn Occurred',
          field: 'timestamp',
        },
        {
          label: 'Block ID',
          field: 'BLOCK_ID',
          type: 'number',
          tdClass: 'mono',
          formatFn: this.normalFormat
        },
        {
          label: 'Churn Length (days)',
          field: 'DAYS_SINCE_LAST_CHURN',
          type: 'number',
          tdClass: 'mono',
        }
      ],
      option: undefined
    }
  },
  mounted() {
    this.$api.getChurnHistory().then(({data}) => {
      this.churnHistory = data.map(d => ({...d, timestamp: moment(d.BLOCK_TIMESTAMP)}));;
    }).catch(e => {
      console.error(e);
    }) 

    this.$api.getFlipTVL().then(({data}) => {
      this.flipTVLFormat(data);
    }).catch(e => {
      console.error(e);
    })
  },
  methods: {
    timeFormat(time) {
      return momentTimeFormat(time)
    },
    fromNow(time) {
      return moment(time)?.fromNow();
    },
    flipTVLFormat: function(d) {
      let xAxis = [];
      let tvp = [];
      let tvl = [];
      let tvb = [];
      d.forEach(interval => {
        xAxis.push(interval.DAY);
        tvp.push(interval.TOTAL_VALUE_POOLED);
        tvl.push(interval.TOTAL_VALUE_LOCKED);
        tvb.push(interval.TOTAL_VALUE_BONDED);
      });

      let option = {
        title: {
          show: false,
        },
        tooltip: {
          trigger: "axis",
          valueFormatter: (value) => `${this.normalFormat(value)} ${runeCur()}`
        },
        legend: {
          left: 'bottom'
        },
        xAxis: {
          data: xAxis.reverse(),
          splitLine: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              color: '#9f9f9f'
            }
          },
          axisLabel: {
            color: '#9f9f9f',
            fontFamily: 'ProductSans',
          }
        },
        yAxis: {
          show: false,
          splitLine: {
            show: false
          }
        },
        series: [
          {
            type: 'line',
            name: 'Total Value Locked (In Rune)',
            showSymbol: false,
            data: tvl.reverse(),
            smooth: true
          },
          {
            type: 'line',
            name: 'Total Value Pooled (In Rune)',
            showSymbol: false,
            data: tvp.reverse(),
            smooth: true
          },
          {
            type: 'line',
            name: 'Total Value Bonded (In Rune)',
            showSymbol: false,
            data: tvb.reverse(),
            smooth: true
          }
        ]
      };

      this.option = option;
    },
  }
}
</script>

<style lang="scss">
.footer {
  display: block;
  margin: 1rem 0 .3rem .5rem;
}

.echarts {
  width: 100%;
  height: 400px; 
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: .8rem;
  padding: 0 .1rem;

  .legend-fill {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .value {
    font-weight: bold;
    margin-left: 5px;
  }
}
</style>