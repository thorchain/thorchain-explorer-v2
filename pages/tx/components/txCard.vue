<template>
  <div class="tx-card" :style="vars">
    <div v-if="title || labels.length > 0" class="tx-header">
      <div class="tx-header-l">
        <span class="tx-title">
          {{ title | capitalize }}
        </span>
      </div>
      <div class="tx-header-r">
        <div v-for="n in labels" :key="n" class="bubble-container">
          {{ n }}
        </div>
        <div v-if="ifc" class="interface mono">
          <small> executed on </small>
          <affiliate :affiliate-address="ifc" />
        </div>
      </div>
    </div>

    <div class="tx-overall">
      <div class="tx-assets-status">
        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.in"
            :key="i + '-o-in'"
            class="tx-inbound"
          >
            <div v-if="o.asset" class="tx-asset">
              <AssetIcon
                :classes="['no-margin']"
                :asset="o.asset"
                :height="'2rem'"
              />
            </div>
            <div class="inbound-info">
              <template v-if="o.text">
                <span class="mono sec-color">{{ o.text }}</span>
              </template>
              <template v-else-if="o.address">
                <nuxt-link
                  class="mono clickable"
                  :to="`/address/${o.address}`"
                  >{{ formatAddress(o.address) }}</nuxt-link
                >
              </template>
              <template v-else>
                <div class="amount-info">
                  <span class="mono sec-color">
                    {{
                      (o.amount || o.amount === 0) && !isNaN(o.amount)
                        ? o.filter
                          ? o.filter(o.amount)
                          : baseAmountFormatOrZero(o.amount)
                        : '...'
                    }}</span
                  >
                  <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
                </div>
                <small v-if="o.amountUSD">{{
                  formatBnCurrency(o.amountUSD)
                }}</small>
                <div class="tx-asset">
                  <component
                    :is="o.icon"
                    :class="['asset-icon', 'custom-icon', o.class]"
                  />
                </div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="overall.middle" class="tx-middle">
          <div class="tx-state">
            <warning-icon
              v-if="overall.middle.fail"
              class="icon tx-icon-warn warn"
            />
            <div v-else-if="overall.middle.pending" class="tx-spinner">
              <!-- <div class="border-bottom-spinner"></div> -->
            </div>
            <send-icon v-else-if="overall.middle.send" class="icon tx-icon" />
            <send-icon v-else class="icon tx-icon" />
          </div>
        </div>

        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.out"
            :key="i + '-o-out'"
            class="tx-outbound"
            :style="getBorderColor(o.asset)"
          >
            <div class="outbound-info">
              <template v-if="o.text">
                <span class="mono sec-color">{{ o.text }}</span>
              </template>
              <template v-else-if="o.address">
                <nuxt-link
                  class="mono clickable"
                  :to="`/address/${o.address}`"
                  >{{ formatAddress(o.address) }}</nuxt-link
                >
              </template>
              <template v-else>
                <div class="amount-info">
                  <span class="mono sec-color">{{
                    o.amount
                      ? o.filter
                        ? o.filter(o.amount)
                        : baseAmountFormatOrZero(o.amount)
                      : '...'
                  }}</span>
                  <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
                </div>
                <small v-if="o.amountUSD">{{
                  formatBnCurrency(o.amountUSD)
                }}</small>
              </template>
            </div>

            <div v-if="o.asset" class="tx-asset">
              <AssetIcon
                :classes="['no-margin']"
                :asset="o.asset"
                :height="'2rem'"
              />
            </div>
            <div v-else class="tx-asset">
              <component
                :is="o.icon"
                :class="[{ 'asset-icon': !o.icon }, 'custom-icon', o.class]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="accordions">
      <!-- inbound accordion -->
      <slot name="accordion-in-0" />
      <slot name="accordion-in-1" />

      <!-- action accordion -->
      <slot name="accordion-action" />

      <!-- outbound accordion -->
      <slot name="accordion-out-0" />
      <slot name="accordion-out-1" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import SendIcon from '~/assets/images/arrow-right.svg?inline'
import WarningIcon from '~/assets/images/warning.svg?inline'

export default {
  components: {
    SendIcon,
    WarningIcon,
  },
  props: ['txData'],
  computed: {
    ...mapGetters({
      theme: 'getTheme',
    }),
    title() {
      return this.txData?.title ?? ''
    },
    ifc() {
      return this.txData?.interface ?? ''
    },
    labels() {
      return this.txData?.labels ?? []
    },
    overall() {
      return {
        in: this.txData?.overall?.in ?? [],
        middle: this.txData?.overall?.middle ?? {
          pending: false,
        },
        out: this.txData?.overall?.out ?? [],
      }
    },
    vars() {
      return {
        '--left-border': this.overall.middle?.fail
          ? '#EF5350'
          : (this.assetColorPalette(this.overall.in[0]?.asset) ?? '#5CDFBD'),
        '--right-border': this.overall.middle?.fail
          ? '#EF5350'
          : this.overall.out[0]?.borderColor
            ? this.overall.out[0]?.borderColor
            : (this.assetColorPalette(this.overall.out[0]?.asset) ??
              (this.$store?.state?.darkTheme ? '#87e9b5' : '#3ca38b')),
      }
    },
  },
  methods: {
    getBorderColor(asset) {
      if (!asset) {
        return
      }

      return {
        borderColor: this.assetColorPalette(asset),
      }
    },
  },
}
</script>

<style lang="scss" scoped>
$border-size: 2px;
.tx-card {
  max-width: 680px;
  background-color: var(--card-bg-color);
  border-radius: $radius-lg;
  border: 1px solid var(--border-color);
  margin: $space-0 $space-10;

  @include lg {
    margin: auto;
    width: 100%;
  }

  .tx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: $space-16 $space-24;
    border-bottom: 1px solid var(--border-color);

    .tx-title {
      color: var(--sec-font-color);
    }
  }
  .tx-middle {
    display: flex;
    align-items: center;
  }
  .tx-overall {
    margin: $space-16 $space-12;

    .tx-assets-status {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      flex-direction: column;
      gap: 0.5rem;

      @include sm {
        flex-direction: row;
        gap: $space-0;
      }

      .tx-asset {
        display: flex;

        .custom-icon {
          margin: $space-0;
          width: 2rem;
          height: 2rem;
          fill: var(--sec-font-color);
        }

        .pad-icon {
          padding: $space-3;
          fill: var(--bg-color);
        }
      }

      .tx-state {
        height: 30px;
        width: 40px;

        display: flex;
        align-items: center;
        justify-content: center;

        .tx-icon {
          margin: $space-0;
          padding: $space-3;
          transform: rotate(90deg);
          @include sm {
            transform: rotate(0deg);
          }
        }
        .tx-icon-warn {
          margin: $space-0;
          padding: $space-3;
          &.warn {
            padding: $space-0;
            fill: rgb(239, 83, 80);
          }
        }
      }

      .tx-wrapper {
        width: 100%;
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: $space-8;
      }

      .tx-inbound,
      .tx-outbound {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .inbound-info,
      .outbound-info {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
      }
      .amount-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;

        .mono {
          font-size: $font-size-xs;

          @include md {
            font-size: $font-size-mobile;
          }
        }
      }

      .tx-outbound {
        background-color: var(--card-bg);
        padding: $space-8;
        justify-content: end;
        border: 2px solid var(--right-border);

        border-radius: $radius-lg;
        .tx-asset {
          .custom-icon {
            fill: var(--right-border);
          }
        }
      }

      .tx-inbound {
        background-color: var(--card-bg);
        padding: $space-8;
        border: 2px solid var(--left-border);
        border-radius: $radius-lg;

        .tx-asset {
          .custom-icon {
            fill: var(--right-border);
          }
        }
      }
    }

    .tx-assets-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: $space-16;
      padding: $space-0 $space-8;

      .tx-wrapper {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: $space-8;

        .asset-outbound {
          text-align: end;
          justify-content: end;
        }
      }
    }
  }

  .accordions {
    display: flex;
    flex-direction: column;
    gap: $space-12;
    margin-bottom: $space-12;
  }
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.tx-spinner {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: $radius-full;
  animation: rotation 1.5s linear infinite;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 22px;
    height: 22px;
    border-radius: $radius-full;
    border: 3px solid transparent;
    border-bottom: 3px solid var(--left-border);
    border-right: 3px solid var(--left-border);
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    width: 22px;
    height: 22px;
    border-radius: $radius-full;
    border: 3px solid transparent;
    border-top: 3px solid var(--right-border);
    border-left: 3px solid var(--right-border);
  }
}

.interface {
  display: flex;
  align-items: center;
  gap: 8px;

  .interface-image {
    display: inline-block;
    max-width: 70px;
    max-height: 25px;
  }
}

[theme='dark'] .tx-icon.warn {
  fill: #f04832 !important;
}
</style>
