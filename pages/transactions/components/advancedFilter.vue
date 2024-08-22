<template>
    <div>
      <button @click="toggleModal" class="advanced-filter">
        <FilterIcon class="filter-icon" />
        Advanced
      </button>
      <div v-if="isModalVisible" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Advanced Filters</h3>
            <CrossIcon class="close-btn" @click="toggleModal" />
          </div>
          <div class="input-fields">
            <div class="input-row">
              <div class="form-group">
                <label>{{ filterLabels.addresses }}</label>
                <div :class="['tags-input', tagsWrapClass('addresses')]">
                  <div
                    v-for="(tag, index) in filters.addresses"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                    <span
                      @click="removeTag('addresses', index)"
                      class="remove-tag"
                      >&times;</span
                    >
                  </div>
                  <input
                    type="text"
                    v-model="addressTag"
                    @keyup.enter="addTag('addresses', addressTag)"
                    placeholder="Enter Addresses"
                  />
                </div>
              </div>
              <div class="form-group">
                <label>{{ filterLabels.txId }}</label>
                <div :class="['tags-input', tagsWrapClass('txId')]">
                  <div
                    v-for="(tag, index) in filters.txId"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                    <span @click="removeTag('txId', index)" class="remove-tag"
                      >&times;</span
                    >
                  </div>
                  <input
                    type="text"
                    v-model="txIdTag"
                    @keyup.enter="addTag('txId', txIdTag)"
                    placeholder="Enter TX IDs"
                  />
                </div>
              </div>
            </div>
  
            <div class="input-row">
              <div class="form-group">
                <label>{{ filterLabels.affiliate }}</label>
                <div :class="['tags-input', tagsWrapClass('affiliate')]">
                  <div
                    v-for="(tag, index) in filters.affiliate"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                    <span
                      @click="removeTag('affiliate', index)"
                      class="remove-tag"
                      >&times;</span
                    >
                  </div>
                  <input
                    type="text"
                    v-model="affiliateTag"
                    @keyup.enter="addTag('affiliate', affiliateTag)"
                    placeholder="Enter Affiliate"
                  />
                </div>
              </div>
              <div class="form-group">
                <label>{{ filterLabels.asset }}</label>
                <div :class="['tags-input', tagsWrapClass('asset')]">
                  <div
                    v-for="(tag, index) in filters.asset"
                    :key="index"
                    class="tag"
                  >
                    {{ tag }}
                    <span @click="removeTag('asset', index)" class="remove-tag"
                      >&times;</span
                    >
                  </div>
                  <input
                    type="text"
                    v-model="assetTag"
                    @keyup.enter="addTag('asset', assetTag)"
                    placeholder="Enter Asset"
                  />
                </div>
              </div>
            </div>
  
            <div class="input-row">
              <div class="form-group">
                <label>{{ filterLabels.type }}</label>
                <div class="custom-dropdown">
                  <div
                    class="dropdown-button"
                    @click.stop="toggleDropdown('type')"
                  >
                    {{ filters.type }}
                    <AngleIcon class="dropdown-icon" />
                  </div>
                  <div v-if="dropdowns.type" class="dropdown-options">
                    <div
                      class="dropdown-option"
                      v-for="option in getOptions('type')"
                      :key="option"
                      @click="selectOption('type', option)"
                    >
                      {{ option }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label>{{ filterLabels.txType }}</label>
                <div class="custom-dropdown">
                  <div
                    @click.stop="toggleDropdown('txType')"
                    class="dropdown-button"
                  >
                    {{ filters.txType }}
                    <AngleIcon class="dropdown-icon" />
                  </div>
                  <div v-if="dropdowns.txType" class="dropdown-options">
                    <div
                      class="dropdown-option"
                      v-for="option in getOptions('txType')"
                      :key="option"
                      @click="selectOption('txType', option)"
                    >
                      {{ option }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <div class="date-fields">
              <div class="form-group">
                <label>{{ filterLabels.sinceDate }}</label>
                <input type="date" v-model="filters.sinceDate" />
              </div>
              <div class="form-group">
                <label>{{ filterLabels.untilDate }}</label>
                <input type="date" v-model="filters.untilDate" />
              </div>
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
  import AngleIcon from '~/assets/images/angle-down.svg?inline'
  import FilterIcon from '~/assets/images/filter.svg?inline'
  
  export default {
    name: 'Filter',
    components: {
      CrossIcon,
      AngleIcon,
      FilterIcon,
    },
    data() {
      return {
        isModalVisible: false,
        dropdowns: {
          type: false,
          txType: false,
        },
        filters: {
          addresses: [],
          txId: [],
          asset: [],
          type: 'All',
          txType: 'All',
          affiliate: [],
          sinceDate: '',
          untilDate: '',
        },
        filterLabels: {
          addresses: 'Addresses',
          txId: 'TX ID',
          asset: 'Asset',
          type: 'Type',
          txType: 'TxType',
          affiliate: 'Affiliate',
          sinceDate: 'Since',
          untilDate: 'Until',
        },
        txIdTag: '',
        affiliateTag: '',
        assetTag: '',
        addressTag: '',
      }
    },
    methods: {
      toggleModal() {
        this.isModalVisible = !this.isModalVisible
      },
  
      toggleDropdown(key) {
        this.dropdowns[key] = !this.dropdowns[key]
      },
  
      selectOption(key, value) {
        this.filters[key] = value
        this.dropdowns[key] = false
      },
  
      submitForm() {
        console.log(this.filters)
      },
  
      getOptions(key) {
        return key === 'type'
          ? ['All', 'Type 1', 'Type 2']
          : ['All', 'TxType 1', 'TxType 2']
      },
  
      addTag(type, tag) {
        if (tag && !this.filters[type].includes(tag)) {
          this.filters[type].push(tag)
        }
        this.resetTag(type) 
      },
  
      removeTag(type, index) {
        this.filters[type].splice(index, 1)
      },
  
      tagsWrapClass(type) {
        return this.filters[type].length > 2 ? 'wrap' : 'no-wrap'
      },
  
      resetTag(type) {
        if (type === 'addresses') {
          this.addressTag = ''
        } else if (type === 'txId') {
          this.txIdTag = ''
        } else if (type === 'affiliate') {
          this.affiliateTag = ''
        } else if (type === 'asset') {
          this.assetTag = ''
        }
      },
      isFormValid() {
        return (
          this.filters.addresses.length > 0 ||
          this.filters.txId.length > 0 ||
          this.filters.affiliate.length > 0 ||
          this.filters.asset.length > 0 ||
          this.filters.sinceDate !== '' ||
          this.filters.untilDate !== ''
        )
      },
  
      submitForm() {
        if (this.isFormValid()) {
          console.log(this.filters)
          this.toggleModal()
        }
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
    font-size: 14px;
    background-color: var(--card-bg-color);
    color: var(--sec-font-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    width: auto;
    margin: 0.5rem;
    transition: background-color 0.3s ease, transform 0.3s ease;
  
    .filter-icon {
      width: 1.2rem;
      height: 1.2rem;
      margin-right: 6px;
    }
  
    &:hover {
      background-color: var(--active-bg-color);
      transform: scale(1.05);
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
  
  .date-fields {
    display: flex;
    flex-direction: column;
    gap: 15px;
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
  
  .form-group {
    flex: 1;
    min-width: 0;
    position: relative;
  
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 16px;
      font-weight: bold;
      color: var(--sec-font-color);
    }
  
    input {
      width: 100%;
      padding: 12px 16px;
      font-size: 16px;
      border: none;
      border-bottom: 2px solid var(--border-color);
      border-radius: 6px;
      background-color: var(--bg-color);
      color: var(--sec-font-color);
      box-sizing: border-box;
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;
      outline: none;
  
      &:focus {
        border-color: var(--primary-color);
        background-color: var(--bg-color);
        box-shadow: 0 0 5px rgba(0, 209, 178, 0.5);
      }
    }
  
    .custom-dropdown {
      position: relative;
  
      .dropdown-button {
        width: 100%;
        padding: 12px 16px;
        font-size: 16px;
        border: none;
        border-bottom: 2px solid var(--border-color);
        border-radius: 6px;
        background-color: var(--bg-color);
        color: var(--sec-font-color);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-sizing: border-box;
        transition:
          border-color 0.3s ease,
          box-shadow 0.3s ease;
  
        .dropdown-icon {
          width: 1rem;
          height: 1rem;
          fill: var(--sec-font-color);
        }
      }
  
      .dropdown-options {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background-color: var(--bg-color);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        z-index: 1;
        border-radius: 6px;
        margin-top: 0.5rem;
        padding: 0.5rem 0;
        box-sizing: border-box;
      }
  
      .dropdown-option {
        padding: 12px 16px;
        font-size: 16px;
        color: var(--sec-font-color);
        cursor: pointer;
        transition: background-color 0.3s ease;
  
        &:hover {
          background-color: var(--active-bg-color);
          border-radius: 0.3rem;
        color: var(--primary-color)
        }
      }
    }
  
    .tags-input {
      display: flex;
      padding: 4px;
      background-color: var(--bg-color);
      border-radius: 6px;
      border: 1px solid var(--border-color);
      max-height: 100px;
      overflow-y: auto;
  
      input {
        flex-grow: 1;
        min-width: 150px;
        padding: 6px;
        border: none;
        background-color: transparent;
        color: var(--sec-font-color);
        outline: none;
        margin: 2px;
        font-size: 14px;
      }
    }
  
    .tag {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      background-color: var(--primary-color);
      color: var(--bubble-font-color);
      border-radius: 12px;
      font-size: 14px;
      margin: 2px;
      white-space: nowrap;
    }
  
    .remove-tag {
      margin-left: 8px;
      font-size: 14px;
      cursor: pointer;
      color: var(--gradient-left);
      transition: color 0.3s ease;
    }
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
  