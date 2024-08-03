<template>
  <Card
    :is-loading="isLoading || !(tableSettings && tableSettings.length > 0)"
    extra-class="stat-table"
    :title="header"
    :img-src="iconSrc"
  >
    <div class="stat-table-container">
      <div v-for="(row, ri) in tableSettings" :key="ri" class="stat-table-row">
        <div
          v-for="(colItem, ci) in row"
          :key="ci + ',' + ri"
          class="stat-table-group"
        >
          <div v-if="colItem.image" class="img-div">
            <img :src="colItem.image" alt="item-icon" />
          </div>
          <div class="stat-table-item">
            <div class="col-header">
              {{ colItem.name }}
              <unknown-icon
                v-if="colItem.extraInfo"
                v-tooltip="colItem.extraInfo"
                class="header-icon"
              />
            </div>
            <div
              :class="[
                'col-value',
                'value-item',
                { 'flex-item': colItem.progress && colItem.value },
              ]"
            >
              <template v-if="!$slots[colItem.slotName]">
                <skeleton-item
                  custom-class="stat-loader"
                  :loading="
                    (!colItem.value && colItem.value !== 0) ||
                    colItem.is === true
                  "
                >
                  <template v-if="colItem.filter">
                    <pre
                      v-if="colItem.value && colItem.runeValue"
                      class="rune-value">{{ colItem.value | number('0,0.00') }} <small>RUNE</small></pre>
                    <pre v-else-if="colItem.value !== 0">{{
                      colItem.value || '-'
                    }}</pre>
                    <pre
                      v-if="colItem.value === 0"
                      :class="{ 'rune-value': colItem.runeValue }"
                    >
0</pre
                    >
                  </template>
                  <template v-else>
                    <skeleton-item
                      custom-class="stat-loader"
                      :loading="
                        colItem.value === undefined ||
                        colItem.value === NaN ||
                        colItem.value === null
                      "
                    >
                      {{ colItem.value | number('0,0') }}
                    </skeleton-item>
                  </template>
                </skeleton-item>
              </template>
              <slot v-else :name="colItem.slotName" :val="colItem.value" />
              <span v-if="colItem.value && colItem.usdValue" class="usd-value"
                >({{ (colItem.value * runePrice) | currency }})</span
              >
              <span
                v-if="colItem.extraText"
                :class="{ 'usd-value': true, ...colItem.extraTextClass }"
                >({{ colItem.extraText }})</span
              >
              <progress-icon
                v-if="colItem.progress && colItem.value"
                :data-number="colItem.progress.data"
                :is-down="colItem.progress.down"
                :filter="colItem.progress.filter"
              >
              </progress-icon>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script>
import { mapGetters } from 'vuex'
import { AssetCurrencySymbol } from '@xchainjs/xchain-util'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  name: 'StatTable',
  components: { UnknownIcon },
  props: {
    iconSrc: String,
    header: String,
    tableSettings: Array,
    isLoading: Boolean,
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
  },
  methods: {
    runeCur() {
      return AssetCurrencySymbol.RUNE
    },
  },
}
</script>

<style lang="scss">
.stat-table {
  width: 100%;

  .stat-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    padding: 1rem;

    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: 5px 5px 0 0;
    border-bottom: none;

    .stat-header-btn {
      background-color: transparent;
      border: none;
    }

    .stat-header-text {
      display: flex;
      align-items: center;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .header-icon {
      margin-right: 10px;
      height: 1.5rem;
    }
  }

  .stat-table-container {
    background-color: var(--bg-color);
    border-radius: 0 0 5px 5px;
    border: 1px solid var(--border-color);
  }

  .stat-table-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);

    &:last-of-type {
      border-bottom: none;
    }

    .stat-table-group {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      flex: 1 0;

      .img-div {
        display: inherit;
        img {
          border-radius: 50%;
          margin-right: 0.5rem;
          width: 1.5rem;
        }
      }
    }

    .stat-table-item {
      flex: 1;

      .col-value {
        color: var(--sec-font-color);

        .usd-value {
          color: var(--font-color);
          font-size: 0.8rem;
        }

        .danger-text {
          color: #f04832 !important;
        }

        &.flex-item {
          display: flex;
          gap: 5px;
        }
      }

      .col-header {
        display: flex;
        font-size: 0.75rem;

        .header-icon {
          margin-left: 5px;
          fill: var(--font-color);
          margin-right: 10px;
          height: 0.9rem;
          width: 0.9rem;
        }
      }
    }
  }
}

pre {
  font-family: 'Roboto Mono';
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
  margin: 0;
}

pre.rune-value {
  font-family: 'Roboto Mono';
  font-size: 0.8rem;
}

.value-item {
  font-family: 'Roboto Mono';
  font-size: 0.8rem;
}

.stat-loader {
  max-width: 150px;
}
</style>
