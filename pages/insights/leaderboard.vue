<template>
  <div class="leaderboard-container">
    <div class="data-section">
      <h3 class="section-title">Swap Fees</h3>
      <div
        class="data-item"
        v-for="(row, index) in sortedData('affiliate_fees_usd')"
        :key="index"
      >
        <div class="item-content">
          <span class="item-number">{{ index + 1 }}.</span>
          <div>
            <img v-if="row.icon" :src="row.icon" class="item-icon" />
          </div>
          <div class="item-details">
            <div class="affiliate-name">{{ row.affiliate }}</div>
            <div class="affiliate-value">
              ${{ (row.affiliate_fees_usd / 1e2) | number('0a') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-section">
      <h3 class="section-title">Swap Volume</h3>
      <div
        class="data-item"
        v-for="(row, index) in sortedData('total_volume_usd')"
        :key="index"
      >
        <div class="item-content">
          <span class="item-number">{{ index + 1 }}.</span>
          <div>
            <img v-if="row.icon" :src="row.icon" class="item-icon" />
          </div>
          <div class="item-details">
            <div class="affiliate-name">{{ row.affiliate }}</div>
            <div class="affiliate-value">
              ${{ (row.total_volume_usd / 1e2) | number('0a') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="data-section">
      <h3 class="section-title">Swap Count</h3>
      <div
        class="data-item"
        v-for="(row, index) in sortedData('total_swaps')"
        :key="index"
      >
        <div class="item-content">
          <span class="item-number">{{ index + 1 }}.</span>
          <div>
            <img v-if="row.icon" :src="row.icon" class="item-icon" />
          </div>
          <div class="item-details">
            <div class="affiliate-name">{{ row.affiliate }}</div>
            <div class="affiliate-value">
              {{ row.total_swaps | number('0,0') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { orderBy } from 'lodash'

export default {
  data() {
    return {
      bs: [],
      sortDirection: {
        affiliate_fees_usd: 'desc',
        total_volume_usd: 'desc',
        total_swaps: 'desc',
      },
    }
  },
  async mounted() {
    try {
      const { data } = await this.$api.getAffiliateByWallet()
      this.affiliateWallets(data)
    } catch (error) {
      console.error('Error fetching affiliate data:', error)
    }
  },
  methods: {
    affiliateWallets(data) {
      this.bs = data.map((item) => {
        const interfaceData = this.mapInterfaceName(item.affiliate)
        const isDarkMode = this.mapInterfaceName(item.affiliate)

        return {
          affiliate: item.affiliate,
          total_volume_usd: item.total_volume_usd,
          affiliate_fees_usd: item.affiliate_fees_usd,
          total_swaps: item.total_swaps,
          icon: interfaceData
            ? isDarkMode
              ? interfaceData.icons.urlDark
              : interfaceData.icons.url
            : '',
        }
      })
    },

    sortedData(field) {
      return orderBy(this.bs, [field], [this.sortDirection[field]])
    },
    affiliateWallet(item) {
      const detail = this.mapInterfaceName(item.affiliate)
      return detail
        ? {
            icon: detail.icons.url,
            name: detail.name,
          }
        : {
            icon: '',
            name: item.affiliate,
          }
    },
  },
}
</script>

<style lang="scss" scoped>
.leaderboard-container {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;

  .data-section {
    flex: 1;
    margin: 0 15px;
    background-color: var(--bg-color);
    border-radius: 0.5rem;

    .section-title {
      text-align: center;
      color: var(--sec-font-color);
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

        .item-icon {
          height: 1.5rem;
          width: 2.5rem;
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
            font-weight: bold;
          }
        }
      }
    }
  }
}
</style>
