<template>
  <card :title="title">
    <template #header>
      <slot name="header"></slot>
    </template>
    <div class="data-section">
      <template v-if="!isLoading">
        <div v-for="(row, index) in sortedData" :key="index" class="data-item">
          <nuxt-link
            class="item-content hoverable"
            :to="`/txs?affiliate=${getAffiliateNames(row.affiliate)}`"
          >
            <span class="item-number" :style="{ color: colorizeIndex(index) }">
              {{ index + 1 }}.
            </span>
            <div class="item-details">
              <affiliate
                :affiliate-address="row.affiliate"
                :use-new-icons="false"
                :show-link="false"
                class="item-label"
              />
              <div
                class="affiliate-value"
                :style="{ color: colorizeIndex(index) }"
              >
                <slot :row="row" :index="index"></slot>
              </div>
            </div>
          </nuxt-link>
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
  </card>
</template>

<script>
import { orderBy } from 'lodash'

export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    sortKey: {
      type: String,
      required: true,
    },
    limit: {
      type: Number,
      default: 30,
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    sortedData() {
      const filteredData = this.data.filter((d) => d[this.sortKey])
      return orderBy(filteredData, [this.sortKey], ['desc']).slice(
        0,
        this.limit
      )
    },
  },
  methods: {
    colorizeIndex(index) {
      switch (index) {
        case 0:
          return '#FFD700'
        case 1:
          return '#EDE8DF'
        case 2:
          return '#CD7F32'
        default:
          return 'var(--font-color)'
      }
    },
    getAffiliateNames(name) {
      const affiliates = this.$parent.getAffiliateNames(name)
      return affiliates
    },
  },
}
</script>

<style lang="scss" scoped>
.data-section {
  flex: 1;

  .loader-item {
    display: flex;
    justify-content: space-between;
    padding: $space-10 $space-10;
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
    border-radius: $radius-lg;
  }

  .data-item {
    background-color: var(--bg-color);
    border-bottom: 1px solid var(--border-color);
    padding: $space-10;
    margin: $space-10;
    margin-bottom: $space-10;

    &:last-child {
      border-bottom: none;
    }

    .item-content {
      display: flex;
      align-items: center;
      text-decoration: none;

      .item-number {
        font-weight: bold;
        margin-right: $space-12;
      }

      &.hoverable:hover {
        .affiliate-name,
        .item-number,
        .affiliate-value {
          color: var(--primary-color) !important;
        }
      }

      .affiliate-name {
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--sec-font-color);
      }

      .item-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        span {
          font-weight: bold;
        }
      }

      .item-icon {
        height: 1.7rem;
        padding: $space-4 $space-0;
        display: flex;
        align-items: center;
      }

      .item-details {
        display: flex;
        justify-content: space-between;
        flex: 1;
        align-items: center;
        gap: 1rem;

        .affiliate-value {
          line-height: 1.4;
          font-size: $font-size-smm;
          color: var(--sec-font-color);
          font-weight: bold;
        }
      }
    }
  }
}
</style>
