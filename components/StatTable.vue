<template>
  <div class="stat-table">
    <div v-if="header" class="stat-header">
      <div class="stat-header-text">{{ header }}</div>
      <button v-if="false" class="stat-header-btn"></button>
    </div>
    <div v-if="tableSettings && tableSettings.length > 0" class="stat-table-container">
      <div class="stat-table-row" v-for="(row, ri) in tableSettings" :key="ri">
        <div
          class="stat-table-item"
          v-for="(colItem, ci) in row"
          :key="ci + ',' + ri"
        >
          <div class="col-header">
            {{ colItem.name }}
          </div>
          <div class="col-value">
            <template v-if="colItem.filter">
              {{ colItem.value || '-' }}
            </template>
            <template v-else>
              <template v-if="colItem.value">
                {{ colItem.value | number('0,0') }}
              </template>
              <template v-else> - </template>
            </template>
            <span class="usd-value" v-if="colItem.value && colItem.usdValue">({{ colItem.value * runePrice | currency }})</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: "statTable",
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice'
    })
  },
  props: {
    header: String,
    tableSettings: Array,
  },
};
</script>

<style lang="scss">
.stat-table {
  width: 100%;

  .stat-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    padding: 1rem;

    .stat-header-btn {
      background-color: transparent;
      border: none;
    }
  }

  .stat-table-container {
    background-color: rgb(25, 28, 30);
    border-radius: 5px;
    border: 2px solid #263238;
  }

  .stat-table-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    border-bottom: 1px solid #263238;

    &:last-of-type {
      border-bottom: none;
    }

    .stat-table-item {
      flex: 1 0;
      padding: 0.5rem 1rem;

      .col-value {
        color: #e6e6e6;

        .usd-value {
          color: #9F9F9F;
          font-size: .8rem;
        }
      }

      .col-header {
        font-size: 0.75rem;
      }
    }
  }
}
</style>