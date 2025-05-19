<template>
  <div>
    <button class="advanced-filter" @click="toggleModal">
      <FilterIcon class="filter-icon" />
      Advanced Filter
      <span v-if="submittedCount > 0" :class="'mini-bubble'">{{
        submittedCount
      }}</span>
    </button>
    <div
      v-if="isModalVisible"
      class="modal-overlay"
      @click="handleOverlayClick"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Advanced Filters</h3>
          <CrossIcon class="close-btn" @click="toggleModal" />
        </div>
        <div class="input-fields">
          <div v-if="!hideAddressFilter" class="input-row">
            <input-filter
              :tags="filters.addresses"
              placeholder="Enter Addresses, press enter"
              :label="filterLabels.addresses"
              @update:tags="updateTags('addresses', $event)"
            />
          </div>

          <div class="input-row">
            <input-filter
              :tags="filters.affiliate"
              placeholder="Enter Affiliate, press enter"
              :label="filterLabels.affiliate"
              @update:tags="updateTags('affiliate', $event)"
            />
            <input-filter
              :tags="filters.asset"
              placeholder="Enter Asset, press enter"
              :label="filterLabels.asset"
              :suggestions="assets"
              @update:tags="updateTags('asset', $event)"
            />
          </div>

          <div class="input-row">
            <div class="input-group">
              <label for="fromHeight">{{ filterLabels.fromHeight }}</label>
              <input
                id="fromHeight"
                v-model="filters.fromHeight"
                type="text"
                placeholder="Enter fromHeight, press enter"
              />
            </div>
            <div class="input-group">
              <label for="toHeight">{{ filterLabels.toHeight }}</label>
              <input
                id="toHeight"
                v-model="filters.toHeight"
                type="text"
                placeholder="Enter toHeight, press enter"
              />
            </div>
          </div>

          <div class="input-row">
            <select-filter
              :options="getOptions('type')"
              :default="filters.type"
              :label="filterLabels.type"
              @update:selectedOptions="selectOption('type', $event)"
            />
            <select-filter
              :options="getOptions('txType')"
              :default="filters.txType"
              :label="filterLabels.txType"
              @update:selectedOptions="selectOption('txType', $event)"
            />
          </div>

          <div class="input-row">
            <div class="input-group">
              <label for="date">{{ filterLabels.date }}</label>
              <date-picker
                id="date"
                v-model="filters.dateValue"
                placeholder="Select date range"
                value-type="timestamp"
                :range="true"
                :disabled="isHeightFilled"
              />
            </div>
          </div>
        </div>

        <div class="button-group">
          <button
            :disabled="!isFormValid()"
            :class="{ 'disabled-btn': !isFormValid() }"
            @click="submitForm"
          >
            Submit
          </button>
          <button @click="resetForm">Clear</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DatePicker from 'vue2-datepicker'
import CrossIcon from '~/assets/images/cross.svg?inline'
import FilterIcon from '~/assets/images/filter.svg?inline'

export default {
  name: 'Filter',
  components: {
    CrossIcon,
    FilterIcon,
    DatePicker,
  },
  props: {
    hideAddressFilter: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      isModalVisible: false,
      submittedCount: 0,
      filters: {
        addresses: [],
        txId: [],
        asset: [],
        type: [],
        txType: [],
        affiliate: [],
        toHeight: '',
        fromHeight: '',
        dateValue: [null, null],
      },
      filterLabels: {
        addresses: 'Addresses',
        txId: 'TX ID',
        asset: 'Asset',
        type: 'Type',
        txType: 'TxType',
        affiliate: 'Affiliate',
        toHeight: 'To Height',
        fromHeight: 'From Height',
        date: 'Date Range',
      },
    }
  },
  computed: {
    filledFilterCount() {
      let count = 0
      if (this.filters.addresses.length > 0) count++
      if (this.filters.txId.length > 0) count++
      if (this.filters.affiliate.length > 0) count++
      if (this.filters.asset.length > 0) count++
      if (this.filters.type.length > 0) count++
      if (this.filters.txType.length > 0) count++
      if (this.filters.toHeight && this.filters.toHeight.trim() !== '') count++
      if (this.filters.fromHeight && this.filters.fromHeight.trim() !== '')
        count++
      if (
        this.filters.dateValue &&
        this.filters.dateValue[0] != null &&
        this.filters.dateValue[1] != null
      ) {
        count++
      }
      return count
    },
    isHeightFilled() {
      return (
        this.filters.toHeight.trim() !== '' ||
        this.filters.fromHeight.trim() !== ''
      )
    },
    assets() {
      const pools = this.$store.state.pools
      if (pools) {
        const poolsMap = pools
          .map((p) => p.asset)
          .flatMap((a) => [
            a,
            a.replace('.', '/'),
            a.replace('.', '~'),
            a.replace('.', '-'),
          ])

        return [...poolsMap, 'THOR.RUNE']
      }

      return []
    },
  },
  watch: {
    '$route.query': {
      handler(query) {
        this.updateFiltersFromQuery(query)
      },
      immediate: true,
    },
  },
  methods: {
    toggleModal() {
      this.isModalVisible = !this.isModalVisible
    },

    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.toggleModal()
      }
    },

    selectOption(key, options) {
      this.filters[key] = options
    },

    updateTags(type, tags) {
      this.filters[type] = tags
    },

    submitForm() {
      if (this.isFormValid()) {
        const query = this.prepareQueryParams()
        console.log('Submitting query:', query)
        this.$router.push({ query })
        this.toggleModal()
      }
    },

    resetForm() {
      this.$router.push({ query: {} })
    },

    prepareQueryParams() {
      const query = {}

      if (this.filters.addresses.length > 0) {
        query.address = this.filters.addresses
          .map((addr) => addr.trim())
          .join(',')
      }

      const otherArrayFilters = ['txId', 'asset', 'type', 'txType', 'affiliate']
      otherArrayFilters.forEach((key) => {
        if (this.filters[key]?.length > 0) {
          query[key] = this.filters[key]
            .filter(Boolean)
            .map((item) => item.trim())
            .join(',')
        }
      })

      if (this.filters.fromHeight) {
        query.fromHeight = this.filters.fromHeight.toString().trim()
      }

      if (this.filters.toHeight) {
        query.toHeight = this.filters.toHeight.toString().trim()
      }

      if (
        this.filters.dateValue &&
        this.filters.dateValue[0] &&
        this.filters.dateValue[1]
      ) {
        query.fromTimestamp = Math.floor(
          this.filters.dateValue[0] / 1000
        ).toString()
        query.timestamp = Math.floor(
          this.filters.dateValue[1] / 1000
        ).toString()
      }

      return query
    },

    updateFiltersFromQuery(query) {
      const filters = {
        addresses: [],
        txId: [],
        asset: [],
        type: [],
        txType: [],
        affiliate: [],
        toHeight: '',
        fromHeight: '',
        dateValue: [null, null],
      }

      if (query.address) {
        filters.addresses = query.address.split(',').map((item) => item.trim())
      }

      const arrayFilters = ['txId', 'asset', 'type', 'txType', 'affiliate']
      arrayFilters.forEach((key) => {
        if (query[key]) {
          filters[key] = query[key].split(',').map((item) => item.trim())
        }
      })

      if (query.fromHeight) {
        filters.fromHeight = query.fromHeight.toString()
      }

      if (query.toHeight) {
        filters.toHeight = query.toHeight.toString()
      }

      if (query.fromTimestamp && query.timestamp) {
        filters.dateValue = [
          parseInt(query.fromTimestamp) * 1000,
          parseInt(query.timestamp) * 1000,
        ]
      }

      this.filters = filters
      this.submittedCount = this.filledFilterCount
    },

    getOptions(key) {
      return key === 'type'
        ? [
            'swap',
            'send',
            'addLiquidity',
            'withdraw',
            'donate',
            'refund',
            'switch',
            'thorname',
            'runePoolDeposit',
            'runePoolWithdraw',
            'bond',
            'unbond',
            'trade',
            'secure',
            'contract',
          ]
        : [
            'unknown',
            'add',
            'withdraw',
            'swap',
            'limitOrder',
            'outbound',
            'donate',
            'bond',
            'unbond',
            'leave',
            'yggdrasilFund',
            'yggdrasilReturn',
            'reserve',
            'refund',
            'migrate',
            'ragnarok',
            'switch',
            'noOp',
            'consolidate',
            'thorname',
            'loanOpen',
            'loanRepayment',
          ]
    },

    isFormValid() {
      if (
        (this.filters.toHeight.trim() !== '' ||
          this.filters.fromHeight.trim() !== '') &&
        this.filters.dateValue?.length > 0 &&
        this.filters.dateValue[0] !== null &&
        this.filters.dateValue[1] !== null
      ) {
        return false
      }
      if (
        (this.filters.fromHeight.trim() !== '' &&
          isNaN(parseInt(this.filters.fromHeight))) ||
        (this.filters.toHeight.trim() !== '' &&
          isNaN(parseInt(this.filters.toHeight)))
      ) {
        return false
      }
      return (
        this.filters.addresses.length > 0 ||
        this.filters.txId.length > 0 ||
        this.filters.affiliate.length > 0 ||
        this.filters.asset.length > 0 ||
        this.filters.type.length > 0 ||
        this.filters.txType.length > 0 ||
        this.filters.toHeight.trim() !== '' ||
        this.filters.fromHeight.trim() !== '' ||
        (this.filters.dateValue?.length > 0 &&
          this.filters.dateValue[0] !== null &&
          this.filters.dateValue[1] !== null)
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg-color);
  border-radius: $radius-lg;
  text-align: left;
  color: var(--sec-font-color);
  width: 500px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6);

  > div {
    padding: $space-18;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: $space-10;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: $font-size-md;
  margin: $space-0;
  color: var(--sec-font-color);
}

.advanced-filter {
  display: flex;
  align-items: center;
  padding: $space-10 $space-8;
  font-size: $font-size-s;
  background-color: var(--card-bg-color);
  color: var(--font-color);
  border: 1px solid var(--border-color);
  border-radius: $radius-s;
  cursor: pointer;
  width: auto;
  margin: $space-8;
  white-space: nowrap;
  font-weight: 300;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;
  @include lg {
    font-size: $font-size-sm;
    font-weight: 450;
  }

  .filter-icon {
    width: 1.2rem;
    height: 1.2rem;
    margin-right: $space-5;
  }

  &:hover {
    background-color: var(--active-bg-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
    color: var(--sec-font-color);
  }
}

.mini-bubble {
  font-size: $font-size-xs;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: $space-5;
}

.close-btn {
  cursor: pointer;
  width: 1.5rem;
  height: 2rem;
  color: var(--sec-font-color);

  &:hover {
    color: var(--primary-color);
  }
}

.input-fields {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-row {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
  width: 100%;

  label {
    font-size: $font-size-desktop;
    font-weight: bold;
    color: var(--sec-font-color);
    margin-bottom: $space-8;
  }

  input {
    height: 38px;
    color: var(--sec-font-color) !important;
    background-color: var(--bg-color) !important;
    border-radius: $radius-lg;
    border: 1px solid var(--border-color) !important;
    padding: $space-8;
    font-size: $font-size-sm;
    outline: none;
    flex-grow: 1;
  }

  input:-webkit-autofill,
  input:-moz-autofill,
  input:-ms-autofill {
    background-color: var(--bg-color) !important;
    color: var(--sec-font-color) !important;
    caret-color: var(--sec-font-color);
  }

  input:-webkit-autofill {
    -webkit-text-fill-color: var(--sec-font-color) !important;
    transition: background-color 5000s ease-in-out 0s;
    caret-color: var(--sec-font-color);
  }
}

.button-group {
  display: flex;
  justify-content: center;
  padding-top: $space-20;
  border-top: 1px solid var(--border-color);

  button {
    background-color: var(--bg-color);
    border-radius: $radius-lg;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-10 $space-20;
    color: var(--font-color);
    cursor: pointer;
    font-size: $font-size-sm;
    font-weight: 500;
    margin-left: $space-8;

    &:hover {
      color: var(--primary-color);
      background-color: var(--active-bg-color);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  }

  button:disabled,
  .disabled-btn {
    background-color: var(--bg-color);
    cursor: not-allowed;
  }
}
</style>
