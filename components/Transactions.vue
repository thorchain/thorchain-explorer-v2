<template>
  <card>
    <TableLoader v-if="loading" :cols="cols" :rows="Array(10).fill({})" />
    <vue-good-table
      v-else
      :columns="cols"
      :rows="actions"
      style-class="vgt-table net-table"
    >
      <template slot="table-row" slot-scope="props">
        <div
          v-if="props.column.field == 'hash' || props.column.field === 'from'"
          class="flex-cell-content-tx"
        >
          <div v-if="props.column.field === 'from'" class="from-address">
            <div class="address-direction">
              <send-icon class="send-icon" />
              <Address
                :param="props.row[props.column.field]"
                :hovered-address="hoveredAddress"
                :disable="owner && owner === props.row[props.column.field]"
                @setHovered="setHoveredAddress"
                @removeHovered="removeHoveredAddress"
              />
            </div>
          </div>
          <Hash
            v-if="props.column.field === 'hash'"
            :param="props.row[props.column.field]"
          />
          <div
            v-if="props.column.field === 'from' && props.row.to"
            class="to-address"
          >
            <div class="address-direction">
              <receive-icon class="send-icon" />
              <Address
                :param="props.row.to"
                :hovered-address="hoveredAddress"
                :disable="owner && owner === props.row.to"
                @setHovered="setHoveredAddress"
                @removeHovered="removeHoveredAddress"
              />
            </div>
          </div>
        </div>
        <div v-else-if="props.column.field === 'type'" class="type">
          <transaction-status
            :row="props.row"
            :hovered-type="hoveredType"
            @setHoveredType="setHoveredType"
            @removeHoveredType="removeHoveredType"
          />
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
import sendIcon from '~/assets/images/send.svg?inline'
import receiveIcon from '~/assets/images/receive.svg?inline'
import { AssetImage } from '~/classes/assetImage'

export default {
  components: {
    TransactionStatus,
    TransactionAction,
    Address,
    Hash,
    RightArrow,
    sendIcon,
    receiveIcon,
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
      hoveredType: '',
      hoveredAddress: '',
      cols: [
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
          label: 'From / To',
          field: 'from',
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
    setHoveredAddress(address) {
      this.hoveredAddress = address
    },
    removeHoveredAddress() {
      this.hoveredAddress = ''
    },
    setHoveredType(type) {
      this.hoveredType = type
    },
    removeHoveredType() {
      this.hoveredType = ''
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
      return moment(date / 1e6).format('MMMM DD YYYY, hh:mm:ss A (GMTZ)')
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
.flex-cell-content-tx {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .to-address {
    padding-top: 6px;
  }
}

.address-direction {
  display: flex;
  align-items: center;
  gap: 4px;
}

.send-icon {
  width: 0.875rem;
  height: 0.875rem;
  fill: var(--sec-font-color);
}

.arrow-icon {
  width: 16px;
  height: 16px;
  fill: var(--sec-font-color);
}
</style>
