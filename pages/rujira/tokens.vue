<template>
  <page>
    <div class="search-container">
      <div id="nodes-search-container">
        <input
          v-model="searchTerm"
          placeholder="Search by name or symbol"
          class="search-input"
        />
        <SearchIcon class="search-icon" />
      </div>
    </div>
    <div class="metadata-grid">
      <card v-for="metadata in filteredMetadata" :key="metadata.base">
        <div class="metadata-header">
          <h3 class="header-class">
            <asset-icon
              :asset="assetFromString(metadata.base)"
              :chain="false"
              :height="'1.8rem'"
            ></asset-icon>
            <span>
              {{ formatContractAsset(metadata.base) }}
            </span>
          </h3>
          <div v-if="metadata.description" class="description-container">
            <infoIcon
              v-tooltip="metadata.description"
              class="description-button"
            >
            </infoIcon>
          </div>
        </div>

        <div class="metadata-content">
          <div class="metadata-field">
            <label>Symbol:</label>
            <div>{{ metadata.symbol }}</div>
          </div>

          <div class="metadata-field">
            <label>Base:</label>
            <div v-tooltip="metadata.base">{{ metadata.base }}</div>
          </div>

          <div v-if="metadata.base !== metadata.display" class="metadata-field">
            <label>Display:</label>
            <div>{{ metadata.display }}</div>
          </div>

          <div v-if="metadata.uri" class="metadata-field">
            <label>URI:</label>
            <a :href="metadata.uri" target="_blank" rel="noopener">{{
              metadata.uri
            }}</a>
          </div>

          <div v-if="metadata.supply" class="supplies">
            <div v-if="metadata.supply" class="metadata-field">
              <label>Supply:</label>
              <div>{{ (metadata.supply / 1e8) | number('0,0.00') }}</div>
            </div>

            <div v-if="metadata.owners" class="metadata-field">
              <label>Holders:</label>
              <div>{{ metadata.owners | number('0,0') }}</div>
            </div>
          </div>

          <div v-if="metadata.denom_units" class="denom-units-section">
            <div class="denom-units-container">
              <div
                v-for="(unit, index) in metadata.denom_units"
                :key="index"
                class="denom-unit"
              >
                <div class="denom-unit-field">
                  <div class="denom-unit-label">Denom:</div>
                  <span v-tooltip="unit.denom">{{ unit.denom }}</span>
                </div>
                <div class="denom-unit-exponent">
                  <div class="denom-unit-label">Exponent:</div>
                  <span>{{ unit.exponent }}</span>
                </div>
                <div
                  v-if="unit.aliases && unit.aliases.length"
                  class="denom-unit-field"
                >
                  <span class="denom-unit-label">Aliases:</span>
                  <span>{{ unit.aliases.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </card>
    </div>
  </page>
</template>

<script>
import SearchIcon from '~/assets/images/search.svg?inline'
import infoIcon from '~/assets/images/info.svg?inline'
import { assetFromString } from '~/utils'

export default {
  name: 'DenomMetadata',
  components: {
    SearchIcon,
    infoIcon,
  },
  data() {
    return {
      metadataList: [],
      loading: true,
      searchTerm: '',
      currentFilter: 'ALL',
    }
  },
  computed: {
    filteredMetadata() {
      if (!this.metadataList?.length) return []

      const query = this.searchTerm.trim().toLowerCase()

      return this.metadataList.filter((metadata) => {
        const matchesSearch =
          !query ||
          (metadata.name && metadata.name.toLowerCase().includes(query)) ||
          (metadata.symbol && metadata.symbol.toLowerCase().includes(query)) ||
          (metadata.description &&
            metadata.description.toLowerCase().includes(query)) ||
          (metadata.base && metadata.base.toLowerCase().includes(query)) ||
          (metadata.display &&
            metadata.display.toLowerCase().includes(query)) ||
          (metadata.denom_units &&
            metadata.denom_units.some(
              (unit) =>
                unit.denom.toLowerCase().includes(query) ||
                (unit.aliases &&
                  unit.aliases.some((alias) =>
                    alias.toLowerCase().includes(query)
                  ))
            ))

        let matchesFilter = true
        if (this.currentFilter === 'BASE') {
          matchesFilter = metadata.base === metadata.display
        } else if (this.currentFilter === 'SYMBOL') {
          matchesFilter = metadata.symbol && metadata.symbol.length > 0
        }

        return matchesSearch && matchesFilter
      })
    },
  },
  async mounted() {
    try {
      await this.fetchMiddleware()
    } catch (error) {
      await this.fetchMetadata()
    }
  },
  methods: {
    assetFromString(asset) {
      return assetFromString(asset)
    },
    formatContractAsset(asset) {
      const a = assetFromString(asset)
      if (a) {
        return a.ticker?.toUpperCase() ?? a
      }

      return asset
    },
    async fetchMiddleware() {
      this.metadataList = (await this.$api.getDenoms())?.data
    },
    async fetchMetadata() {
      try {
        this.metadataList = (await this.$api.getDenom())?.data?.metadatas
      } catch (error) {
        console.error('Error fetching denom metadata:', error)
        this.metadataList = []
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.title-section {
  display: flex;
  align-items: center;
  gap: 15px;

  h2 {
    margin: 0;
    color: var(--sec-font-color);
  }
}

.search-container {
  display: flex;
  flex-wrap: wrap;
  gap: $space-8;
  margin: $space-0 $space-10;

  @include lg {
    margin: $space-0;
    gap: $space-0;
  }
}

#nodes-search-container {
  display: flex;
  position: relative;
  flex: 1;
  max-width: 35rem;

  .search-input {
    flex: 1;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color) !important;
    border-radius: $radius-lg;
    color: var(--sec-font-color);
    outline: none;
    padding: $space-12;
    font-size: $font-size-mobile;
    font-weight: 450;
    margin: $space-2;

    @include lg {
      width: 28rem;
    }

    &:focus {
      border-color: transparent;
      box-shadow: 0 0 0 0.15rem rgba(255, 255, 255, 0.1);
      color: var(--primary-color);
    }
  }

  .search-icon {
    position: absolute;
    width: 28px;
    height: 24px;
    fill: var(--font-color);
    right: 0.8rem;
    top: calc(50% - 0.8rem);
    cursor: pointer;
    background: var(--card-bg-color);
    padding-left: $space-8;
  }
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.metadata-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  color: var(--sec-font-color);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
  position: relative;

  h3 {
    margin: 0;
    font-size: 18px;
    overflow: hidden;
    white-space: nowrap;
    max-width: 12rem;
    display: flex;
    align-items: center;
    gap: $space-8;
    font-size: $font-size-xs;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.description-container {
  position: relative;

  .description-button {
    background: transparent;
    border: none;
    fill: var(--sec-font-color);
    border-radius: 50%;
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
    height: 20px;
    width: 28px;

    &:hover {
      fill: var(--primary-color);
    }
  }

  .description-section {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: $space-8;
    z-index: 10;
    width: 100%;
    min-width: 300px;
    max-width: 400px;
    line-height: 1.5;
    font-size: 0.95rem;
    color: var(--sec-font-color);
    animation: fadeIn 0.2s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.metadata-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.metadata-field {
  display: flex;
  flex-direction: column;
  gap: 4px;

  @include lg {
    flex-direction: row;
    justify-content: space-between;
  }

  label {
    font-size: $font-size-s;
  }

  div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
    display: block;
    font-size: $font-size-s;
    color: var(--sec-font-color);
    font-weight: 500;
  }

  a {
    color: var(--primary-color);
    text-decoration: none;
    font-size: $font-size-s;

    &:hover {
      text-decoration: underline;
    }
  }
}

.symbol-badge {
  width: fit-content;
}

.supplies {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
}

.denom-units-section {
  padding-top: 15px;
  border-top: 1px dashed var(--border-color);
  gap: 12px;
  display: flex;
  flex-direction: column;

  label {
    font-size: 12px;
    color: var(--sec-font-color);
    font-weight: 500;
  }

  .denom-units-container {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .denom-unit {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .denom-unit-field {
        display: flex;
        gap: 4px;
        flex-direction: column;
        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
          display: block;
          font-size: $font-size-s;
          color: var(--sec-font-color);
          font-weight: 500;
        }

        .denom-unit-label {
          font-size: $font-size-s;
        }
      }
    }
  }
  .denom-unit-exponent {
    display: flex;
    gap: 5px;

    .denom-unit-label {
      font-size: $font-size-s;
    }
    span {
      font-size: $font-size-s;
      font-weight: 500;
      color: var(--sec-font-color);
    }
  }
}
</style>
