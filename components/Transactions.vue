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
        <div :class="{ 'scam-disabled': props.row.isScam }">
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
          <div
            v-else-if="props.column.field === 'direction'"
            :class="[
              'direction-class',
              {
                green: props.row.direction === 'IN',
                yellow: props.row.direction === 'OUT',
                gray: props.row.direction === 'SELF',
                scam: props.row.isScam,
              },
            ]"
          >
            <span>
              <span v-if="props.row.isScam">
                <alert-icon />
              </span>
              <span v-else>{{ props.row.direction }}</span>
            </span>
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
        </div>
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
import sendIcon from '~/assets/images/send.svg?inline'
import alertIcon from '~/assets/images/alert.svg?inline'
import receiveIcon from '~/assets/images/receive.svg?inline'
import { AssetImage } from '~/classes/assetImage'

export default {
  components: {
    TransactionStatus,
    TransactionAction,
    Address,
    Hash,
    sendIcon,
    receiveIcon,
    alertIcon,
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
          label: '',
          field: 'direction',
          hidden: this.owner === undefined,
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
    checkSuspiciousTxs(txs) {
      const hashes = []
      if (this.owner === undefined) {
        return hashes
      }

      const sendActions = txs.actions.filter((a) => a.type === 'send').reverse()
      const outAddresses = new Set()
      for (let i = 0; i < sendActions.length; i++) {
        const action = sendActions[i]
        const outAddress = action.out[0]?.address ?? undefined
        if (!outAddress) {
          continue
        }

        if (action.in[0].address === this.owner && outAddress) {
          outAddresses.add(outAddress)
        }

        if (outAddress === this.owner) {
          const inAddress = action.in[0].address
          const inShort = inAddress.slice(0, 4) + inAddress.slice(-4)

          outAddresses.forEach((oa) => {
            const outShort = oa.slice(0, 4) + oa.slice(-4)
            if (inShort === outShort && oa !== inAddress) {
              hashes.push(action.in[0].txID)
            }
          })
        }
      }

      return hashes
    },
    getDirection(fromAddr, toAddr) {
      if (fromAddr === toAddr) {
        return 'SELF'
      }
      if (this.owner === fromAddr) {
        return 'OUT'
      }
      return 'IN'
    },
    formatActions(txs) {
      const actions = []
      if (!txs || txs.actions?.length === 0) {
        return actions
      }

      const suspiciousTxs = this.checkSuspiciousTxs(txs)

      for (let i = 0; i < txs?.actions?.length; i++) {
        const t = txs?.actions[i]
        const fromAddr = t.in?.find((e) => e.address)?.address || ''
        const toAddr =
          t.out?.find((e) => !e.affiliate && e.address)?.address || ''
        const direction = this.getDirection(fromAddr, toAddr)

        actions.push({
          ...t,
          hash:
            t.in.find((e) => e.txID)?.txID || t.out.find((e) => e.txID)?.txID,
          age: t.date,
          from: fromAddr,
          to: toAddr,
          direction,
          isScam: suspiciousTxs.includes(t.in.find((e) => e.txID)?.txID),
        })
      }

      return actions
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
.scam-disabled {
  opacity: 0.2;
}
.loading {
  height: 10rem;
  align-items: center;
}

.no-tx {
  padding: $space-16;
}

.tx-container {
  display: flex;
  flex: 1 1 100%;
  padding: $space-16;
  border-bottom: 1px solid var(--border-color);
  overflow: auto;

  &:last-of-type {
    border-bottom: none;
  }

  .since,
  .date,
  .time {
    font-size: $font-size-sm;
  }

  .tx-header {
    display: flex;
    flex-direction: column;

    .action {
      color: var(--sec-font-color);
    }

    .date {
      margin-top: $space-8;
    }
  }

  .tx-content {
    display: flex;
    flex: 1;
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    margin-left: $space-32;

    > * {
      color: var(--sec-font-color);
      padding: $space-12;
      flex: 1 1 50%;
    }

    .tx {
      cursor: pointer;
      color: var(--primary-color);
      margin-left: $space-3;
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
      border-radius: $radius-full;
      position: absolute;
      width: 2rem;
      left: -1rem;
      top: calc(50% - 1rem);
    }

    .asset-icon {
      width: 1.2rem;
      height: 1.2rem;
      border-radius: $radius-full;
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
  padding-top: $space-12;
}

.interaction-icon {
  box-sizing: content-box;
  height: 1rem;
  width: 1rem;
  fill: var(--sec-font-color);
  padding: $space-4;
}
.type {
  display: flex;
  gap: 8px;
  align-items: center;
}

.direction-class {
  padding: $space-6 $space-2;
  color: var(--sec-font-color);
  background-color: var(--bgl-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-md;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: center;
  font-size: $font-size-xs;
  font-weight: 700;
  line-height: 12px;

  @include lg {
    padding: $space-6 $space-0;
  }

  &.scam {
    color: #f50404 !important;
    background-color: rgba(230, 36, 34, 0.2) !important;
    border: 1px solid rgba(255, 99, 97, 1) !important;
  }

  &.gray {
    color: rgba(var(--bs-secondary-rgb), var(--bs-text-opacity));
    border-color: rgba(var(--bs-secondary-rgb), var(--bs-bg-opacity));
    background-color: rgba(var(--bs-secondary-rgb), var(--bs-bg-opacity));
  }

  &.green {
    color: rgba(var(--bs-success-rgb), var(--bs-text-opacity));
    border-color: rgba(var(--bs-success-rgb), var(--bs-bg-opacity));
    background-color: rgba(var(--bs-success-rgb), var(--bs-bg-opacity));
  }

  &.yellow {
    color: #cc9a06;
    background-color: rgba(var(--bs-warning-rgb), var(--bs-bg-opacity));
    border: 1px solid rgba(var(--bs-warning-rgb), var(--bs-border-opacity));
  }
}

.flex-cell-content-tx {
  display: flex;
  flex-direction: column;
  gap: 3px;

  .to-address {
    padding-top: $space-5;
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
