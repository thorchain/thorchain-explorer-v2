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
    padding: $space-16;

    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-s $radius-s 0 0;
    border-bottom: none;

    .stat-header-btn {
      background-color: transparent;
      border: none;
    }

    .stat-header-text {
      display: flex;
      align-items: center;
      font-size: $font-size-md;
      font-weight: 700;
    }

    .header-icon {
      margin-right: $space-10;
      height: 1.5rem;
    }
  }

  .stat-table-container {
    background-color: var(--bg-color);
    border-radius: 0 0 $radius-s $radius-s;
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
      padding: $space-8 $space-16;
      flex: 1 0;

      .img-div {
        display: inherit;
        img {
          border-radius: $radius-full;
          margin-right: $space-8;
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
          font-size: $font-size-s;
        }

        .danger-text {
          color: #f04832 !important;
        }

        &.flex-item {
          display: flex;
          gap: $space-5;
        }
      }

      .col-header {
        display: flex;
        font-size: $font-size-xs;

        .header-icon {
          margin-left: $space-5;
          fill: var(--font-color);
          margin-right: $space-10;
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
  margin: $space-0;
}

pre.rune-value {
  font-family: 'Roboto Mono';
  font-size: $font-size-s;
}

.value-item {
  font-family: 'Roboto Mono';
  font-size: $font-size-s;
}

.stat-loader {
  max-width: 150px;
}
</style>
