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
      </div>
    </div>

    <div class="tx-overall">
      <div class="tx-assets-status">
        <div class="tx-wrapper">
          <div v-for="(o, i) in overall.in" :key="i + '-o-in'" class="tx-inbound">
            <div class="tx-asset">
              <AssetIcon :classes="['no-margin']" :asset="o.asset" :height="'2rem'" />
            </div>
            <div v-if="i < 1" class="simple-bar" />
          </div>
        </div>

        <div v-if="overall.middle" class="tx-middle">
          <div class="tx-state-wrapper">
            <div class="tx-state">
              <div v-if="overall.middle.pending" class="simple-spinner" />
              <check-icon v-else class="icon tx-icon" />
            </div>
          </div>
        </div>

        <div class="tx-wrapper">
          <div v-for="(o, i) in overall.out" :key="i + '-o-out'" class="tx-outbound">
            <div v-if="i < 1" class="simple-bar" />
            <div class="tx-asset">
              <AssetIcon :classes="['no-margin']" :asset="o.asset" :height="'2rem'" />
            </div>
          </div>
        </div>
      </div>

      <div class="tx-assets-info">
        <div class="tx-wrapper">
          <div v-for="(o, i) in overall.in" :key="i + '-in'" class="asset-inbound">
            <span class="mono sec-color">{{ baseAmountFormatOrZero(o.amount) }}</span>
            <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
            <br><small>{{ o.amountUSD ? formatBnCurrency(o.amountUSD) : '...' }}</small>
          </div>
        </div>

        <div class="tx-wrapper">
          <div v-for="(o, i) in overall.out" :key="i + '-out'" class="asset-outbound">
            <span class="mono sec-color">{{ o.amount ? baseAmountFormatOrZero(o.amount) : '...' }}</span>
            <small class="mono sec-color">{{ showAsset(o.asset) }}</small>
            <br><small>{{ o.amountUSD ? formatBnCurrency(o.amountUSD) : '...' }}</small>
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
import CheckIcon from '~/assets/images/check.svg?inline'

export default {
  components: {
    CheckIcon
  },
  props: ['txData'],
  data () {
    return {
      title: this.txData?.title ?? '',
      labels: this.txData?.labels ?? [],
      overall: {
        in: this.txData?.overall?.in ?? [],
        middle: this.txData?.overall?.middle ?? {
          pending: false
        },
        out: this.txData?.overall?.out ?? []
      },
      accordion: {
        in: {
          stacks: this.txData?.accordion?.in?.stacks ?? []
        },
        action: {
          stacks: this.txData?.accordion?.action?.stacks ?? []
        },
        out: {
          stacks: this.txData?.accordion?.out?.stacks ?? []
        }
      }
    }
  },
  computed: {
    vars () {
      return {
        '--left-border': this.assetColorPalette(this.overall.in[0]?.asset) ?? '#5CDFBD',
        '--right-border': this.assetColorPalette(this.overall.out[0]?.asset) ?? '#3761F9'
      }
    }
  }

}
</script>

<style lang="scss" scoped>
$border-size: 2px;
.tx-card {
  width: 100%;
  max-width: 640px;
  margin: auto;
  background-color: var(--card-bg-color);
  border-radius: .5rem;
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
        border: 2px solid var(--left-border);
        border-radius: 100%;
      }

      .tx-state-wrapper {
        background: #385a94;
        border-radius: 50%;
        height: 30px;
        width: 30px;
        position: relative;
        background: linear-gradient(to left, var(--right-border), var(--left-border));

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
        gap: .5rem;
      }
      .tx-inbound, .tx-outbound {
        display: flex;
        align-items: center;
      }

      .tx-outbound {
        justify-content: end;
        .tx-asset, .simple-bar {
          border-color: var(--right-border);
          background: var(--right-border);
        }
      }
    }

    .tx-assets-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding: 0 .5rem;

      .tx-wrapper {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: .5rem;

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
    margin-bottom: .5rem;
  }
}

.simple-spinner {
  border-color: var(--left-border);
  border-top-color: var(--card-bg-color);
}
</style>
