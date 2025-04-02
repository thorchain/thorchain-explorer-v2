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
            {{ effectiveBond | number('0.0a') }}
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
            x="79"
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
            {{ adjustedSecuredTotal | number('0.0a') }}
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
            x="223"
            y="137"
            text-anchor="middle"
            font-size="8"
            fill="var(--sec-font-color)"
          >
            Liquidity
          </text>
        </g>
      </svg>

      <div class="network-status">
        <span class="status-text">{{ currentNetworkState }}</span>
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
    <div class="balance-details">
      <cards-header :table-general-stats="generalStatsDetails" />
      <hr class="info-hr" />
      <cards-header :table-general-stats="securityStats" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'BalanceScale',
  data() {
    return {
      securityBudgetBottomTwoThirds: undefined,
      effectiveBond: undefined,
      totalSecuredValue: undefined,
      adjustedSecuredTotal: undefined,
      assetBalancePoints: 10000,
      isAnimationActive: true,
      Rotation: 10,
      totalVaultValue: undefined,
      poolShare: undefined,
      nodeShare: undefined,
      loading: true,
      pendulumUseEffectiveSecurity: undefined,
      usingAllNodesBond: true,
      adjustedBond: undefined,
      currentNetworkState: '',
      generalStatsDetails: [
        {
          name: 'Total Active Bond',
        },
        {
          name: 'Total Secured Value',
        },
        {
          name: 'Node Reward Share',
        },
        {
          name: 'Pool Reward Share',
        },
      ],
      securityStats: [
        {
          name: 'Total Vault Value',
        },
        {
          name: 'Security Budget',
          description:
            'Total bond of the bottom 2/3 of the nodes in the network',
        },
        {
          name: 'Security Delta',
        },
      ],
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    scalePosition() {
      const maxTilt = 15
      const midpoint = 50

      const tiltPercentage = (this.nodeShare * 100 - midpoint) / midpoint

      return Math.max(Math.min(tiltPercentage * maxTilt, maxTilt), -maxTilt)
    },
  },
  mounted() {
    this.loadData()
    setTimeout(() => {
      this.Rotation = 0
      this.isAnimationActive = false
    }, 5000)
  },
  methods: {
    async loadData() {
      try {
        await Promise.all([
          this.loadPoolsData(),
          this.loadNodesData(),
          this.loadMimirData(),
          this.fetchVaultData(),
        ])
        this.calculateValues()
        this.loading = false
        this.updateStatsDetails()
      } catch (error) {
        console.error('Error loading data:', error)
        this.loading = false
      }
    },

    async fetchVaultData() {
      try {
        const vaultsResponse = await this.$api.getAsgard()
        const vaults = vaultsResponse.data

        const { data: pools } = await this.$api.getThorPools()

        const assetPrices = pools.reduce((prices, pool) => {
          prices[pool.asset] = +pool.balance_rune / +pool.balance_asset
          return prices
        }, {})

        const assets = new Map()
        vaults.forEach((vault) => {
          vault.coins.forEach((coin) => {
            const currentAmount = assets.get(coin.asset)?.amount || 0
            assets.set(coin.asset, {
              amount: currentAmount + +coin.amount,
              asset: coin.asset,
            })
          })
        })

        const vaultAssets = Array.from(assets.values()).map((asset) => {
          const amountInBase = asset.amount / 1e8
          const assetPrice = assetPrices[asset.asset] || 0
          const runeValue = amountInBase * assetPrice

          return {
            asset: asset.asset,
            amount: amountInBase,
            runeValue,
          }
        })

        this.totalVaultValue = vaultAssets.reduce(
          (sum, asset) => sum + asset.runeValue,
          0
        )
      } catch (error) {
        console.error('Error fetching vault data:', error)
      }
    },

    async loadNodesData() {
      try {
        const res = await this.$api.getNodes()
        const nodesData = res.data
        const activeNodes = nodesData.filter((node) => node.status === 'Active')

        activeNodes.sort((a, b) => Number(b.total_bond) - Number(a.total_bond))

        const cutoffIndex = Math.floor((activeNodes.length * 2) / 3)
        const bottomTwoThirdsNodes = activeNodes.slice(cutoffIndex)

        this.securityBudgetBottomTwoThirds = bottomTwoThirdsNodes.reduce(
          (sum, node) => sum + Number(node.total_bond) / 1e8,
          0
        )

        if (this.pendulumUseEffectiveSecurity === 1) {
          this.effectiveBond = this.securityBudgetBottomTwoThirds
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
        this.assetBalancePoints = mimirData > 0 ? mimirData : 10000
        this.pendulumUseEffectiveSecurity =
          mimirData.PENDULUMUSEEFFECTIVESECURITY
      } catch (error) {
        console.error('Error fetching mimir data:', error)
      }
    },

    calculateValues() {
      this.adjustedSecuredTotal =
        this.totalSecuredValue * (this.assetBalancePoints / 10000)

      this.poolShare =
        (this.effectiveBond - this.adjustedSecuredTotal) / this.effectiveBond
      this.nodeShare = 1 - this.poolShare

      this.securityDelta = this.effectiveBond - this.totalVaultValue

      const nodeSharePct = this.nodeShare * 100
      if (Math.abs(nodeSharePct - 50) < 10) {
        this.currentNetworkState = 'Normal'
      } else if (nodeSharePct < 50) {
        this.currentNetworkState = 'Overbonded'
      } else {
        this.currentNetworkState = 'Underbonded'
      }
    },
    updateStatsDetails() {
      this.generalStatsDetails = [
        {
          name: 'Effective Bond',
          value: `${this.$options.filters.number(this.effectiveBond, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.effectiveBond * this.runePrice
          ),
        },
        {
          name: 'Total Secured Value',
          value: `${this.$options.filters.number(this.adjustedSecuredTotal, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.adjustedSecuredTotal * this.runePrice
          ),
        },
        {
          name: 'Node Reward Share',
          value: this.$options.filters.percent(this.nodeShare, 2),
        },
        {
          name: 'Pool Reward Share',
          value: this.$options.filters.percent(this.poolShare, 2),
        },
      ]
      this.securityStats = [
        {
          name: 'Total Vault Value',
          value: `${this.$options.filters.number(this.totalVaultValue, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.totalVaultValue * this.runePrice
          ),
        },
        {
          name: 'Security Budget',
          value: `${this.$options.filters.number(this.securityBudgetBottomTwoThirds, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.securityBudgetBottomTwoThirds * this.runePrice
          ),
          description:
            'Total bond of the bottom 2/3 of the nodes in the network',
        },
        {
          name: 'Security Delta',
          value: `${this.$options.filters.number(this.securityDelta, '0.00a')} ${this.runeCur()}`,
          extraText: this.$options.filters.currency(
            this.securityDelta * this.runePrice
          ),
        },
      ]
    },
  },
}
</script>

<style lang="scss" scoped>
.pendulum-view {
  max-width: 53rem;
  margin: 0 auto;
}
.balance-details {
  margin-top: 2rem;
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

  @include md {
    border-radius: 10px;
  }
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

.info-hr {
  border: none;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}
</style>
