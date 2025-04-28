<template>
  <div>
    <div
      v-if="row && (type === 'swap' || type === 'switch')"
      :class="['action-cell', { 'no-border': noBorder }]"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        />
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span
        v-for="(ops, i) in row.out.filter((o) => !o.affiliate)"
        :key="'out-' + i"
        class="asset-cell"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <span
        v-if="
          row.out == undefined ||
          row.out.length === 0 ||
          row.status === 'pending'
        "
        class="pending-cell"
      >
      <span class="pending-dots">
        <span class="pending-text">Pending</span>
      </span>
      </span>
      <template v-if="hasAffiliate(row)">
        <span>|</span>
        <template v-for="affiliate in hasAffiliate(row)">
          <div :key="affiliate" class="executed">
            <small v-if="!affiliateWallet(affiliate).icon">Affiliate</small>
            <img
              v-if="affiliateWallet(affiliate).icon"
              :src="affiliateWallet(affiliate).icon"
              :alt="affiliateWallet(affiliate).name"
            />
            <em v-else>{{ affiliateWallet(affiliate).name }}</em>
          </div>
        </template>
      </template>
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
        <template v-for="affiliate in hasAffiliate(row)">
          <div :key="affiliate" class="executed">
            <small v-if="!affiliateWallet(affiliate).icon">Affiliate</small>
            <img
              v-if="affiliateWallet(affiliate).icon"
              :src="affiliateWallet(affiliate).icon"
              :alt="affiliateWallet(affiliate).name"
            />
            <em v-else>{{ affiliateWallet(affiliate).name }}</em>
          </div>
        </template>
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
      v-else-if="row && type === 'send'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'0.8rem'"
        />
        <span class="asset-name">{{
          decimalFormat(+ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <wallet-icon class="active-icon"></wallet-icon>
        <nuxt-link class="clickable" :to="`/address/${ops.address}`">
          {{ addressFormatV2(ops.address) }}
        </nuxt-link>
      </span>
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
          class="clickable"
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
          class="clickable"
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
        <span>
          <asset-icon
            :height="'1.2rem'"
            :asset="baseChainAsset(row.metadata.thorname.chain)"
          />
          <nuxt-link
            class="clickable"
            :to="`/address/${row.metadata.thorname.address}`"
          >
            {{ addressFormatV2(row.metadata.thorname.address, 4) }}
          </nuxt-link>
        </span>
        <right-arrow class="action-type" />
        <span>
          {{ row.metadata.thorname.thorname }}
        </span>
      </template>
    </div>

    <div
      v-else-if="row && type === 'contract'"
      :class="['action-cell', { 'no-border': noBorder, wrap: wrap }]"
    >
      <span>
        {{ row.metadata.contract.contractType }}
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
import { parseMemoToTxType } from '~/utils'

export default {
  components: {
    RightArrow,
    VaultIcon,
    InfoIcon,
    AddIcon,
    NodeIcon,
    WalletIcon,
    SubtractIcon,
    RedoIcon,
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
  },
  computed: {
    ...mapGetters({
      theme: 'getTheme',
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
  },
  methods: {
    hasAffiliate(row) {
      if (
        !row.metadata?.swap?.affiliateAddress &&
        !row.metadata?.addLiquidity?.affiliateAddress
      ) {
        return false
      }

      const affiliates =
        row.metadata?.swap?.affiliateAddress ||
        row.metadata?.addLiquidity?.affiliateAddress
      return affiliates.split('/')
    },
    affiliateWallet(affiliate) {
      if (!affiliate) {
        return
      }
      const detail = affiliate && this.mapAffiliateName(affiliate)

      if (!detail) {
        return {
          name: affiliate,
        }
      }

      return {
        icon: this.theme === 'light' ? detail.icons.url : detail.icons.urlDark,
        name: detail.name,
      }
    },
    parseMemoToTxType(memo) {
      return parseMemoToTxType(memo)
    },
  },
}
</script>

<style lang="scss" scoped>
.no-bubble {
  display: flex;
  padding: 8px 0;
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
  border-radius: 4px;
  &.no-border {
    display: flex;
    flex-wrap: wrap;
  }
  .action-type {
    box-sizing: content-box;
    height: 1rem;
    width: 1rem;
    fill: var(--sec-font-color);
    padding: 4px;

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
  }

  .action-icon {
    box-sizing: content-box;
    border-radius: 5px;
    height: 1.2rem;
    width: 1.2rem;
    padding: 4px 0;
    fill: #21c187;
  }

  .icon-box {
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 0.375rem;
    border: 1px solid var(--border-color);
    border-radius: 1rem;
  }

  .asset-cell {
    display: flex;
    align-items: center;

    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    background-color: var(--bgl-color);

    .active-icon {
      height: 1rem;
      width: 1rem;
      fill: var(--sec-font-color);
      margin-right: 5px;
    }

    &.yellow-type {
      border-style: dashed;
      border-color: #f39d1256;
    }
  }

  &.no-border {
    .asset-cell {
      border: none;
      background-color: transparent;
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
  gap: 8px;
  color: var(--sec-font-color);
  font-weight: bold;
}

.pending-dots  {
  position: relative;
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid #d86e58;
    border-radius: 0.2rem;
    transition: all 0.5s;
    animation: clippath 3s infinite linear;
  }
}


.pending-text {
  color: #d86e58;
  font-size: 10px;
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
    line-height: 14px;
  }

  small.asset-name {
    font-size: 0.775rem;
    padding: 0.375rem;
    background-color: var(--bgt-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
  }
}
</style>
