<template>
  <Card title="Latest Transactions">
    <template #more>
      <nuxt-link
        to="/txs"
        class="more-link clickable"
        style="margin-left: auto"
      >
        More
        <ArrowRightIcon />
      </nuxt-link>
    </template>
    <div>
      <template v-if="transactions">
        <template v-for="(t, i) in transactions">
          <div :key="i" class="row-item-transactions">
            <div class="transactions">
              <span
                v-if="t.in"
                style="font-size: 0.875rem; color: var(--sec-font-color)"
              >
                <small style="color: var(--font-color)">TxID</small>
                <nuxt-link class="clickable" :to="`/tx/${t.in[0].txID}`">
                  {{ formatAddress(showTx(t.in && t.in[0].txID)) }}
                </nuxt-link>
              </span>
              <TransactionAction
                :row="t"
                :show-mini-bubble="false"
                :no-border="true"
              />
            </div>
            <div class="txs">
              <span>
                <small style="color: var(--font-color)">From</small>
                <AddressBar :address-str="t.in && t.in[0].address"></AddressBar>
              </span>
              <nuxt-link class="clickable header" :to="`/block/${t.height}`">
                {{ t.height | number('0,0') }}
              </nuxt-link>

              <span class="timestamp">
                {{ formatMoment(t.date) }}
              </span>
            </div>
          </div>
          <hr :key="i + 'hr'" class="hr-space" />
        </template>
      </template>
      <div v-else class="loading">
        <BounceLoader color="var(--font-color)" size="3rem" />
      </div>
    </div>
  </Card>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import ArrowRightIcon from '~/assets/images/arrow-right.svg?inline'
import TransactionAction from '~/components/transactions/TransactionAction.vue'
import AddressBar from '~/components/AddressBar.vue'
import moment from 'moment'

export default {
  name: 'LatestTransactions',
  props: {
    transactions: {
      type: Array,
      default: null,
    },
  },
  components: {
    BounceLoader,
    ArrowRightIcon,
    TransactionAction,
    AddressBar,
  },
  data() {
    return {
      transactions: null,
    }
  },
  methods: {
    showTx(txID) {
      if (
        txID ===
        '0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return 'Internal Tx'
      }
      return txID
    },
    formatMoment(time) {
      return moment(Number.parseInt(time / 10 ** 6)).fromNow()
    },
    formatAddress(address) {
      if (!address) return ''
      return `${address.substring(0, 10)}...${address.substring(
        address.length - 5
      )}`
    },
  },
}
</script>

<style lang="scss">
.more-link {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: $font-size-sm;

  svg {
    fill: currentColor;
    height: 1rem;
    width: 1rem;
  }
}

.row-item-transactions {
  justify-content: space-between;
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  @include md {
    flex-direction: row;
    align-items: center;
  }

  .txs {
    display: flex;
    flex-direction: column;
    text-overflow: ellipsis;
    overflow: hidden;

    > span {
      overflow: hidden;
      text-overflow: ellipsis;

      white-space: nowrap;
      word-break: keep-all;
      font-size: $font-size-sm;
      color: var(--sec-font-color);

      .value {
        color: var(--primary-color);
      }
    }

    a {
      cursor: pointer;
    }
  }
}

.transactions {
  display: flex;
  flex-direction: column;
}

.hr-space {
  margin: $space-8 0;
  border: 0;
  border-top: 1px solid var(--border-color);
}

.loading {
  display: flex;
  justify-content: center;
  padding: $space-20 0;
}
</style>
