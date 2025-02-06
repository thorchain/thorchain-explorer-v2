<template>
  <div class="pendulum-view">
    <card class="network-balance-card">
      <div class="balance-indicator">
        <div
          class="balance-arm"
          :style="{
            transform: `translateX(-50%) rotate(${armRotation}deg)`,
          }"
        >
          <div class="balance-pan security-pan">
            <div class="pan-label">Security</div>
            <div class="pan-value">
              <span>{{ activeNodes | number('0a') }}</span>
            </div>
          </div>
          <div class="balance-pan liquidity-pan">
            <div class="pan-label">Liquidity</div>
            <div class="pan-value">
              <span>{{ totalAdjustedSecuredValue | number('0a') }}</span>
            </div>
          </div>
        </div>
        <div class="balance-base"></div>
      </div>
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
      isLoading: true,
      pendulumUseEffectiveSecurity: 0,
      usingAllNodesBond: true,
      adjustedBond: 0,
      networkState: '',
    }
  },
  computed: {
    armRotation() {
      if (this.animationActive) {
        const activeWeight = this.activeNodes
        const pooledWeight = this.totalAdjustedSecuredValue
        const balance = pooledWeight - activeWeight
        return balance > 0
          ? Math.min(balance * 0.5 + 10, 15)
          : Math.max(balance * 0.5, -15)
      }
      return 8
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
        this.isLoading = false
      } catch (error) {
        console.error('Error loading data:', error)
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

      console.log('poolShare:', this.poolShare, 'nodeShare:', this.nodeShare)
    },
  },
}
</script>

<style lang="scss" scoped>
.pendulum-view {
  max-width: 800px;
  width: 95%;
  margin: 0 auto;
  padding: 20px;
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
}

.metric-value {
  font-size: 24px;
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
}
.network-balance-card {
  padding: 30px;
  background-color: var(--card-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 10px;
  margin: 20px;
}

.balance-indicator {
  width: 100%;
  max-width: 300px;
  height: 200px;
  position: relative;
  margin-bottom: 20px;
}

.balance-arm {
  width: calc(100% - 20px);
  max-width: 280px;
  height: 8px;
  background-color: var(--primary-color);
  position: absolute;
  top: 50px;
  left: 50%;
  transform-origin: center;
  transition: transform 0.3s ease;
  border-radius: 4px;
}

.balance-pan {
  width: 100px;
  height: 40px;
  background-color: var(--border-color);
  border-radius: 0 0 40px 40px;
  position: absolute;
  top: 58px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid var(--border-color);
}

.pan-label {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--gradient-left);
  padding: 2px 12px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
  color: var(--sec-font-color);
}

.pan-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--sec-font-color);
}

.security-pan {
  left: -50px;
}

.liquidity-pan {
  right: -50px;
}

.balance-base {
  width: 8px;
  height: 140px;
  background-color: var(--primary-color);
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 4px;
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
}
</style>
