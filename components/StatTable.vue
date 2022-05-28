<template>
  <div class="stat-table">
    <div v-if="header" class="stat-header">
      <div class="stat-header-text">
        <img v-if="iconSrc" class="header-icon" :src="iconSrc" alt="header-icon">
        <span>{{ header }}</span>
      </div>
      <button v-if="false" class="stat-header-btn"></button>
    </div>
    <div v-if="tableSettings && tableSettings.length > 0" class="stat-table-container">
      <div class="stat-table-row" v-for="(row, ri) in tableSettings" :key="ri">
        <div
          class="stat-table-group"
          v-for="(colItem, ci) in row"
          :key="ci + ',' + ri"
        >
          <div v-if="colItem.image" class="img-div">
            <img :src="colItem.image" alt="item-icon">
          </div>
          <div class="stat-table-item">
            <div class="col-header">
              {{ colItem.name }}
            </div>
            <div class="col-value">
              <template v-if="colItem.filter">
                <pre>{{ colItem.value || '-' }}</pre>
              </template>
              <template v-else>
                <template v-if="colItem.value">
                  {{ colItem.value | number('0,0') }}
                </template>
                <template v-else> - </template>
              </template>
              <span class="usd-value" v-if="colItem.value && colItem.usdValue">({{ colItem.value * runePrice | currency }})</span>
              <span class="usd-value" v-if="colItem.extraText">({{ colItem.extraText }})</span>
            </div>
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
    iconSrc: String,
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

    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: 5px 5px 0 0;
    border-bottom: none;

    .stat-header-btn {
      background-color: transparent;
      border: none;
    }

    .stat-header-text {
      display: flex;
      align-items: center;
    }

    .header-icon {
      margin-right: 10px;
      height: 1.5rem;
    }
  }

  .stat-table-container {
    background-color: var(--bg-color);
    border-radius: 0 0 5px 5px;
    border: 1px solid var(--border-color);
  }

  .stat-table-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);

    &:last-of-type {
      border-bottom: none;
    }

    .stat-table-group {
      display: flex;
      align-items: center;
      padding: 0.5rem 1rem;
      flex: 1 0;

      .img-div {
        display: inherit;
        img {
          border-radius: 50%;
          margin-right: .5rem;
          width: 1.5rem;
        }
      }
    }

    .stat-table-item {

      .col-value {
        color: var(--sec-font-color);

        .usd-value {
          color: var(--font-color);
          font-size: .8rem;
        }
      }

      .col-header {
        font-size: 0.75rem;
      }
    }
  }
}

pre {
  font-family: 'ProductSans';
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}
</style>