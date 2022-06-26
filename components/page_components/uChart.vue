<template>
  <div class="chart-wrapper" :class="[name]">
    <h3 class="chart-header" v-if="chartSettings">{{chartSettings && chartSettings.header}}</h3>
    <div class="chart-legends">
      <div class="legend-wrapper" v-for="(d, i) in chartSettings && chartSettings.datum.slice(1)" :key="i">
        <div class="legend-header" :style="{backgroundColor: d.color}"></div>
        {{d.name | capitalize}}
      </div>
    </div>
    <div class="chart"></div>
    <div v-if="!chartSettings" class="skeleton-placeholder">
      <BounceLoader color="var(--font-color)" size="2rem"/>
    </div>
  </div>
</template>

<script>
import { AssetCurrencySymbol } from '@xchainjs/xchain-util';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'uChart',
  props: {
    name: {
      type: String,
      default: 'uChart'
    },
    chartSettings: Array | Object
  },
  data() {
    return {
      uPlot: null
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme'
    })
  },
  components: {
    BounceLoader
  },
  methods: {
    getSize() {
      if (document.querySelector(`.${this.name} .chart .uplot`)) {
        document.querySelectorAll(`.uplot`).forEach(e => e.style.display = "none");
      }
      const chartWrapper = document.querySelector(`.${this.name}.chart-wrapper`);
      const chartWidth = chartWrapper?.offsetWidth - 36;
      if (document.querySelector(`.${this.name} .chart .uplot`)) {
        document.querySelectorAll(`.uplot`).forEach(e => e.style.display = "block");
      }
      //TODO: change fixed width with relative size
      return {
        width: chartWidth,
        height: 340
      }
    },
    fillData() {
      try {
        let data = []
        this.chartSettings?.datum?.forEach(e => {
          data.push(e.data)
        })
        this.uPlot.setData(data);
      }
      catch (e) {
        console.error(e)
      }
    },
    tooltipGenerator(u, idx) {
      let tooltip = document.querySelector(`.${this.name} .tooltip`);
      tooltip.innerHTML = '';
      let dc = uPlot.fmtDate('{YYYY}/{MM}/{DD}');
      let vals = []
      u.data?.forEach(d => {
        vals.push(d[idx])
      })
      vals.forEach((v, id) => {
        let d = document.createElement('div');
        d.classList.add('legend-item');
        if (id == 0) {
          let dt = new Date(Number.parseInt(v) * 1000);
          d.innerHTML = `
            <span class='value'>${dc(dt)}</span>
          `
        }
        else {
          d.innerHTML = `
            <div class='legend-fill' style='background-color: ${u.series[id]._stroke}; display: inline-block;'></div>
            <span>${u.series[id].label}</span>
            <span class='value'>${this.$options.filters.currency(v, this.chartSettings?.datum[id]?.inRune?AssetCurrencySymbol.RUNE:'$', 0)}</span>
          `
        }
        tooltip.appendChild(d);
      })
    },
    checkWidth(el, chartWidth, cursor) {
      let width = el.getBoundingClientRect().width;
      
      return cursor.left + width + 10 < chartWidth ? false : true;
    },
    update(u) {
      const { left, top, idx } = u.cursor;
      let tooltip = document.querySelector(`.${this.name} .tooltip`);
      
      let res = this.checkWidth(tooltip, u.width, u.cursor)
      if(res) {
        let tooltipWidth = tooltip.getBoundingClientRect().width;
        tooltip.style.transform = "translate(" + (left - tooltipWidth - 10) + "px, " + (top + 5) + "px)";
      }
      else {
        tooltip.style.transform = "translate(" + (left + 10) + "px, " + (top + 5) + "px)";
      }

      if (idx) {
        // console.log(u.data[0][idx], u.data[1][idx], u.data[2][idx], u.data[3][idx])
        this.tooltipGenerator(u, idx);
      }
    },
    legendAsTooltipPlugin() {
      let legendEl;
      let tooltip;
      let name = this.name;

      //TODO: delete extra legendEls
      function init(u, opts) {
        //deleting legend
        legendEl = u.root.querySelector(`.${name} .u-legend`);
        legendEl?.remove();
        
        const overEl = u.over;
        overEl.style.overflow = "visible";

        //tooltip
        tooltip = document.createElement("div");
        tooltip.classList.add('tooltip');
        tooltip.style.display = "none";

        // move legend into plot bounds
        overEl.appendChild(tooltip);

        // show/hide tooltip on enter/exit
        overEl.addEventListener("mouseenter", () => {tooltip.style.display = "block";});
        overEl.addEventListener("mouseleave", () => {tooltip.style.display = "none";});
      }

      return {
        hooks: {
          init: init,
          setCursor: this.update,
        }
      };
    },
    chartInit() {
      const { spline, bars } = uPlot.paths;

      let opts = {
        ...this.getSize(),
        tzDate: ts => uPlot.tzDate(new Date(ts * 1e3), 'Etc/UTC'),
        plugins: [
          this.legendAsTooltipPlugin()
        ],
        focus: {
          alpha: 0.3
        },
        cursor: {
          focus: {
            prox: 10,
          }
        },
        axes: [
          {
            show: true,
            labelFont: "bold 9px ProductSans",
            font: '12px ProductSans',
            stroke: this.theme === 'dark' ? "#9F9F9F":"#000",
            grid: {
              show: false,
            },
            ticks: {
              show: false,
            },
            values: [
              [3600, "{M}/{D}/{YY}", null, null, null, null, null, null, 1],
              [60, "{M}/{D}/{YY}", null, null, null, null, null, null, 1],
            ],
          },
          {
            show: false
          }
        ],
        scales: {
          x: {
            time: true
          },
          y: {
          }
        },
        series: [
          {},
        ],
      };

      this.chartSettings?.datum?.slice(1).forEach(e => {
        opts.series.push({
          label: e.label,
          stroke: e.color,
          fill: e.fill,
          width: 1,
          points: {
            show: false
          },
          paths: e.mode === 'spline'? spline():bars()
        })
      })

      this.uPlot = new uPlot(opts, null, document.querySelector(`.${this.name} .chart`));
      let uPlotChart = this.uPlot;
      this.fillData();

      window.addEventListener("resize", e => {
        uPlotChart.setSize(this.getSize());
      });
    }
  },
  watch: {
    chartSettings: function() {
      this.chartInit();
    }
  },
  mounted() {
    if (this.chartSettings) {
      this.chartInit();
    }
  }
}
</script>

<style lang="scss">
.chart-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-width: 1px 0 1px 0;
  height: 470px;

  .chart-header {
    padding: 1rem;
    font-size: 1.125rem;
    margin: 0;
    color: var(--sec-font-color);
    border-bottom: 1px solid var(--border-color);
  }

  @include lg {
    border-width: 1px;
    border-radius: 5px;
  }
}

.tooltip {
  display: none;
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  display: none;

  display: flex;
  flex-direction: column;
  padding: .2rem;
  background: var(--sidebar);
  color: var(--sec-font-color);
  border: 1px solid var(--border-color);

  .legend-item {
    display: flex;
    align-items: center;
    font-size: .7rem;
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
}

.chart-legends {
  margin: 10px 0 -20px 1rem;
}

.legend-wrapper {
  display: inline-flex;
  align-items: center;
  color: var(--sec-font-color);
  font-size: .8rem;
  margin: 0 .3rem;

  &:first-of-type {
    margin-left: 0;
  }

  .legend-header {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 5px;
  }
}

.skeleton-placeholder {
  display: flex;
  flex: 1 0;
  justify-content: center;
  align-items: center;
  margin-top: 1rem;
}
</style>