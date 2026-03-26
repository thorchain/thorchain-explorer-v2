<template>
  <div class="block-time-page">
    <Card title="Block Lookup by Datetime">
      <template #header>
        <div class="header-toggle">
          <span class="toggle-label">Timestamp view</span>
          <div class="unit-switcher">
            <label class="switch">
              <input
                type="checkbox"
                :checked="timestampViewMode === 'utc'"
                @change="toggleTimestampView"
              />
              <span class="slider round"></span>
            </label>
            <span class="unit-label">{{
              timestampViewMode === 'local' ? 'Local' : 'UTC'
            }}</span>
          </div>
        </div>
      </template>

      <div class="lookup-controls">
        <div class="field-group">
          <label for="lookup-datetime">Select Date & Time</label>
          <DatePicker
            id="lookup-datetime"
            v-model="selectedTimestampMs"
            type="datetime"
            value-type="timestamp"
            placeholder="Select datetime"
            :clearable="true"
          />
        </div>
        <div class="field-group">
          <label for="lookup-unix">Unix Timestamp (seconds)</label>
          <div class="unix-input-row">
            <div class="unix-input-wrap">
              <input
                id="lookup-unix"
                v-model="unixTimestampInput"
                type="text"
                inputmode="numeric"
                placeholder="e.g. 1710000000"
              />
              <span class="suffix">sec</span>
            </div>
            <button
              class="lookup-button"
              :disabled="!selectedTimestampMs || isLoading"
              @click="lookupBlock"
            >
              {{ isLoading ? 'Looking up...' : 'Lookup Block' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <div v-if="blockHeight" class="result-section">
        <div class="result-card">
          <div class="result-header">
            <span class="label">Resolved block height</span>
            <strong>{{ blockHeight | number('0,0') }}</strong>
          </div>

          <div class="links">
            <nuxt-link class="link-item" :to="`/block/${blockHeight}`">
              <div class="link-left">
                <LinkIcon class="link-icon" />
                <span>Explorer Block Page</span>
              </div>
              <span class="chip">Internal</span>
            </nuxt-link>
            <a
              class="link-item"
              :href="midgardDebugUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="link-left">
                <LinkIcon class="link-icon" />
                <span>Midgard Debug Block Endpoint</span>
              </div>
              <span class="chip">External</span>
            </a>
            <a
              class="link-item"
              :href="thorNodeBlockUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div class="link-left">
                <LinkIcon class="link-icon" />
                <span>ThorNode Block Endpoint</span>
              </div>
              <span class="chip">External</span>
            </a>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import endpoints from '~/api/endpoints'
import LinkIcon from '~/assets/images/link.svg?inline'

export default {
  components: {
    LinkIcon,
  },
  data() {
    return {
      selectedTimestampMs: null,
      timestampViewMode: 'local',
      isLoading: false,
      errorMessage: '',
      blockHeight: null,
      blockResponse: null,
    }
  },
  head() {
    return {
      title: 'THORChain Network Explorer | Insights Block Lookup',
    }
  },
  computed: {
    blockTimestampSec() {
      if (!this.selectedTimestampMs) {
        return null
      }
      return Math.floor(Number(this.selectedTimestampMs) / 1000)
    },
    unixTimestampInput: {
      get() {
        if (!this.selectedTimestampMs) {
          return ''
        }
        return String(Math.floor(Number(this.selectedTimestampMs) / 1000))
      },
      set(value) {
        const sanitized = String(value || '').trim()
        if (!sanitized) {
          this.selectedTimestampMs = null
          return
        }

        if (!/^\d+$/.test(sanitized)) {
          return
        }

        const asSeconds = Number(sanitized)
        if (!Number.isFinite(asSeconds)) {
          return
        }

        this.selectedTimestampMs = asSeconds * 1000
      },
    },
    midgardDebugUrl() {
      if (!this.blockTimestampSec) {
        return ''
      }
      return (
        endpoints[process.env.NETWORK].MIDGARD_BASE_URL +
        `debug/block/${this.blockTimestampSec}`
      )
    },
    thorNodeBlockUrl() {
      if (!this.blockHeight) {
        return ''
      }
      return (
        endpoints[process.env.NETWORK].THORNODE_URL +
        `thorchain/block?height=${this.blockHeight}`
      )
    },
  },
  methods: {
    toggleTimestampView() {
      this.timestampViewMode = this.timestampViewMode === 'local' ? 'utc' : 'local'
    },
    extractBlockHeight(responseData) {
      const directCandidates = [
        responseData?.height,
        responseData?.blockHeight,
        responseData?.block_height,
        responseData?.block?.height,
        responseData?.block?.header?.height,
        responseData?.header?.height,
        responseData?.result?.block?.header?.height,
      ]

      const found = directCandidates.find(
        (candidate) => candidate !== undefined && candidate !== null
      )

      if (found !== undefined) {
        const normalized = Number(found)
        return Number.isFinite(normalized) ? normalized : null
      }

      return null
    },
    async lookupBlock() {
      if (!this.blockTimestampSec) {
        return
      }

      this.isLoading = true
      this.errorMessage = ''
      this.blockHeight = null
      this.blockResponse = null

      try {
        const { data } = await this.$api.getDebugBlock(this.blockTimestampSec)
        this.blockResponse = data

        const resolvedHeight = this.extractBlockHeight(data)
        if (!resolvedHeight) {
          this.errorMessage =
            'Could not resolve block height from Midgard debug response.'
          return
        }

        this.blockHeight = resolvedHeight
      } catch (error) {
        this.errorMessage =
          error?.response?.data?.error ||
          error?.message ||
          'Failed to fetch block from Midgard.'
      } finally {
        this.isLoading = false
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.block-time-page {
  .lookup-controls {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    align-items: start;
    margin-bottom: 1rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .unix-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: 38px;
    padding: 0 $space-10;
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;
    background-color: var(--bg-color);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;

    &:hover {
      border-color: color-mix(in srgb, var(--primary-color) 45%, var(--border-color));
    }

    &:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(60, 163, 139, 0.18);
    }

    input[type='text'] {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--sec-font-color);
      outline: none;
      font-size: $font-size-sm;
      min-width: 0;
    }

    .suffix {
      color: var(--sec-font-color);
      opacity: 0.85;
      font-size: $font-size-xs;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
  }

  .header-toggle {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    .toggle-label {
      font-size: 0.85rem;
      color: var(--sec-font-color);
    }
  }

  button {
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--font-color);
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;

    &.active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .unit-switcher {
    display: flex;
    align-items: center;
  }

  .unix-input-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.65rem;
    align-items: center;
  }

  .switch {
    position: relative;
    display: inline-block;
    width: 53px;
    height: 27px;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--border-color);
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 19px;
    width: 21px;
    border-radius: 50%;
    left: 4px;
    bottom: 4px;
    background-color: var(--sec-font-color);
    transition: 0.4s;
  }

  input:checked + .slider {
    background-color: var(--primary-color);
  }

  input:checked + .slider:before {
    transform: translateX(26px);
  }

  .unit-label {
    font-size: $font-size-sm;
    color: var(--font-color);
    margin-left: $space-10;
  }

  .lookup-button {
    min-width: 150px;
    border: none;
    background: var(--primary-color);
    color: #191c1e;
    font-weight: 600;
    padding: 0.55rem 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 14px rgba(60, 163, 139, 0.25);
    transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(60, 163, 139, 0.32);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 3px 10px rgba(60, 163, 139, 0.24);
    }

    &:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.55;
      box-shadow: none;
    }
  }

  .error-message {
    color: #d9534f;
    margin-bottom: 0.75rem;
  }

  .result-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .result-card {
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: $space-12;
    background: color-mix(in srgb, var(--bg-color) 88%, var(--primary-color));
  }

  .result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $space-10;

    .label {
      color: var(--sec-font-color);
      font-size: $font-size-sm;
    }

    strong {
      color: var(--font-color);
      font-size: $font-size-lg;
    }
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .link-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-10;
    padding: $space-10 $space-12;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    color: var(--font-color);
    text-decoration: none;
    background: var(--bg-color);
    transition: border-color 0.18s ease, transform 0.18s ease;

    &:hover {
      border-color: var(--primary-color);
      transform: translateY(-1px);
    }
  }

  .link-left {
    display: flex;
    align-items: center;
    gap: $space-8;
    min-width: 0;
  }

  .link-icon {
    width: 0.95rem;
    height: 0.95rem;
    fill: var(--primary-color);
    flex-shrink: 0;
  }

  .chip {
    border: 1px solid var(--border-color);
    color: var(--sec-font-color);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.7rem;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  @media (max-width: 640px) {
    .link-item {
      align-items: flex-start;
      flex-direction: column;
    }
  }
}
</style>
