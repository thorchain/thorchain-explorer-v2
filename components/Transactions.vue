<template>
  <card :is-loading="loading">
    <vue-good-table
      :columns="actionsColumn"
      :rows="actions"
      style-class="vgt-table net-table"
    >
      <template slot="table-row" slot-scope="props">
        <div
          v-if="
            props.column.field == 'hash' ||
            props.column.field === 'from' ||
            props.column.field === 'to'
          "
          class="flex-cell-content"
        >
          <Address
            v-if="props.column.field === 'from' || props.column.field === 'to'"
            :param="props.row[props.column.field]"
            :disable="owner && owner === props.row[props.column.field]"
          />
          <Hash
            v-if="props.column.field === 'hash'"
            :param="props.row[props.column.field]"
          />
        </div>
        <div v-else-if="props.column.field === 'type'" class="type">
          <span v-if="props.row.status === 'pending'" class="pending-icon">
            <Clock :class="['mini-bubble yellow']" />
          </span>
          <transaction-status :row="props.row" />
        </div>
        <div v-else-if="props.column.field === 'height'">
          <nuxt-link class="clickable" :to="`/block/${props.row.height}`">
            {{ props.formattedRow[props.column.field] }}
          </nuxt-link>
        </div>
        <div v-else-if="props.column.field === 'action'">
          <transaction-action :row="props.row"></transaction-action>
        </div>
        <div v-else-if="props.column.field === 'interaction'">
          <span
            v-if="owner && owner === props.row.from"
            class="mini-bubble info"
            >OUT</span
          >
          <span v-else-if="owner && owner === props.row.to" class="mini-bubble"
            >IN</span
          >
          <right-arrow v-else class="interaction-icon" />
        </div>
        <div
          v-else-if="props.column.field === 'age'"
          v-tooltip="getTime(props.row.age)"
          class="hoverable"
        >
          {{ props.formattedRow[props.column.field] }}
        </div>
        <template v-else-if="props.column.field === 'volume'">
          <slot :name="props.column.field" :props="props"></slot>
        </template>
        <span v-else>
          {{ props.formattedRow[props.column.field] }}
        </span>
      </template>
    </vue-good-table>
  </card>
</template>

<script>
import moment from 'moment'
import TransactionStatus from './transactions/TransactionStatus.vue'
import TransactionAction from './transactions/TransactionAction.vue'
import Address from './transactions/Address.vue'
import Hash from './transactions/Hash.vue'
import RightArrow from '~/assets/images/arrow-right.svg?inline'
import Clock from '~/assets/images/clock.svg?inline'
import { AssetImage } from '~/classes/assetImage'

export default {
  components: {
    TransactionStatus,
    TransactionAction,
    Address,
    Hash,
    RightArrow,
    Clock,
  },
  filters: {
    shortSymbol(assetStr) {
      if (assetStr?.includes('-')) {
        const assetStrSplit = assetStr.split('-')
        if (assetStrSplit[1].length > 8) {
          return (
            assetStrSplit[0] +
            '-' +
            assetStrSplit[1].slice(0, 4) +
            '...' +
            assetStrSplit[1].slice(-4)
          )
        } else {
          return assetStr
        }
      } else {
        return assetStr
      }
    },
  },
  props: {
    txs: {
      type: Object,
      required: true,
      default() {
        return {
          actions: [],
        }
      },
    },
    owner: {
      type: [String, undefined],
      required: false,
      default: undefined,
    },
    loading: {
      type: Boolean,
      required: false,
    },
    props: {
      type: [Object, Array],
      default() {
        return []
      },
    },
  },
  data() {
    return {
      actionsColumn: [
        {
          label: 'Transaction Hash',
          field: 'hash',
          tdClass: 'mono',
          formatFn: (v) => this.addressFormatV2(v),
        },
        {
          label: 'Type',
          field: 'type',
        },
        {
          label: 'Block Height',
          field: 'height',
          formatFn: this.normalFormat,
        },
        {
          label: 'Age',
          field: 'age',
          formatFn: this.since,
        },
        {
          label: 'From',
          field: 'from',
          tdClass: 'mono',
          formatFn: (v) => this.addressFormatV2(v),
        },
        {
          label: 'To',
          field: 'to',
          tdClass: 'mono',
          formatFn: (v) => this.addressFormatV2(v),
        },
        {
          label: 'Action',
          field: 'action',
        },
        ...this.props,
      ],
    }
  },
  computed: {
    actions() {
      if (!this.txs) {
        return []
      }
      return this.formatActions(this.txs)
    },
  },
  methods: {
    formatActions(txs) {
      const ret = txs.actions.map((t) => {
        return {
          ...t,
          hash:
            t.in.find((e) => e.txID)?.txID || t.out.find((e) => e.txID)?.txID,
          age: t.date,
          from: t.in.find((e) => e.address)?.address,
          to: t.out.find((e) => !e.affiliate && e.address)?.address,
        }
      })

      return ret
    },
    assetImage(assetStr) {
      try {
        return AssetImage(assetStr) ?? require('~/assets/images/unknown.png')
      } catch (e) {
        console.error(e)
        return require('~/assets/images/unknown.png')
      }
    },
    showTx(txID) {
      if (
        txID ===
        '0000000000000000000000000000000000000000000000000000000000000000'
      ) {
        return 'Internal Tx'
      }
      return `${txID.slice(0, 4)}...${txID.slice(-4)}`
    },
    imgErr(e) {
      e.target.src = require('~/assets/images/unknown.png')
    },
    since(date) {
      return moment(date / 1e6).fromNow()
    },
    getTime(date) {
      return moment(date / 1e6).format('MMMM DD YYYY, HH:MM:SS')
    },
  },
}
</script>

<style lang="scss" scoped>
.loading {
  height: 10rem;
  align-items: center;
}

.no-tx {
  padding: 1rem;
}

.tx-container {
  display: flex;
  flex: 1 1 100%;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  overflow: auto;

  &:last-of-type {
    border-bottom: none;
  }

  .since,
  .date,
  .time {
    font-size: 0.875rem;
  }

  .tx-header {
    display: flex;
    flex-direction: column;

    .action {
      color: var(--sec-font-color);
    }

    .date {
      margin-top: 0.5rem;
    }
  }

  .tx-content {
    display: flex;
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    margin-left: 2rem;

    > * {
      color: var(--sec-font-color);
      padding: 0.7rem;
      flex: 1 1 50%;
    }

    .tx {
      cursor: pointer;
      color: var(--primary-color);
      margin-left: 0.2rem;
      display: inline-block;
    }

    .tx-in {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .tx-out {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 10px;
      border-left: 1px solid var(--border-color);
      padding-left: 2rem;
      min-height: 4rem;
    }

    .address {
      cursor: pointer;
      color: var(--primary-color);
    }

    .icon-arrow {
      fill: var(--font-color);
      background-color: var(--border-color);
      border-radius: 50%;
      position: absolute;
      width: 2rem;
      left: -1rem;
      top: calc(50% - 1rem);
    }

    .asset-icon {
      width: 1.2rem;
      height: 1.2rem;
      border-radius: 50%;
    }
  }
}

.tx-contain {
  display: flex;
  flex-direction: column;
}

.tx-out .tx-contain:not(:first-of-type),
.tx-in .tx-contain:not(:first-of-type) {
  border-top: 1px solid var(--border-color);
  padding-top: 0.8rem;
}

.interaction-icon {
  box-sizing: content-box;
  height: 1rem;
  width: 1rem;
  fill: var(--sec-font-color);
  padding: 4px;
}
.type {
  display: flex;
  gap: 8px;
  align-items: center;
}
.mini-bubble {
  height: 1.5rem;
  width: 1.5rem;
  padding: 2px;
}
.pending-icon {
  height: 24px;
}
</style>
