<template>
  <div class="pendulum-view">
    <card class="network-balance-card" :is-loading="loading">
      <svg
        class="balance-svg"
        viewBox="40 0 220 180"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="148"
          y="30"
          width="4"
          height="125"
          rx="2"
          ry="2"
          fill="var(--primary-color)"
        />
        <rect
          x="145"
          y="125"
          width="10"
          height="50"
          rx="5"
          ry="5"
          fill="var(--border-color)"
        />
        <rect
          x="110"
          y="170"
          width="80"
          height="20"
          rx="2"
          ry="2"
          fill="var(--border-color)"
        />

        <g
          :transform="`translate(0, ${scalePosition * -1})`"
          transform-origin="150px 50px"
        >
          <line
            x1="78"
            :y1="50 - scalePosition"
            x2="150"
            y2="50"
            stroke="var(--primary-color)"
            stroke-width="4"
            stroke-linecap="round"
          />

          <line
            x1="80"
            :y1="50 - scalePosition"
            x2="60"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="80"
            :y1="50 - scalePosition"
            x2="100"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M 60 90 A 18 18 0 0 0 100 90"
            fill="var(--border-color)"
            stroke="var(--border-color)"
            stroke-width="2"
          />
          <text
            x="80"
            y="103"
            text-anchor="middle"
            font-size="10"
            fill="var(--sec-font-color)"
          >
            {{ effectiveBond | number('0a') }}
          </text>

          <rect
            x="55"
            y="125"
            width="48"
            height="18"
            fill="var(--gradient-left)"
            rx="5"
          />
          <text
            x="80"
            y="136"
            text-anchor="middle"
            font-size="8"
            fill="var(--sec-font-color)"
          >
            Security
          </text>
        </g>

        <g
          :transform="`translate(0, ${scalePosition})`"
          transform-origin="150px 50px"
        >
          <line
            x1="151"
            :y1="50 - scalePosition"
            x2="222"
            y2="50"
            stroke="var(--primary-color)"
            stroke-width="4"
            stroke-linecap="round"
          />

          <line
            x1="220"
            :y1="50"
            x2="200"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <line
            x1="220"
            :y1="50"
            x2="240"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
            stroke-linecap="round"
          />
          <path
            d="M 198 90 A 18 18 0 0 0 241 90"
            fill="var(--border-color)"
            stroke="var(--border-color)"
            stroke-width="2"
          />
          <text
            x="220"
            y="102"
            text-anchor="middle"
            font-size="10"
            fill="var(--sec-font-color)"
          >
            {{ totalAdjustedSecuredValue | number('0a') }}
          </text>

          <rect
            x="198"
            y="125"
            width="50"
            height="18"
            fill="var(--gradient-left)"
            rx="5"
          />
          <text
            x="222"
            y="135"
            text-anchor="middle"
            font-size="8"
            fill="var(--sec-font-color)"
          >
            Liquidity
          </text>
        </g>
      </svg>

      <div class="network-status">
        <span class="status-text">{{ networkState }}</span>
      </div>
      <div class="reward-summary">
        <span v-if="nodeShare > poolShare"
          >Security earning {{ nodeShare | percent(2) }} of rewards</span
        >
        <span v-else-if="poolShare > nodeShare"
          >Liquidity earning {{ poolShare | percent(2) }} of rewards</span
        >
        <span v-else>Equal reward distribution</span>
      </div>
    </card>
    <div class="metrics-grid">
      <Card class="metric-card bond-metric">
        <div class="metric-title">Total Active Bond</div>
        <div class="metric-value">
          <span>{{ effectiveBond | number('0,0') }} {{ runeCur() }}</span>
        </div>
      </Card>
      <Card class="metric-card secured-metric">
        <div class="metric-title">Total Secured Value</div>
        <div class="metric-value">
          <span
            >{{ totalAdjustedSecuredValue | number('0,0') }}
            {{ runeCur() }}</span
          >
        </div>
      </Card>
      <Card class="metric-card node-metric">
        <div class="metric-title">Node Reward Share</div>
        <div class="metric-value">{{ nodeShare | percent(2) }}</div>
      </Card>
      <Card class="metric-card pool-metric">
        <div class="metric-title">Pool Reward Share</div>
        <div class="metric-value">{{ poolShare | percent(2) }}</div>
      </Card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BalanceScale',
  data() {
    return {
      effectiveBond: 0,
      totalSecuredValue: 0,
      totalAdjustedSecuredValue: 0,
      pendulumAssetBasisPoints: 10000,
      animationActive: true,
      fixedRotation: 10,
      poolShare: 0,
      nodeShare: 0,
      loading: true,
      pendulumUseEffectiveSecurity: 0,
      usingAllNodesBond: true,
      adjustedBond: 0,
      networkState: '',
    }
  },
  computed: {
    scalePosition() {
      const maxTilt = 40
      const midpoint = 50

      const tiltPercentage = (this.nodeShare * 100 - midpoint) / midpoint

      return Math.max(Math.min(tiltPercentage * maxTilt, maxTilt), -maxTilt)
    },
  },
  mounted() {
    this.loadData()
    setTimeout(() => {
      this.fixedRotation = 0
      this.animationActive = false
    }, 5000)
  },
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.loadPoolsData(),
          this.loadNodesData(),
          this.loadMimirData(),
        ])
        this.calculateDependentValues()
        this.loading = false
      } catch (error) {
        console.error('Error loading data:', error)
        this.loading = false
      }
    },

    async loadNodesData() {
      try {
        const res = await this.$api.getNodes()
        const nodesData = res.data
        const activeNodes = nodesData.filter((node) => node.status === 'Active')

        if (this.pendulumUseEffectiveSecurity === 1) {
          activeNodes.sort(
            (a, b) => Number(b.total_bond) - Number(a.total_bond)
          )
          const splitIndex = Math.floor(activeNodes.length * (2 / 3))
          this.effectiveBond = activeNodes
            .slice(splitIndex)
            .reduce((sum, node) => sum + Number(node.total_bond) / 1e8, 0)
        } else {
          this.effectiveBond = activeNodes.reduce(
            (sum, node) => sum + Number(node.total_bond) / 1e8,
            0
          )
        }
      } catch (error) {
        console.error('Error fetching nodes data:', error)
      }
    },

    async loadPoolsData() {
      try {
        const res = await this.$api.getThorPools()
        const poolsData = res.data
        this.totalSecuredValue = poolsData.reduce(
          (sum, pool) => sum + Number(pool.balance_rune) / 1e8,
          0
        )
      } catch (error) {
        console.error('Error fetching pools data:', error)
      }
    },

    async loadMimirData() {
      try {
        const { data: mimirData } = await this.$api.getMimir()
        this.pendulumAssetBasisPoints = mimirData > 0 ? mimirData : 10000
      } catch (error) {
        console.error('Error fetching mimir data:', error)
      }
    },

    calculateDependentValues() {
      this.totalAdjustedSecuredValue =
        this.totalSecuredValue * (this.pendulumAssetBasisPoints / 10000)

      const effectiveBond = this.usingAllNodesBond
        ? this.effectiveBond
        : this.adjustedBond
      this.poolShare =
        (effectiveBond - this.totalAdjustedSecuredValue) / effectiveBond
      this.nodeShare = 1 - this.poolShare

      const nodeSharePct = this.nodeShare * 100
      if (Math.abs(nodeSharePct - 50) < 10) {
        this.networkState = 'Normal'
      } else if (nodeSharePct < 50) {
        this.networkState = 'Overbonded'
      } else {
        this.networkState = 'Underbonded'
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.pendulum-view {
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px 0;
}
.metric-card {
  display: flex;
  flex-direction: column;
  height: 120px;
  position: relative;
}

.metric-title {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
  font-size: 10px;
  @include sm {
    font-size: 14px;
  }
}

.metric-value {
  font-size: 19px;
  font-weight: bold;
  position: absolute;
  top: 50%;
  left: 15px;
  right: 15px;
  transform: translateY(-50%);
  text-align: center;
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--sec-font-color);
  @include md {
    font-size: 24px;
  }
}
.network-balance-card {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 10px;
}

.network-status {
  margin-top: 20px;
  text-align: center;
  padding: 10px 20px;
  border-radius: 0.5rem;
}

.status-text {
  color: var(--primary-color);
  font-size: 20px;
  font-weight: 700;
}

.reward-summary {
  text-align: center;
  background-color: var(--gradient-left);
  padding: 8px 16px;
  border-radius: 0.5rem;
  color: var(--sec-font-color);
  font-size: 10px;
  @include md {
    font-size: 14px;
  }
}

.balance-svg {
  transform: scale(1.2);
}
</style>
