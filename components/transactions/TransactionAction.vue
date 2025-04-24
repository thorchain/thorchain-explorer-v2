<template>
  <div>
    <div
      v-if="row && (type === 'swap' || type === 'switch')"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
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
          :chain-height="'1rem'"
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
        class="asset-cell"
      >
        Pending
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
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <div class="icon-box">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'1rem'"
          :asset="row.pools[0] || row.out[0].coins[0].asset"
        />
        <vault-icon class="action-icon" />
      </div>
      <div v-if="row.metadata.withdraw" class="mini-bubble yellow">
        {{ (row.metadata.withdraw.basisPoints / 1e4) | percent(2) }}
      </div>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
    </div>
    <div
      v-else-if="row && (type === 'addLiquidity' || type === 'runePoolDeposit')"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <div class="icon-box">
        <asset-icon
          :height="'1.2rem'"
          :chain-height="'1rem'"
          :asset="(row.pools && row.pools[0]) || row.in[0].coins[0].asset"
        />
        <vault-icon class="action-icon" />
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
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <redo-icon class="action-type" />
    </div>

    <div
      v-else-if="row && type === 'send'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        />
        <span class="asset-name">{{
          decimalFormat(+ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i" class="asset-cell">
        <nuxt-link class="clickable" :to="`/address/${ops.address}`">
          {{ addressFormatV2(ops.address) }}
        </nuxt-link>
      </span>
    </div>

    <div
      v-else-if="row && type === 'bond'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
      <right-arrow class="action-type" />
      <span>
        <nuxt-link
          class="clickable"
          :to="`/node/${row.metadata.bond.nodeAddress}`"
        >
          {{ addressFormatV2(row.metadata.bond.nodeAddress) }}
        </nuxt-link>
      </span>
    </div>

    <div
      v-else-if="row && type === 'unbond'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span>
        <nuxt-link
          class="clickable"
          :to="`/node/${row.metadata.bond.nodeAddress}`"
        >
          {{ addressFormatV2(row.metadata.bond.nodeAddress) }}
        </nuxt-link>
      </span>
      <right-arrow class="action-type" />
      <span v-for="(ops, i) in row.out" :key="'out-' + i">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
    </div>

    <div
      v-else-if="(row && type === 'trade') || type === 'secure'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <span v-for="(ops, i) in row.in" :key="'in-' + i" class="asset-cell">
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
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
      <span
        v-for="(ops, i) in row.out"
        :key="'out-' + i"
        style="display: flex; align-items: flex-end; gap: 0.3rem"
      >
        <asset-icon
          :asset="ops.coins[0].asset"
          :height="'1.2rem'"
          :chain-height="'1rem'"
        ></asset-icon>
        <span class="asset-name">{{
          decimalFormat(ops.coins[0].amount / 1e8)
        }}</span>
      </span>
    </div>

    <div
      v-else-if="row && type === 'failed'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
    >
      <template v-if="row.metadata && row.metadata.failed">
        <span>
          {{ parseMemoToTxType(row.metadata.failed.memo) }}
        </span>
        <right-arrow class="action-type" />
        <span v-tooltip="row.metadata.failed.reason"> see reason </span>
      </template>
    </div>

    <div
      v-else-if="row && type === 'thorname'"
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
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
      class="action-cell"
      :style="{
        border: noBorder ? 'none' : '1px solid var(--border-color)',
        backgroundColor: noBorder ? 'transparent' : 'var(--bgt-color)',
      }"
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
import { parseMemoToTxType } from '~/utils'

export default {
  components: { RightArrow, VaultIcon, RedoIcon },
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
  gap: 10px;
  padding: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  background-color: var(--bgl-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;

  .mini-bubble {
    display: flex;
    align-items: center;

    &.customized {
      padding: 4px 6px;
    }

    &.reason {
      cursor: pointer;

      &:hover {
        background-color: var(--red-bg);
      }
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
}
</style>
