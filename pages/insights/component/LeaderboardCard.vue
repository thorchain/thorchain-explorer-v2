<template>
    <card :title="title">
      <template #header>
        <slot name="header"></slot>
      </template>
      <div class="data-section">
        <template v-if="!isLoading">
          <div
            v-for="(row, index) in sortedData"
            :key="index"
            class="data-item"
          >
            <nuxt-link
              class="item-content hoverable"
              :to="`/txs?affiliate=${getAffiliateNames(row.affiliate)}`"
            >
              <span
                class="item-number"
                :style="{ color: colorizeIndex(index) }"
              >
                {{ index + 1 }}.
              </span>
              <div class="item-details">
                <div
                  v-if="affiliateWallet(row.affiliate).icon"
                  class="item-label"
                >
                  <img
                    :src="affiliateWallet(row.affiliate).icon"
                    class="item-icon"
                  />
                  <span v-if="affiliateWallet(row.affiliate).addName">
                    {{ affiliateWallet(row.affiliate).name }}
                  </span>
                </div>
                <div v-else class="affiliate-name">{{ row.affiliate }}</div>
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
        required: true
      },
      data: {
        type: Array,
        required: true
      },
      sortKey: {
        type: String,
        required: true
      },
      limit: {
        type: Number,
        default: 30
      },
      isLoading: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      sortedData() {
        const filteredData = this.data.filter(d => d[this.sortKey])
        return orderBy(filteredData, [this.sortKey], ['desc']).slice(0, this.limit)
      }
    },
    methods: {
      colorizeIndex(index) {
        switch (index) {
          case 0: return '#FFD700'
          case 1: return '#EDE8DF'
          case 2: return '#CD7F32'
          default: return 'var(--font-color)'
        }
      },
      getAffiliateNames(name) {
        const affiliates = this.$parent.getAffiliateNames(name)
        return affiliates
      },
      affiliateWallet(affiliateName) {
        const detail = this.$parent.mapInterfaceName(affiliateName)
        return detail
          ? {
              icon: this.$parent.theme === 'light' ? detail.icons.url : detail.icons.urlDark,
              name: detail.name,
              addName: detail.addName,
            }
          : {
              icon: undefined,
              name: affiliateName,
            }
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .data-section {
    flex: 1;
  
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
        text-decoration: none;
  
        .item-number {
          font-weight: bold;
          margin-right: 13px;
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
          padding: 4px 0;
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
            font-size: 1.05rem;
            color: var(--sec-font-color);
            font-weight: bold;
          }
        }
      }
    }
  }
  </style>