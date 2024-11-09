<template>
  <div class="leaderboard-container">
    <div class="data-section">
      <h3 class="section-title">
        Affiliate Collected <small>- AVG affiliate bps</small>
      </h3>
      <template v-if="affiliateData && affiliateData.length > 0">
        <div
          v-for="(row, index) in sortedData(
            affiliateData,
            'affiliate_fees_usd'
          )"
          :key="index"
          class="data-item"
        >
          <div class="item-content">
            <span class="item-number" :style="{ color: colorizeIndex(index) }">
              {{ index + 1 }}.
            </span>
            <div class="item-details">
              <img
                v-if="affiliateWallet(row.affiliate).icon"
                :src="affiliateWallet(row.affiliate).icon"
                class="item-icon"
              />
              <div v-else class="affiliate-name">{{ row.affiliate }}</div>
              <div
                class="affiliate-value"
                :style="{ color: colorizeIndex(index) }"
              >
                ${{ row.affiliate_fees_usd | number('0a') }}
                <small>
                  -
                  {{ row.avg_bps | percent(2) }}
                </small>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="index in limit" :key="index" class="loader-item">
          <div style="display: flex; gap: 5px">
            <skeleton-loader
              class="number-loader"
              width="5px"
            ></skeleton-loader>
            <skeleton-loader class="wallet-loader"></skeleton-loader>
          </div>
          <skeleton-loader class="value-loader"></skeleton-loader>
        </div>
      </template>
    </div>

    <div class="data-section">
      <h3 class="section-title">Swap Volume</h3>
      <template v-if="affiliateData && affiliateData.length > 0">
        <div
          v-for="(row, index) in sortedData(affiliateData, 'total_volume_usd')"
          :key="index"
          class="data-item"
        >
          <div class="item-content">
            <span class="item-number" :style="{ color: colorizeIndex(index) }">
              {{ index + 1 }}.
            </span>
            <div class="item-details">
              <img
                v-if="affiliateWallet(row.affiliate).icon"
                :src="affiliateWallet(row.affiliate).icon"
                class="item-icon"
              />
              <div v-else class="affiliate-name">{{ row.affiliate }}</div>
              <div
                class="affiliate-value"
                :style="{ color: colorizeIndex(index) }"
              >
                ${{ row.total_volume_usd | number('0a') }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="index in limit" :key="index" class="loader-item">
          <div style="display: flex; gap: 5px">
            <skeleton-loader
              class="number-loader"
              width="5px"
            ></skeleton-loader>
            <skeleton-loader class="wallet-loader"></skeleton-loader>
          </div>
          <skeleton-loader class="value-loader"></skeleton-loader>
        </div>
      </template>
    </div>

    <div class="data-section">
      <h3 class="section-title">Swap Count</h3>
      <template v-if="affiliateData && affiliateData.length > 0">
        <div
          v-for="(row, index) in sortedData(affiliateData, 'total_swaps')"
          :key="index"
          class="data-item"
        >
          <div class="item-content">
            <span class="item-number" :style="{ color: colorizeIndex(index) }">
              {{ index + 1 }}.
            </span>
            <div class="item-details">
              <img
                v-if="affiliateWallet(row.affiliate).icon"
                :src="affiliateWallet(row.affiliate).icon"
                class="item-icon"
              />
              <div v-else class="affiliate-name">{{ row.affiliate }}</div>
              <div
                class="affiliate-value"
                :style="{ color: colorizeIndex(index) }"
              >
                {{ row.total_swaps | number('0,0') }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="index in limit" :key="index" class="loader-item">
          <div style="display: flex; gap: 5px">
            <skeleton-loader
              class="number-loader"
              width="5px"
            ></skeleton-loader>
            <skeleton-loader class="wallet-loader"></skeleton-loader>
          </div>
          <skeleton-loader class="value-loader"></skeleton-loader>
        </div>
      </template>
    </div>

    <div class="data-section">
      <h3 class="section-title">Volume / Swap Count</h3>
      <template v-if="affiliateData && affiliateData.length > 0">
        <div
          v-for="(row, index) in sortedData(affiliateData, 'vc')"
          :key="index"
          class="data-item"
        >
          <div class="item-content">
            <span class="item-number" :style="{ color: colorizeIndex(index) }">
              {{ index + 1 }}.
            </span>
            <div class="item-details">
              <img
                v-if="affiliateWallet(row.affiliate).icon"
                :src="affiliateWallet(row.affiliate).icon"
                class="item-icon"
              />
              <div v-else class="affiliate-name">{{ row.affiliate }}</div>
              <div
                class="affiliate-value"
                :style="{ color: colorizeIndex(index) }"
              >
                ${{ row.vc | number('0,0') }}
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="index in limit" :key="index" class="loader-item">
          <div style="display: flex; gap: 5px">
            <skeleton-loader
              class="number-loader"
              width="5px"
            ></skeleton-loader>
            <skeleton-loader class="wallet-loader"></skeleton-loader>
          </div>
          <skeleton-loader class="value-loader"></skeleton-loader>
        </div>
      </template>
    </div>
    <div v-if="!isOverview" class="footer-stat">
      <strong>
        <sup>*</sup>
        All of the stat are based on 30 days period for now
      </strong>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { orderBy } from 'lodash'

export default {
  props: {
    affiliateData: {
      type: Array,
      required: true,
    },
    isOverview: {
      type: Boolean,
      default: false,
    },
    limit: {
      type: Number,
      default: 30,
    },
  },
  data() {
    return {
      sortDirection: {
        affiliate_fees_usd: 'desc',
        total_volume_usd: 'desc',
        total_swaps: 'desc',
        vc: 'desc',
      },
    }
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
    }),
  },

  methods: {
    sortedData(data, field) {
      return orderBy(data, [field], [this.sortDirection[field]]).slice(
        0,
        this.limit
      )
    },
    colorizeIndex(index) {
      switch (index) {
        case 0:
          return '#FFD700'

        case 1:
          return '#CD7F32'

        case 2:
          return '#C0C0C0'
        default:
          return 'var(--font-color)'
      }
    },

    affiliateWallet(affiliateName) {
      const detail = this.mapInterfaceName(affiliateName)
      return detail
        ? {
            icon:
              this.theme === 'light' ? detail.icons.url : detail.icons.urlDark,
            name: detail.name,
          }
        : {
            icon: undefined,
            name: affiliateName,
          }
    },
  },
}
</script>

<style lang="scss" scoped>
.leaderboard-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;

  @include md {
    flex-direction: row;
  }

  .data-section {
    flex: 1;
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);

    .loader-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 10px;
      border-bottom: 1px solid var(--border-color);

      .number-loader {
        min-width: 10px;
      }

      .wallet-loader {
        min-width: 100px;
      }

      .value-loader {
        min-width: 120px;
      }
    }

    @include md {
      border-radius: 0.5rem;
    }

    .section-title {
      text-align: center;
      color: var(--sec-font-color);
      padding: 1.1rem 0;
      border-bottom: 1px solid var(--border-color);
      margin-top: 0;
    }

    .data-item {
      background-color: var(--bg-color);
      border-bottom: 1px solid var(--border-color);
      padding: 10px;
      margin: 10px;
      margin-bottom: 10px;

      &:last-child {
        border-bottom: none;
      }

      .item-content {
        display: flex;
        align-items: center;

        .item-number {
          font-weight: bold;
          margin-right: 13px;
        }

        .affiliate-name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--sec-font-color);
        }

        .item-icon {
          height: 1.7rem;
          padding: 4px 0;
          margin-right: 15px;
          display: flex;
          align-items: center;
        }

        .item-details {
          display: flex;
          justify-content: space-between;
          flex: 1;

          .affiliate-value {
            line-height: 1.4;
            font-size: 1.05rem;
            color: var(--sec-font-color);
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
