<template>
  <div>
    <button class="advanced-filter" @click="toggleModal">
      <FilterIcon class="filter-icon" />
      Advanced Filter
    </button>
    <div v-if="isModalVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Advanced Filters</h3>
          <CrossIcon class="close-btn" @click="toggleModal" />
        </div>
        <div class="input-fields">
          <div class="input-row">
            <input-filter
              :tags="filters.addresses"
              placeholder="Enter Addresses"
              @update:tags="updateTags('addresses', $event)"
              :label="filterLabels.addresses"
            />
            <input-filter
              :tags="filters.txId"
              placeholder="Enter TX IDs"
              @update:tags="updateTags('txId', $event)"
              :label="filterLabels.txId"
            />
          </div>

          <div class="input-row">
            <input-filter
              :tags="filters.affiliate"
              placeholder="Enter Affiliate"
              @update:tags="updateTags('affiliate', $event)"
              :label="filterLabels.affiliate"
            />
            <input-filter
              :tags="filters.asset"
              placeholder="Enter Asset"
              @update:tags="updateTags('asset', $event)"
              :label="filterLabels.asset"
            />
          </div>

          <div class="input-row">
            <select-filter
              :options="getOptions('type')"
              :default="filters.type"
              :label="filterLabels.type"
              @update:selectedOption="selectOption('type', $event)"
            />
            <select-filter
              :options="getOptions('txType')"
              :default="filters.txType"
              :label="filterLabels.txType"
              @update:selectedOption="selectOption('txType', $event)"
            />
          </div>
        </div>

        <div class="button-group">
          <button
            @click="submitForm"
            :disabled="!isFormValid()"
            :class="{ 'disabled-btn': !isFormValid() }"
          >
            Submit
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
      filters: {
        addresses: [],
        txId: [],
        asset: [],
        type: 'All',
        txType: 'All',
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
  methods: {
    toggleModal() {
      this.isModalVisible = !this.isModalVisible
    },

    selectOption(key, value) {
      this.filters[key] = value
    },

    updateTags(type, tags) {
      this.filters[type] = tags
    },

    submitForm() {
      if (this.isFormValid()) {
        console.log(this.filters)
        this.toggleModal()
      }
    },

    getOptions(key) {
      return key === 'type'
        ? ['All', 'Type 1', 'Type 2']
        : ['All', 'TxType 1', 'TxType 2']
    },

    isFormValid() {
      const valid =
        this.filters.addresses.length > 0 ||
        this.filters.txId.length > 0 ||
        this.filters.affiliate.length > 0 ||
        this.filters.asset.length > 0 ||
        this.filters.type !== 'All' ||
        this.filters.txType !== 'All'
      return valid
    },
  },
}
</script>

<style lang="scss">
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
  padding: 20px;
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

.advanced-filter:hover {
  background-color: var(--active-bg-color);
}

.close-btn {
  cursor: pointer;
  width: 1.5rem;
  height: 2rem;
  color: var(--sec-font-color);
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
    background-color: var(--primary-color);
    color: var(--bubble-font-color);
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    transition:
      background-color 0.3s ease,
      box-shadow 0.3s ease;
    outline: none;

    &:hover {
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
  }

  button:disabled,
  .disabled-btn {
    background-color: var(--primary-color);
    cursor: not-allowed;
  }
}
</style>
