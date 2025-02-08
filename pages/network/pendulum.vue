<template>
  <div class="pendulum-view">
    <card class="network-balance-card" :is-loading="loading">
      <svg
        class="balance-svg"
        viewBox="50 0 200 180"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="145"
          y="125"
          width="10"
          height="50"
          fill="var(--primary-color)"
        />
        <rect
          x="148"
          y="40"
          width="4"
          height="125"
          fill="var(--primary-color)"
        />

        <g :transform="'rotate(' + scalePosition + ' 200 50)'">
          <line
            x1="80"
            y1="50"
            x2="220"
            y2="50"
            stroke="var(--primary-color)"
            stroke-width="4"
          />

          <circle cx="150" cy="50" r="6" fill="var(--primary-color)" />

          <line
            x1="100"
            y1="50"
            x2="100"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
          />
          <path
            d="M 82 90 A 18 18 0 0 0 118 90"
            fill="var(--border-color)"
            stroke="var(--border-color)"
            stroke-width="2"
          />
          <text
            x="100"
            y="102"
            text-anchor="middle"
            font-size="10"
            fill="var(--sec-font-color)"
          >
            {{ activeNodes | number('0a') }}
          </text>

          <rect
            x="80"
            y="125"
            width="48"
            height="18"
            fill="var(--gradient-left)"
            rx="5"
          />
          <text
            x="105"
            y="136"
            text-anchor="middle"
            font-size="8"
            fill="var(--sec-font-color)"
          >
            Security
          </text>

          <line
            x1="200"
            y1="50"
            x2="200"
            y2="90"
            stroke="var(--primary-color)"
            stroke-width="2"
          />
          <path
            d="M 182 90 A 18 18 0 0 0 218 90"
            fill="var(--border-color)"
            stroke="var(--border-color)"
            stroke-width="2"
          />
          <text
            x="200"
            y="102"
            text-anchor="middle"
            font-size="10"
            fill="var(--sec-font-color)"
          >
            {{ totalAdjustedSecuredValue | number('0a') }}
          </text>

          <rect
            x="200"
            y="125"
            width="50"
            height="18"
            fill="var(--gradient-left)"
            rx="5"
          />
          <text
            x="225"
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
          <span>{{ activeNodes | number('0,0') }}</span>
        </div>
      </Card>
      <Card class="metric-card secured-metric">
        <div class="metric-title">Total Secured Value</div>
        <div class="metric-value">
          <span>{{ totalAdjustedSecuredValue | number('0,0') }}</span>
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
      activeNodes: 0,
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
      scalePosition: 0,  
    }
  },
  computed: {
    calculateScalePosition() {
      const maxTilt = 30
      const midpoint = 50

      const tiltPercentage = (this.nodeShare * 100 - midpoint) / midpoint

      this.scalePosition = Math.max(
        Math.min(tiltPercentage * maxTilt, maxTilt),
        -maxTilt
      )
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
        await Promise.all([this.loadPoolsData(), this.loadNodesData(), this.loadMimirData()])
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
          this.activeNodes = activeNodes
            .slice(splitIndex)
            .reduce((sum, node) => sum + Number(node.total_bond) / 1e8, 0)
        } else {
          this.activeNodes = activeNodes.reduce(
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
        ? this.activeNodes
        : this.adjustedBond
      this.poolShare =
        (effectiveBond - this.totalAdjustedSecuredValue) / effectiveBond
      this.nodeShare = 1 - this.poolShare

      if (Math.abs(this.nodeShare - 50) < 10) {
        this.networkState = 'Normal'
      } else if (this.nodeShare < 50) {
        this.networkState = 'Overbonded'
      } else {
        this.networkState = 'Underbonded'
      }

      this.calculateScalePosition()
    },
  },
}
</script>


<style lang="scss" scoped>
.pendulum-view {
  max-width: 800px;
  width: 95%;
  margin: 0 auto;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  padding: 20px;
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
</style>
