<template>
  <card>
    <span class="title-balance">Balances</span>
    <div v-if="state">
      <div class="balance-container">
        <div class="balance-label">RUNE BALANCE</div>
        <div class="balance-value">
          <span v-if="runeToken.price > 0 && !isNaN(runeToken.price)">
            {{ runeToken.price | number('0,0.00') }} RUNE
          </span>
          <span v-else>-</span>
        </div>
        <div class="balance-label">RUNE VALUE</div>
        <div class="balance-value">
          <span v-if="runeToken.price > 0 && !isNaN(runeToken.price)">
            {{ (runeToken.price * runePrice) | currency }}
          </span>
          <span v-else>-</span>
        </div>
      </div>

      <div class="dropdown-container">
        <label for="token-dropdown">Token Holdings</label>
        <div ref="dropdownButton" class="custom-dropdown">
          <div class="dropdown-button" @click="toggleDropdown">
            <div class="selected-options">
              <span v-if="selectedToken">
                {{ showAsset(selectedToken.asset) }}
              </span>
              <div class="selected-options">
                <span v-if="selectedToken">
                  {{ showAsset(selectedToken.asset) }}
                </span>
                <span v-else
                  >{{ totalValue.total | number('0,0.000') }} ({{
                    totalValue.count
                  }})</span
                >
              </div>
            </div>
            <AngleIcon class="dropdown-icon" />
          </div>
        </div>
      </div>
      <div v-if="isOpen" class="dropdown-options">
        <div v-for="(tokens, type) in groupedTokens" :key="type">
          <div class="token-group-header">
            {{ type }} Assets ({{ tokens.length }})
          </div>
          <div
            v-for="token in tokens"
            :key="token.asset"
            class="dropdown-option"
          >
            <div class="token-info">
              <div class="token-name">
                <asset-icon :asset="token.asset" class="asset-icon" />
                <div>{{ showAsset(token.asset) }}</div>
              </div>
              <div class="token-quantity">
                {{ token.quantity }} {{ token.asset.ticker }}
              </div>
            </div>

            <div class="token-value">
              <span v-if="token.price > 0 && !isNaN(token.price)">
                ${{ token.value | number('0,0.00') }}
              </span>
              <span v-else>-</span>
              <div class="token-price">
                @{{ token.price | number('0,0.0000') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </card>
</template>

<script>
import { bnOrZero } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import { assetFromString } from '~/utils'
import AngleIcon from '~/assets/images/angle-down.svg?inline'

export default {
  data() {
    return {
      selectedToken: null,
      isOpen: false,
    }
  },
  props: ['state'],
  components: {
    AngleIcon,
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
    }),
    totalValue() {
      const total = this.otherTokens.reduce(
        (sum, token) => sum + Number(token.value),
        0
      )
      const count = this.otherTokens.length
      return { total, count }
    },
    tokenRows() {
      if (!this.state) {
        return []
      }

      const ret = []
      for (let i = 0; i < this.state.length; i++) {
        const e = this.state[i]
        let poolAsset
        this.pools?.forEach((p) => {
          const pa = assetFromString(p.asset)
          if (pa.chain === e.asset.chain && pa.ticker === e.asset.ticker) {
            poolAsset = p
          }
        })

        if (e.asset.ticker === 'RUNE' && e.asset.chain === 'THOR') {
          poolAsset = {
            assetPriceUSD: this.runePrice,
          }
        }

        ret.push({
          asset: e.asset,
          quantity: e.quantity,
          price: bnOrZero(poolAsset?.assetPriceUSD).toFixed(2),
          value: bnOrZero(poolAsset?.assetPriceUSD * e.quantity).toFixed(2),
          type: this.getAssetType(e.asset),
        })
      }

      return ret
    },
    runeToken() {
      return this.tokenRows.find(
        (token) => token.asset.ticker === 'RUNE' && token.asset.chain === 'THOR'
      )
    },
    otherTokens() {
      return this.tokenRows.filter(
        (token) =>
          !(token.asset.ticker === 'RUNE' && token.asset.chain === 'THOR')
      )
    },
    groupedTokens() {
      return this.otherTokens.reduce((acc, token) => {
        const type = this.getAssetType(token.asset)
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(token)
        return acc
      }, {})
    },
  },

  methods: {
    showAsset(asset) {
      return asset.ticker
    },
    getAssetType(asset) {
      if (asset.synth) {
        return 'Synth'
      } else if (asset.trade) {
        return 'Trade'
      } else {
        return 'Native'
      }
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen
    },
    selectToken(token) {
      this.selectedToken = token
      this.isOpen = false
    },
  },
}
</script>

<style lang="scss" scoped>
.balance-container {
  display: flex;
  flex-direction: column;
  margin-top: 34px;

  .balance-label {
    font-size: 12px;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .balance-value {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 34px;
  }
}

.title-balance {
  font-weight: bold;
}

.thor-rune-details {
  padding: 10px;
  margin-bottom: 20px;
}

.token-details {
  margin-top: 8px;
  padding: 8px;
  background-color: var(--bg-color-light);
  border-radius: 6px;
}

.detail-item {
  font-size: 16px;
  padding: 8px;
}

strong {
  font-weight: bold;
}

.dropdown-container {
  font-size: 12px;
  color: var(--secondary-text-color);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: flex;
  gap: 12px;
  flex-direction: column;
  position: relative; 
}

.custom-dropdown {
  position: relative;
  margin-bottom: 10px;
  display: inline-block;

  .dropdown-button {
    width: 100%;
    padding: 12px 10px;
    font-size: 16px;
    border: none;
    border-radius: 6px;
    background-color: var(--bg-color);
    color: var(--sec-font-color);
    border: 1px solid var(--border-color);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    transition:
      border-color 0.3s ease,
      box-shadow 0.3s ease;

    .dropdown-icon {
      width: 1rem;
      height: 1rem;
      fill: var(--sec-font-color);
    }
  }
}

.dropdown-options {
  background-color: var(--bg-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  border-radius: 0.5rem;
  padding: 0.5rem 0;
  max-height: 200px;
  overflow-y: auto;
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  left: 0; 
  min-width: 100%;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--active-bg-color);
    border-radius: 5px;
  }

  .dropdown-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    font-size: 14px;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid var(--border-color);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--active-bg-color);
      border-radius: 0.3rem;
      color: var(--primary-color);
    }

    .token-info {
      display: flex;
      flex-direction: column;

      .token-name {
        font-size: 12px;
        display: flex;
        gap: 0.5rem;
        padding-bottom: 1rem;
        flex-direction: row;
        align-items: center;
      }

      .token-quantity {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
    }

    .token-value {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .token-price {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
    }
  }
}

.asset-icon {
  width: 16px !important;
  height: 16px !important;

  svg {
    width: 30%;
    height: 30%;
  }
}

.token-group-header {
  font-weight: bold;
  padding: 10px;
  font-size: 14px;
  background-color: var(--border-color);
  color: var(--sec-font-color);
  border-radius: 5px;
  margin: 5px 10px;
}

</style>
