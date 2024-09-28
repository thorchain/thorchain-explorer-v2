<template>
  <card>
    <template v-if="state">
      <div class="balance-container">
        <span class="title-balance">Balances</span>
        <div class="balance-label">
          <span>RUNE Balance</span>
          <skeleton-item :loading="loading" class="balance-content">
            <asset-icon
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
              :asset="{ ticker: 'RUNE', chain: 'THOR' }"
              :chain="false"
              class="asset-icon"
            />
            <span
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
              class="mono"
            >
              {{ balanceFormat(runeToken.quantity) }} RUNE
            </span>
            <span v-else>-</span>
          </skeleton-item>
        </div>

        <div class="balance-label">
          <span>RUNE Value</span>
          <skeleton-item :loading="loading" class="balance-content">
            <span
              v-if="runeToken && runeToken.price > 0 && !isNaN(runeToken.price)"
              class="mono"
            >
              {{ (runeToken.price * runeToken.quantity) | currency }}
            </span>
            <span v-else>-</span>
          </skeleton-item>
        </div>
        <div class="dropdown-container">
          <label for="token-dropdown">Other Asset Holdings</label>
          <div ref="dropdownButton" class="custom-dropdown">
            <button
              class="dropdown-button"
              :disabled="totalValue.count === 0"
              @click="toggleDropdown"
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

          <div v-if="isOpen" class="dropdown-modal">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search for Token Name"
              class="search-input"
            />
            <div class="dropdown-options">
              <div class="options-container">
                <div
                  v-if="filteredTokens(otherTokens).length === 0"
                  class="no-results"
                >
                  Could not find any matches!
                </div>

                <div v-for="group in sortedGroupedTokens" :key="group.type">
                  <div v-if="filteredTokens(group.tokens).length > 0">
                    <div class="token-group-header">
                      {{ group.type }} Assets ({{
                        filteredTokens(group.tokens).length
                      }})
                      <div class="sort-controls">
                        <span @click="changeSort(group.type)">
                          <ArrowDownIcon
                            v-if="sortDirection[group.type] === 'desc'"
                            class="arrow-icon"
                          />
                          <ArrowUpIcon
                            v-if="sortDirection[group.type] === 'asc'"
                            class="arrow-icon"
                          />
                        </span>
                      </div>
                    </div>

                    <div
                      v-for="token in filteredTokens(group.tokens)"
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
                          <span style="line-height: 1">{{
                            showAsset(token.asset)
                          }}</span>
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
        </div>
      </div>
    </template>
  </card>
</template>

<script>
import { bnOrZero } from '@xchainjs/xchain-util'
import { mapGetters } from 'vuex'
import { orderBy } from 'lodash'
import { assetFromString } from '~/utils'
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import ArrowDownIcon from '~/assets/images/arrow-down-.svg?inline'
import ArrowUpIcon from '~/assets/images/arrow-up-.svg?inline'

export default {
  components: {
    AngleIcon,
    ArrowDownIcon,
    ArrowUpIcon,
  },
  props: ['state', 'loading'],
  data() {
    return {
      selectedToken: null,
      isOpen: false,
      runeBalance: null,
      sortField: 'value',
      sortDirection: {
        Native: 'desc',
        Trade: 'desc',
        Synth: 'desc',
      },
      searchQuery: '',
    }
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
      pools: 'getPools',
    }),
    sortedGroupedTokens() {
      return Object.entries(this.groupedTokens).map(([type, tokens]) => {
        return {
          type,
          tokens: orderBy(
            tokens,
            [(token) => parseFloat(token.value)],
            [this.sortDirection[type]]
          ),
        }
      })
    },

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
          if (pa.chain === e.asset?.chain && pa?.ticker === e.asset?.ticker) {
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
          !(token.asset?.ticker === 'RUNE' && token.asset?.chain === 'THOR')
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
    filteredTokens(tokens) {
      return tokens.filter((token) => {
        const nameMatch = this.showAsset(token.asset)
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase())
        const valueMatch = token.value.toString().includes(this.searchQuery)
        const priceMatch = token.price.toString().includes(this.searchQuery)
        return nameMatch || valueMatch || priceMatch
      })
    },
    selectToken(token) {
      this.selectedToken = token
      this.isOpen = false
    },
    changeSort(type) {
      this.sortDirection[type] =
        this.sortDirection[type] === 'asc' ? 'desc' : 'asc'
    },
  },
}
</script>

<style lang="scss" scoped>
.balance-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 24px;

  .balance-label {
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
  margin-top: auto;

  .search-input {
    flex: 1;
    padding: 8px;
    color: var(--sec-font-color);
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: 0.5rem;
    margin: 8px 12px;
    margin-right: 20px;
    display: flex;
    outline: none;
    font-size: 0.9062rem;
    font-weight: 450;
    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
    }
  }
}
.options-container {
  display: flex;
  flex-direction: column;
  margin: 0px 12px;
}

.custom-dropdown {
  position: relative;
  display: inline-block;

  .dropdown-button {
    width: 100%;
    padding: 10px 12px;
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

.dropdown-modal {
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  border-radius: 0.5rem;
  z-index: 1000;
  position: absolute;
  width: 100%;
  box-sizing: border-box;
  left: 0;
  top: 108%;
  padding-bottom: 8px;
}

.dropdown-options {
  max-height: 350px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--font-color);
    opacity: 50%;
    border-radius: 3px;
  }

  .dropdown-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    font-size: 14px;
    transition: background-color 0.3s ease;
    border-bottom: 1px solid var(--border-color);

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
.no-results {
  padding: 10px;
  text-align: center;
  color: var(--bs-secondary-color);
  font-size: 14px;
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
  background-color: var(--border-color);
  color: var(--sec-font-color);
  border-radius: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.sort-controls span {
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  padding-right: 2px;
}
.arrow-icon {
  fill: var(--primary-color);
}
</style>
