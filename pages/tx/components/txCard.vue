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
            <div v-else class="tx-asset">
              <component
                :is="o.icon"
                :class="['asset-icon', 'custom-icon', o.class]"
              />
            </div>
            <div v-if="i < 1" class="simple-bar" />
          </div>
        </div>

        <div v-if="overall.middle" class="tx-middle">
          <div class="tx-state-wrapper">
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
        </div>

        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.out"
            :key="i + '-o-out'"
            class="tx-outbound"
          >
            <div v-if="i < 1" class="simple-bar" />
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
                :class="['asset-icon', 'custom-icon', o.class]"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="tx-assets-info">
        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.in"
            :key="i + '-in'"
            class="asset-inbound"
          >
            <template v-if="o.text">
              <span class="mono sec-color">{{ o.text }}</span>
            </template>
            <template v-else-if="o.address">
              <nuxt-link class="mono clickable" :to="`/address/${o.address}`">{{
                formatAddress(o.address)
              }}</nuxt-link>
            </template>
            <template v-else>
              <span class="mono sec-color">{{
                o.amount
                  ? o.filter
                    ? o.filter(o.amount)
                    : baseAmountFormatOrZero(o.amount)
                  : '...'
              }}</span>
              <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
              <br /><small>{{
                o.amountUSD ? formatBnCurrency(o.amountUSD) : '...'
              }}</small>
            </template>
          </div>
        </div>

        <div class="tx-wrapper">
          <div
            v-for="(o, i) in overall.out"
            :key="i + '-out'"
            class="asset-outbound"
          >
            <template v-if="o.text">
              <span class="mono sec-color">{{ o.text }}</span>
            </template>
            <template v-else-if="o.address">
              <nuxt-link class="mono clickable" :to="`/address/${o.address}`">{{
                formatAddress(o.address)
              }}</nuxt-link>
            </template>
            <template v-else>
              <span class="mono sec-color">{{
                o.amount
                  ? o.filter
                    ? o.filter(o.amount)
                    : baseAmountFormatOrZero(o.amount)
                  : '...'
              }}</span>
              <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
              <br /><small>{{
                o.amountUSD ? formatBnCurrency(o.amountUSD) : '...'
              }}</small>
            </template>
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

  .tx-overall {
    padding: 1rem 1.5rem;

    .tx-assets-status {
      display: flex;

      .tx-asset {
        display: flex;
        border: 2px solid var(--left-border);
        border-radius: 100%;

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

      .tx-state-wrapper {
        background: #385a94;
        border-radius: 50%;
        height: 32px;
        width: 32px;
        position: relative;
        background: linear-gradient(
          to left,
          var(--right-border),
          var(--left-border)
        );

        .tx-state {
          background: var(--card-bg-color);
          position: absolute;
          border-radius: 50%;
          height: 26px;
          width: 26px;
          top: 50%;
          left: 50%;
          margin: -13px 0px 0px -13px;

          display: flex;
          align-items: center;
          justify-content: center;

          .tx-icon {
            border-radius: 100%;
            margin: 0;
            padding: 3px;
            fill: var(--sec-font-color);

            &.warn {
              padding: 0;
              fill: rgb(155 28 28);
            }
          }
        }
      }

      .simple-bar {
        width: 100%;
        height: $border-size;
        background: var(--left-border);
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

      .tx-outbound {
        justify-content: end;
        .tx-asset,
        .simple-bar {
          border-color: var(--right-border);
          background: var(--right-border);

          .custom-icon {
            fill: var(--card-bg-color);
          }
        }
      }

      .tx-inbound {
        .tx-asset,
        .simple-bar {
          border-color: var(--left-border);
          background: var(--left-border);

          .custom-icon {
            fill: var(--card-bg-color);
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
