<template>
  <card>
    <div v-if="state">
      <div class="balance-container">
        <span class="title-balance">Balances</span>
        <div class="balance-label">
          <span>RUNE BALANCE</span>
          <div class="balance-content">
            <asset-icon
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
              :asset="{ ticker: 'RUNE', chain: 'THOR' }"
              :chain="false"
              class="asset-icon"
            />
            <span
              class="mono"
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
            >
              {{ runeToken.price | number('0,0.00') }} RUNE
            </span>
            <span v-else>-</span>
          </div>
        </div>

        <div class="balance-label">
          <span>RUNE VALUE</span>
          <div class="balance-content">
            <span
              class="mono"
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
            >
              {{ (runeToken.price * runePrice) | currency }}
            </span>
            <span v-else>-</span>
          </div>
        </div>
        <div class="dropdown-container">
          <label for="token-dropdown">Token Holdings</label>
          <div ref="dropdownButton" class="custom-dropdown">
            <button
              class="dropdown-button"
              @click="toggleDropdown"
              :disabled="totalValue.count === 0"
            >
              <div class="selected-options">
                <span v-if="selectedToken">
                  {{ showAsset(selectedToken.asset) }}
                </span>
                <div class="selected-options">
                  <span v-if="selectedToken">
                    {{ showAsset(selectedToken.asset) }}
                  </span>
                  <span v-else class="total-value">
                    {{ totalValue.total | number('0,0.000') }}
                  </span>
                  <span class="count-value">
                    ({{ totalValue.count }} Tokens)
                  </span>
                </div>
              </div>
              <AngleIcon class="dropdown-icon" />
            </button>
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
                    <asset-icon
                      :asset="token.asset"
                      :chain="false"
                      class="asset-icon"
                    />
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
  components: {
    AngleIcon,
  },
  props: ['state'],
  data() {
    return {
      selectedToken: null,
      isOpen: false,
    }
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

        if (e.asset?.ticker === 'RUNE' && e.asset?.chain === 'THOR') {
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
      if (asset?.synth) {
        return 'Synth'
      } else if (asset?.trade) {
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
  gap: 24px;

  .balance-label {
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    font-size: 12px;
  }
  .balance-value {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    align-items: center;
  }
  .balance-content {
    display: flex;
  }
}

.title-balance {
  font-weight: bold;
}
.mono {
  font-size: 14px !important;
  color: var(--sec-font-color);
}
.thor-rune-details {
  padding: 12px;
  margin-bottom: 24px;
}

.token-details {
  margin-top: 10px;
  padding: 10px;
  background-color: var(--bg-color-light);
  border-radius: 6px;
}

.detail-item {
  font-size: 16px;
  padding: 10px;
}

button[disabled] {
  cursor: not-allowed;
  opacity: 0.6;
}
.dropdown-container {
  font-size: 12px;
  letter-spacing: 1px;
  display: flex;
  gap: 5px;
  flex-direction: column;
  position: relative;
}

.custom-dropdown {
  position: relative;
  display: inline-block;

  .dropdown-button {
    width: 100%;
    padding: 14px 12px;
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
  top: 108%;

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
    padding: 10px;
    font-size: 14px;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid var(--border-color);
    margin: 0px 12px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: var(--active-bg-color);
      border-radius: 0.3rem;
    }

    .token-info {
      display: flex;
      flex-direction: column;

      .token-name {
        color: var(--sec-font-color);
        font-size: 12px;
        display: flex;
        padding-bottom: 6px;
        align-items: center;
      }

      .token-quantity {
        font-size: 12px;
      }
    }

    .token-value {
      text-align: right;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;

      .token-price {
        font-size: 12px;
      }
    }
  }
}

::v-deep .asset-icon {
  width: 14px !important;
  height: 14px !important;

  svg {
    width: 14px !important;
    height: 14px !important;
  }
}

.total-value {
  font-size: 15px;
  font-weight: bold;
}

.count-value {
  color: var(--bs-secondary-color);
  font-size: 14px;
}

.token-group-header {
  font-weight: bold;
  padding: 10px;
  font-size: 14px;
  color: var(--sec-font-color);
  border-radius: 5px;
  margin: 0px 12px;
}
</style>
