<template>
  <div class="chart-wrapper volume-chart">
    <div class="chart-header">Volume</div>
    <div v-show="chartSettings" class="chart-legends">
      <div class="legend-wrapper">
        <div class="legend-header" style="background-color: rgb(255, 177, 78)"></div>
        Total
      </div>
      <div class="legend-wrapper">
        <div class="legend-header" style="background-color: rgb(54, 176, 121)"></div>
        Rune Volume
      </div>
      <div class="legend-wrapper">
        <div class="legend-header" style="background-color: rgb(234, 95, 148)"></div>
        Asset Volume
      </div>
    </div>
    <div v-show="chartSettings" class="chart"></div>
    <div v-if="!chartSettings" class="skeleton-placeholder">
      <BounceLoader color="var(--font-color)" size="2rem"/>
    </div>
  </div>
</template>

<script>
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { mapGetters } from 'vuex';
import BounceLoader from 'vue-spinner/src/BounceLoader.vue';
const Spline = require('cubic-spline');

export default {
  name: 'chartComponent',
  props: {
    chartSettings: Array | Object
  },
  data() {
    return {
      uPlot: null,
      opts: undefined,
    }
  },
  components: {
    BounceLoader
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  methods: {
    getSize() {
      if (document.querySelector('.volume-chart .chart .uplot')) {
        document.querySelector('.volume-chart .chart .uplot').style.display = "none";
      }
      const chartWrapper = document.querySelector('.volume-chart.chart-wrapper');
      const chartWidth = chartWrapper.offsetWidth - 36;
      if (document.querySelector('.volume-chart .chart .uplot')) {
        document.querySelector('.volume-chart .chart .uplot').style.display = "block";
      }
      //TODO: change fixed width with relative size
      return {
        width: chartWidth,
        height: 340
      }
    },
    fillData() {
      let time = [];
      let total = [];
      let rune = [];
      let assets = [];

      this.chartSettings?.intervals.forEach(interval => {
        time.push(+interval.time);
        total.push((+interval.combined.volumeInRune) / 10**8)
        rune.push((+interval.toRune.volumeInRune) / 10**8)
        assets.push((+interval.toAsset.volumeInRune) / 10**8)
      });

      //Data smoothing
      const splineTotal = new Spline(time, total);
      const splineRune = new Spline(time, rune);
      const splineAssets = new Spline(time, assets);
      let rtime = []
      let rtotal = []
      let rrune = []
      let rassets = []
      for(let i in time) {
        if (time.length - 1 == i)
          continue
        for (let j = 0; j < 6; j++) {
          let t = splineTotal.at(time[i] + (j*600))
          let r = splineRune.at(time[i] + (j*600))
          let a = splineAssets.at(time[i] + (j*600))
          rtime.push(time[i] + (j*600))
          rtotal.push(t)
          rrune.push(r)
          rassets.push(a)
        }
      }

      let data = [rtime, rtotal, rrune, rassets];

      this.uPlot  = new uPlot(this.opts, data, document.querySelector('.volume-chart .chart'));
    },
    checkWidth(el, chartWidth, cursor) {
      let width = el.getBoundingClientRect().width;
      
      return cursor.left + width < chartWidth ? false : true;
    },
    tooltipGenerator(u, idx) {
      let tooltip = document.querySelector('.volume-chart .tooltip');
      tooltip.innerHTML = '';
      let dc = uPlot.fmtDate('{h}:{mm} {AA} {YYYY}/{MM}/{DD}')
      let vals = [u.data[0][idx], u.data[1][idx], u.data[2][idx], u.data[3][idx]]
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
            <span class='value'>${this.$options.filters.currency(v * this.runePrice, '$', 0)}</span>
          `
        }
        tooltip.appendChild(d);
      })
    },
    update(u) {
      const { left, top, idx } = u.cursor;
      let tooltip = document.querySelector('.volume-chart .tooltip');
      
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

      //TODO: delete extra legendEls
      function init(u, opts) {
        //deleting legend
        legendEl = u.root.querySelector(".volume-chart .u-legend");
        legendEl.remove();
        
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
    }
  },
  mounted() {
    const { spline } = uPlot.paths;

    this.opts = {
      ...this.getSize(),
      // tzDate: ts => uPlot.tzDate(new Date(ts * 1e3), 'Etc/UTC'),
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
          stroke: "var(--font-color)",
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
        {
          label: "Total",
          stroke: "rgb(255, 177, 78)",
          fill: "rgb(255, 177, 78, .1)",
          width: 2,
          points: {
            show: false
          },
          paths: spline(),
        },
        {
          label: "Asset Volume",
          stroke: "rgb(234, 95, 148)",
          fill: "rgb(234, 95, 148, .1)",
          width: 2,
          points: {
            show: false
          },
          paths: spline(),
        },
        {
          label: "RUNE Volume",
          stroke: "rgb(54, 176, 121)",
          fill: "rgb(54, 176, 121, .1)",
          width: 2,
          points: {
            show: false
          },
          paths: spline(),
        },
      ],
    };

    this.chartSettings && this.uPlot? this.fillData() : console.log('data not yet reached');

    function throttle(cb, limit) {
      var wait = false;

      return () => {
        if (!wait) {
          requestAnimationFrame(cb);
          wait = true;
          setTimeout(() => {
            wait = false;
          }, limit);
        }
      }
    }

    window.addEventListener("resize", e => {
      this.uPlot.setSize(this.getSize());
    });
  },
  watch: {
    chartSettings: function() {
      //TODO: find better way maybe!
      this.fillData();
    }
  }
}
</script>

<style lang="scss">
.chart-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  border-radius: 5px;
  border: 1px solid var(--border-color);
  padding: 1rem;
  height: 400px;

  .chart-header {
    color: var(--sec-font-color);
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
  background: rgb(46, 46, 46);
  color: var(--sec-font-color);

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