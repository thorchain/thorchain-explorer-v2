<template>
  <div>
    <button class="advanced-filter" @click="toggleModal">
      <FilterIcon class="filter-icon" />
      Advanced Filter
      <span v-if="showBadge && filledFilterCount > 0" :class="'mini-bubble'">{{ filledFilterCount }}</span>
    </button>
    <div v-if="isModalVisible" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Advanced Filters</h3>
          <CrossIcon class="close-btn" @click="toggleModal" />
        </div>
        <div class="input-fields">
          <div class="input-row">
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
              @update:tags="updateTags('asset', $event)"
            />
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
        </div>

        <div class="button-group">
          <button
            :disabled="!isFormValid()"
            :class="{ 'disabled-btn': !isFormValid() }"
            @click="submitForm"
          >
            Submit
          </button>
          <button 
            @click="resetForm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CrossIcon from '~/assets/images/cross.svg?inline'
import FilterIcon from '~/assets/images/filter.svg?inline'

export default {
  name: 'Filter',
  components: {
    CrossIcon,
    FilterIcon,
  },
  data() {
    return {
      isModalVisible: false,
      showBadge: false,
      filters: {
        addresses: [],
        txId: [],
        asset: [],
        type: [],
        txType: [],
        affiliate: [],
      },
      filterLabels: {
        addresses: 'Addresses',
        txId: 'TX ID',
        asset: 'Asset',
        type: 'Type',
        txType: 'TxType',
        affiliate: 'Affiliate',
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
      return count
    }
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
        this.$emit('applyFilters', this.filters)
        this.showBadge = true
        this.toggleModal()
      }
    },

    resetForm() {
      this.filters = {
        addresses: [],
        txId: [],
        asset: [],
        type: [],
        txType: [],
        affiliate: [],
      }
      this.showBadge = false
      this.$emit('clearfilter')
    },

    getOptions(key) {
      return key === 'type'
        ? [
            'swap',
            'addLiquidity',
            'withdraw',
            'donate',
            'refund',
            'switch',
            'thorname',
            'runePoolDeposit',
            'runePoolWithdraw',
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
      const valid =
        this.filters.addresses.length > 0 ||
        this.filters.txId.length > 0 ||
        this.filters.affiliate.length > 0 ||
        this.filters.asset.length > 0 ||
        this.filters.type.length > 0 ||
        this.filters.txType.length > 0
      return valid
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
  border-radius: 0.5rem;
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
    padding: 20px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  margin: 0;
  color: var(--sec-font-color);
}

.advanced-filter {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  font-size: 0.875rem;
  background-color: var(--card-bg-color);
  color: var(--font-color);
  border: 1px solid var(--border-color);
  border-radius: 0.3rem;
  cursor: pointer;
  width: auto;
  margin: 0.5rem;
  font-weight: 450;
  transition:
    background-color 0.3s ease,
    transform 0.3s ease;

  .filter-icon {
    width: 1.2rem;
    height: 1.2rem;
    margin-right: 6px;
  }

  &:hover {
    background-color: var(--active-bg-color);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    transform: translateY(-2px);
    color: var(--sec-font-color);
  }
}

.mini-bubble {
  font-size: 12px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
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

.button-group {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);

  button {
    background-color: var(--bg-color);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    color: var(--font-color);
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    margin-left:0.5rem ;

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
