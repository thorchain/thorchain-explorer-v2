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
          <img
            v-if="ifc.icons && ifc.icons.url"
            :src="theme === 'light' ? ifc.icons.url : ifc.icons.urlDark"
            class="interface-image"
            alt="interface image"
            :title="ifc.name"
          />
          <span v-else>{{ ifc.name }}</span>
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
                  <span class="mono sec-color">{{
                    o.amount
                      ? o.filter
                        ? o.filter(o.amount)
                        : baseAmountFormatOrZero(o.amount)
                      : '...'
                  }}</span>
                  <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
                </div>
                <small>{{
                  o.amountUSD ? formatBnCurrency(o.amountUSD) : '...'
                }}</small>
              </template>
              <div v-else class="tx-asset">
                <component
                  :is="o.icon"
                  :class="['asset-icon', 'custom-icon', o.class]"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-if="overall.middle" class="tx-middle">
          <div class="tx-state">
            <warning-icon
              v-if="overall.middle.fail"
              class="icon tx-icon warn"
            />
            <div v-else-if="overall.middle.pending" class="simple-spinner" />
            <send-icon v-else-if="overall.middle.send" class="icon tx-icon" />
            <send-icon v-else class="icon tx-icon" />
          </div>
        </div>

        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.out"
            :key="i + '-o-out'"
            class="tx-outbound"
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
                <small>{{
                  o.amountUSD ? formatBnCurrency(o.amountUSD) : '...'
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
      return this.txData?.interface ?? undefined
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
        '--left-border':
          this.assetColorPalette(this.overall.in[0]?.asset) ?? '#5CDFBD',
        '--right-border': this.overall.out[0]?.borderColor
          ? this.overall.out[0]?.borderColor
          : (this.assetColorPalette(this.overall.out[0]?.asset) ??
            (this.$store?.state?.darkTheme ? '#87e9b5' : '#3ca38b')),
      }
    },
  },
}
</script>

<style lang="scss" scoped>
$border-size: 2px;
.tx-card {
  width: 100%;
  max-width: 640px;
  margin: auto;
  background-color: var(--card-bg-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);

  .tx-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 5px;
    padding: 1rem 1.5rem;
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
    padding: 1rem 1.5rem;

    .tx-assets-status {
      display: flex;
      align-items: center;
    flex-wrap: wrap;
    flex-direction: column;

    @include sm{
flex-direction: row;
    }

      .tx-asset {
        display: flex;

        .custom-icon {
          margin: 0;
          width: 2rem;
          height: 2rem;
          fill: var(--sec-font-color);
        }

        .pad-icon {
          padding: 3px;
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
          margin: 0;
          padding: 3px;

          &.warn {
            padding: 0;
            fill: rgb(155 28 28);
          }
        }
      }

      .tx-wrapper {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.5rem;
      }

      .tx-inbound,
      .tx-outbound {
        display: flex;
        align-items: center;
      }
      .inbound-info,
      .outbound-info {
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
        gap: 0.4rem;
      }
      .amount-info {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 6px;
      }

      .tx-outbound {
        background-color: var(--card-bg);
        padding: 8px;
        justify-content: end;
        border: 2px solid var(--right-border);

        border-radius: 0.5rem;
        .tx-asset {
          .custom-icon {
            fill: var(--right-border);
          }
        }
      }

      .tx-inbound {
        background-color: var(--card-bg);
        padding: 8px;
        border: 2px solid var(--left-border);
        border-radius: 0.5rem;

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
      margin-top: 1rem;
      padding: 0 0.5rem;

      .tx-wrapper {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.5rem;

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
    margin-bottom: 0.5rem;
  }
}

.simple-spinner {
  border-color: var(--left-border);
  border-top-color: var(--card-bg-color);
}

.interface {
  display: flex;
  align-items: center;
  gap: 8px;

  .interface-image {
    display: inline-block;
    max-width: 100px;
    max-height: 25px;
  }
}

[theme='dark'] .tx-icon.warn {
  fill: #f04832 !important;
}
</style>
