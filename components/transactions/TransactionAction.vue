<template>
  <div>
    <div
      v-if="row && (type === 'swap' || type === 'switch')"
      :class="['action-cell', { 'no-border': noBorder }]"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell" v-tooltip="!showInlineUsd && getInUSD(row, ops)">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        />
        <div class="asset-info">
          <span class="asset-name">{{
            decimalFormat(getEffectiveInAmount(row, ops) / 1e8)
          }}</span>
          <span
            v-if="getInUSD(row, ops) && showInlineUsd"
            class="asset-usd"
          >
            {{ getInUSD(row, ops) }}
          </span>
        </div>
      </span>
      <stream-icon v-if="isPendingSwap(row)" class="action-type">
        ~
      </stream-icon>
      <right-arrow v-else class="action-type" />
      <span
        v-for="(coin, i) in groupedOutCoins"
        :key="'out-' + i"
        class="asset-cell"
        v-tooltip="!showInlineUsd && getOutUSD(row, coin)"
      >
        <asset-icon
          :asset="coin.asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <div class="asset-info">
          <span class="asset-name">{{
            decimalFormat(coin.amount / 1e8)
          }}</span>
          <span
            v-if="getOutUSD(row, coin) && showInlineUsd"
            class="asset-usd"
          >
            {{ getOutUSD(row, coin) }}
          </span>
        </div>
      </span>
      <template v-if="isPendingSwap(row)">
        <span
          v-if="
            pools &&
            row.metadata.swap &&
            row.metadata.swap.streamingSwapMeta &&
            row.metadata.swap.streamingSwapMeta.outEstimation
          "
          :class="['asset-cell', { 'pending-dots': !noBorder }]"
        >
          <asset-icon
            :asset="getOutAssetFromMemo(row.metadata.swap.memo, pools)"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          ></asset-icon>
          <span class="asset-name">
            {{
              decimalFormat(
                row.metadata.swap &&
                  row.metadata.swap.streamingSwapMeta.outEstimation / 1e8
              )
            }}
          </span>
        </span>
        <span v-else class="pending-cell">
          <span class="pending-dots">
            <span class="pending-text">Pending</span>
          </span>
        </span>
      </template>
      <template v-if="hasAffiliate(row)">
        <span>|</span>
        <div class="asset-cell">
          <affiliate
            :affiliate-address="getAffiliateAddress(row)"
            :use-new-icons="true"
          />
        </div>
      </template>
    </div>

    <div
      v-if="row && (type === 'limit_swap')"
      :class="['action-cell', { 'no-border': noBorder }]"
    >
      <span 
        v-if="row.in && row.in.length > 0 && row.in[0].coins[0]" 
        class="asset-cell"
      >
        <asset-icon
          :asset="row.in[0].coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        />
        <span class="asset-name">{{ decimalFormat(row.in[0].coins[0].amount / 1e8) }}</span>
      </span>
      <stream-icon class="action-type"> ~ </stream-icon>
      <span
        v-if="row.out && row.out.length > 0 && row.out[0].coins.length > 0"
        class="asset-cell"
      >
        <asset-icon
          :asset="row.out[0].coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{ decimalFormat(row.out[0].coins[0].amount / 1e8) }}</span>
      </span>
    </div>

    <div
      v-else-if="row && (type === 'withdraw' || type === 'runePoolWithdraw')"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-if="row.metadata.withdraw" class="asset-cell">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
          :asset="row.pools[0] || row.out[0].coins[0].asset"
        />
        <span class="mini-bubble yellow">
          <template v-if="row.metadata.withdraw.basisPoints">
            {{ (row.metadata.withdraw.basisPoints / 1e4) | percent(2) }}
          </template>
          <template v-else>
            {{ row.pools[0] || row.out[0].coins[0].asset }}
          </template>
        </span>
      </div>
      <right-arrow v-if="row.metadata.withdraw" class="action-type" />
      <template v-for="(ops, i) in row.out">
        <span :key="'out-' + i" class="asset-cell">
          <subtract-icon class="active-icon"></subtract-icon>
          <asset-icon
            :asset="ops.coins[0].asset"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          ></asset-icon>
          <span class="asset-name">
            {{ decimalFormat(ops.coins[0].amount / 1e8) }}
          </span>
        </span>
        <div
          v-if="row.out.length > 1 && i + 1 !== row.out.length"
          :key="'out-plus-' + i"
        >
          +
        </div>
      </template>
    </div>
    <div
      v-else-if="row && (type === 'addLiquidity' || type === 'runePoolDeposit')"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <template v-for="(ops, i) in row.in">
        <span :key="'in-' + i" class="asset-cell">
          <asset-icon
            :asset="ops.coins[0].asset"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          ></asset-icon>
          <span class="asset-name">{{
            decimalFormat(ops.coins[0].amount / 1e8)
          }}</span>
        </span>
        <div
          v-if="row.in.length > 1 && i + 1 !== row.in.length"
          :key="'in-plus-' + i"
        >
          +
        </div>
      </template>
      <right-arrow class="action-type" />
      <div class="asset-cell">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
          :asset="(row.pools && row.pools[0]) || row.in[0].coins[0].asset"
        />
        <span>
          {{ showAsset(row.pools && row.pools[0]) || row.in[0].coins[0].asset }}
        </span>
      </div>
      <template v-if="hasAffiliate(row)">
        <span>|</span>
        <div class="asset-cell">
          <affiliate
            :affiliate-address="getAffiliateAddress(row)"
            :use-new-icons="true"
          />
        </div>
      </template>
    </div>

    <div
      v-else-if="row && type === 'refund'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <span
        v-for="(ops, i) in row.in"
        :key="'in-' + i"
        class="asset-cell yellow-type"
      >
        <redo-icon class="active-icon"></redo-icon>
        <template v-if="ops.coins[0]">
          <asset-icon
            :asset="ops.coins[0].asset"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          ></asset-icon>
          <span class="asset-name">{{
            decimalFormat(ops.coins[0].amount / 1e8)
          }}</span>
        </template>
      </span>
    </div>

    <div
      v-else-if="row && type === 'send'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-if="row.status === 'failed'" class="asset-cell">
        <info-icon
          v-tooltip="row.metadata.send.reason"
          class="action-type red reason"
        />
      </div>
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <template v-if="ops.coins.length > 0">
          <asset-icon
            :asset="ops.coins[0].asset"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          />
          <span class="asset-name">{{
            decimalFormat(+ops.coins[0].amount / 1e8)
          }}</span>
        </template>
        <template v-else>
          <asset-icon
            :asset="'THOR.RUNE'"
            :height="'1.2rem'"
            :chain-height="'0.8rem'"
          />
          <span class="asset-name">{{ decimalFormat(0) }}</span>
        </template>
      </span>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <wallet-icon class="active-icon"></wallet-icon>
        <Address :address="ops.address" :show-copy-icon="false" />
      </span>
    </div>

    <div
      v-else-if="row && type === 'tcy_claim'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <add-icon class="active-icon"></add-icon>
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </div>
    </div>

    <div
      v-else-if="row && type === 'tcy_unstake'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <subtract-icon class="active-icon"></subtract-icon>
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </div>
    </div>

    <div
      v-else-if="row && type === 'tcy_stake'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <add-icon class="active-icon"></add-icon>
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </div>
    </div>

    <div
      v-else-if="row && type === 'bond'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <add-icon class="active-icon"></add-icon>
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <div class="asset-cell">
        <node-icon class="active-icon"></node-icon>
        <nuxt-link
          class="clickable mono"
          :to="`/node/${row.metadata.bond.nodeAddress}`"
        >
          {{ addressFormatV2(row.metadata.bond.nodeAddress) }}
        </nuxt-link>
      </div>
    </div>

    <div
      v-else-if="row && type === 'unbond'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div class="asset-cell">
        <node-icon class="active-icon"></node-icon>
        <nuxt-link
          class="clickable mono"
          :to="`/node/${row.metadata.bond.nodeAddress}`"
        >
          {{ addressFormatV2(row.metadata.bond.nodeAddress) }}
        </nuxt-link>
      </div>
      <right-arrow class="action-type" />
      <div v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </div>
    </div>

    <div
      v-else-if="(row && type === 'trade') || type === 'secure'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <div>
        <vault-icon class="action-icon" />
      </div>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
    </div>

    <div
      v-else-if="row && type === 'failed'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <div v-if="row.metadata && row.metadata.failed" class="asset-cell">
        <span>
          {{ parseMemoToTxType(row.metadata.failed.memo) }}
        </span>
        <right-arrow class="action-type" />
        <info-icon
          v-tooltip="row.metadata.failed.reason"
          class="action-type reason"
        >
        </info-icon>
      </div>
    </div>

    <div
      v-else-if="row && type === 'thorname'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <template v-if="row.metadata && row.metadata.thorname">
        <span class="asset-cell">
          {{ row.metadata.thorname.thorname }}
        </span>
        <right-arrow class="action-type" />
        <span class="asset-cell">
          <asset-icon
            :height="'1.2rem'"
            :asset="baseChainAsset(row.metadata.thorname.chain)"
          />
          <Address
            :address="row.metadata.thorname.address"
            :show-copy-icon="false"
            :use-custom-name="true"
          />
        </span>
      </template>
    </div>

    <div
      v-else-if="row && type === 'contract' && row.metadata.contract"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <template
        v-if="
          row.metadata.contract.contractType === 'wasm-rujira-merge/deposit'
        "
      >
        <div class="asset-cell">
          <asset-icon
            :height="'1.2rem'"
            :asset="parseCosmosAsset(row.metadata.contract.funds)"
          />
          <span class="asset-name">{{
            decimalFormat(row.metadata.contract.attributes.amount / 1e8)
          }}</span>
        </div>
        <right-arrow class="action-type" />
        <div class="asset-cell">
          <span style="margin-right: 0.5rem">Shares:</span>
          <span class="asset-name">{{
            decimalFormat(row.metadata.contract.attributes.shares / 1e8)
          }}</span>
        </div>
      </template>
      <span v-else>
        {{ row.metadata.contract.msg }}
      </span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import RightArrow from '~/assets/images/arrow-right.svg?inline'
import VaultIcon from '~/assets/images/safe.svg?inline'
import RedoIcon from '~/assets/images/refresh.svg?inline'
import InfoIcon from '~/assets/images/info.svg?inline'
import AddIcon from '~/assets/images/add.svg?inline'
import NodeIcon from '~/assets/images/node.svg?inline'
import WalletIcon from '~/assets/images/wallet.svg?inline'
import SubtractIcon from '~/assets/images/subtract.svg?inline'
import StreamIcon from '~/assets/images/stream.svg?inline'
import { assetFromString, parseMemoToTxType } from '~/utils'
import Address from '~/components/transactions/Address.vue'

export default {
  components: {
    RightArrow,
    Address,
    VaultIcon,
    InfoIcon,
    AddIcon,
    NodeIcon,
    WalletIcon,
    SubtractIcon,
    RedoIcon,
    StreamIcon,
  },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
    showMiniBubble: {
      type: Boolean,
      default: true,
    },
    noBorder: {
      type: Boolean,
      default: false,
    },
    wrap: {
      type: Boolean,
      default: false,
    },
    showInlineUsd: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
      pools: 'getPools',
    }),
    type() {
      if (this.row.type === 'swap') {
        const txType = this.row.metadata?.swap?.txType
        if (txType === 'add') {
          return 'addLiquidity'
        }
        if (txType === 'withdraw') {
          return 'withdraw'
        }
        return this.row?.type
      }
      return this.row?.type
    },
    groupedOutCoins() {
      if (!this.row || !this.row.out) {
        return []
      }

      const nonAffiliateOuts = this.row.out.filter((o) => !o.affiliate)
      const grouped = {}

      nonAffiliateOuts.forEach((ops) => {
        if (ops.coins && ops.coins.length > 0) {
          const coin = ops.coins[0]
          const asset = coin.asset

          const { trade, secure } = assetFromString(asset)

          if (grouped[asset]) {
            if (trade || secure) {
              return
            }
            grouped[asset].amount += +coin.amount
          } else {
            grouped[asset] = {
              asset: asset,
              amount: +coin.amount,
            }
          }
        }
      })

      return Object.values(grouped)
    },
  },
  methods: {
    isPendingSwap(row) {
      return (
        row.out == undefined || row.out.length === 0 || row.status === 'pending'
      )
    },
    parseMemoToTxType(memo) {
      return parseMemoToTxType(memo)
    },
    hasAffiliate(row) {
      return (
        row.metadata?.swap?.affiliateAddress ||
        row.metadata?.addLiquidity?.affiliateAddress
      )
    },
    getAffiliateAddress(row) {
      return (
        row.metadata?.swap?.affiliateAddress ||
        row.metadata?.addLiquidity?.affiliateAddress ||
        ''
      )
    },
    getEffectiveInAmount(row, ops) {
      const amount = +ops?.coins?.[0]?.amount || 0
      const streamingInCoin =
        +row?.metadata?.swap?.streamingSwapMeta?.depositedCoin?.amount || 0
      return streamingInCoin > amount ? streamingInCoin : amount
    },
    getInUSD(row, ops) {
      if (!row?.metadata?.swap?.inPriceUSD || !ops?.coins?.[0]) {
        return null
      }
      const inPriceUSD = row.metadata.swap.inPriceUSD
      const inAmount = this.getEffectiveInAmount(row, ops)
      const inUSD = (inPriceUSD * inAmount) / 1e8
      return this.$options.filters.currency(inUSD)
    },
    getOutUSD(row, coin) {
      if (!coin) {
        return null
      }
      // Refund coins (same asset as inbound) should use inPriceUSD
      const inAsset = row?.in?.[0]?.coins?.[0]?.asset
      const isRefund = inAsset && coin.asset === inAsset
      if (isRefund) {
        const inPriceUSD = row?.metadata?.swap?.inPriceUSD
        if (!inPriceUSD) return null
        const outUSD = (inPriceUSD * coin.amount) / 1e8
        return this.$options.filters.currency(outUSD)
      }
      if (!row?.metadata?.swap?.outPriceUSD) {
        return null
      }
      const outPriceUSD = row.metadata.swap.outPriceUSD
      const outUSD = (outPriceUSD * coin.amount) / 1e8
      return this.$options.filters.currency(outUSD)
    },
  },
}
</script>

<style lang="scss" scoped>
.no-bubble {
  display: flex;
  padding: $space-8 $space-0;
  gap: 5px;
  align-items: center;
}

.action-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  border-radius: $radius-sm;
  &.no-border {
    display: flex;
    flex-wrap: wrap;
  }
  .action-type {
    box-sizing: content-box;
    height: 1rem;
    width: 1rem;
    fill: var(--sec-font-color);
    padding: $space-4;

    &.small {
      height: 0.8rem;
      width: 0.8re;
    }

    &.reason {
      cursor: pointer;

      &:hover {
        fill: var(--red);
      }
    }

    &.red {
      fill: var(--red);
    }
  }

  .action-icon {
    box-sizing: content-box;
    border-radius: $radius-s;
    height: 1.2rem;
    width: 1.2rem;
    padding: $space-4 $space-0;
    fill: #21c187;
  }

  .icon-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: $space-5;
    border: 1px solid var(--border-color);
    border-radius: $radius-2xl;
  }

  .asset-cell {
    display: flex;
    align-items: center;

    padding: $space-8;
    border-radius: $radius-sm;
    border: 1px solid var(--border-color);
    background-color: var(--bgl-color);

    .active-icon {
      height: 1rem;
      width: 1rem;
      fill: var(--sec-font-color);
      margin-right: $space-5;
    }

    .asset-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    &.yellow-type {
      border-style: dashed;
      border-color: #f39d1256;
    }

    cursor: pointer;

    &:hover {
      background-color: rgba(33, 193, 135, 0.04);
      border-color: rgba(33, 193, 135, 0.18);
    }
  }

  &.no-border {
    .asset-cell {
      border: none;
      background-color: transparent;
      padding: 0;
    }
  }

  .executed {
    display: flex;
    align-items: center;
    color: var(--sec-font-color);
    border-color: var(--border-color);
    background-color: transparent;
    gap: 3px;
    img {
      height: 0.9rem;
    }
  }

  .pending-cell {
    display: flex;
    align-items: center;
    gap: $space-8;
    color: var(--sec-font-color);
    font-weight: bold;
  }

  .pending-text {
    font-weight: bold;
    color: #d86e58;
  }

  .pending-dots {
    position: relative;
    padding: $space-5 $space-8;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border: 1px solid var(--border-color);
    border-radius: $radius-sm;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border: 1px solid #d86e58;
      border-radius: $radius-sm;
      transition: all 0.5s;
      animation: clippath 3s infinite linear;
    }

    .pending-text {
      font-size: $font-size-xxs;
    }
  }

  @keyframes clippath {
    0%,
    100% {
      clip-path: inset(0 0 80% 0);
    }
    25% {
      clip-path: inset(0 80% 0 0);
    }
    50% {
      clip-path: inset(80% 0 0 0);
    }
    75% {
      clip-path: inset(0 0 0 80%);
    }
  }

  @keyframes sandTimerRotate {
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    40% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .asset-name {
    font-size: 0.9rem;
    line-height: $font-size-sm;
  }

  .asset-usd {
    font-size: $font-size-xxs;
    color: var(--sec-font-color);
    opacity: 0.7;
    line-height: 1;
  }

  small.asset-name {
    font-size: $font-size-s;
    padding: $space-5;
    background-color: var(--bgt-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    transition: all 0.2s ease;
  }
}
</style>
