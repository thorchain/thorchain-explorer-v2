<template>
  <div class="custom-dropdown">
    <div class="dropdown-container">
      <div class="dropdown-select" @click="$emit('toggle')">
        <div v-if="selectedAffiliate" class="selected-item">
          <affiliate
            :affiliate-address="selectedAffiliate"
            :use-new-icons="false"
            :show-link="false"
            class="item-label"
          />
        </div>
        <div v-else class="placeholder">All Affiliates</div>
        <angle-icon :class="{ trigger: true, rotated: isOpen }" />
      </div>

      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-item" @click="$emit('select', '')">
          <span class="all-affiliates-text">All Affiliates</span>
        </div>
        <div
          v-for="affiliate in affiliateList"
          :key="affiliate"
          class="dropdown-item"
          @click="$emit('select', affiliate)"
        >
          <affiliate
            :affiliate-address="affiliate"
            :show-link="false"
            class="item-label"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Affiliate from '~/components/Affiliate.vue'
import AngleIcon from '~/assets/images/angle-down.svg?inline'

export default {
  name: 'AffiliateDropdown',
  components: {
    Affiliate,
    AngleIcon,
  },
  props: {
    selectedAffiliate: {
      type: String,
      default: '',
    },
    affiliateList: {
      type: Array,
      default: () => [],
    },
    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['toggle', 'select'],
}
</script>

<style lang="scss" scoped>
.custom-dropdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 10px 0px 10px;

  @include md {
    margin: 0 0px 0px 0px;
  }

  .dropdown-container {
    position: relative;
    min-width: 150px;
    padding: 3px;

    .dropdown-select {
      padding: $space-10 $space-12;
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      background-color: var(--card-bg-color);
      color: var(--sec-font-color);
      font-size: $font-size-sm;
      min-width: 150px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;

      &:hover {
        border-color: var(--primary-color);
        background-color: var(--active-bg-color);
      }

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .selected-item {
        display: flex;
        align-items: center;
        flex: 1;
      }

      .placeholder {
        color: var(--sec-font-color);
        font-size: $font-size-sm;
      }

      .trigger {
        width: 1rem;
        height: 1rem;
        fill: var(--font-color);
        cursor: pointer;
        transition: transform 0.3s ease;

        &.rotated {
          transform: rotate(180deg);
        }
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      margin-top: $space-5;
      padding: $space-5;

      .dropdown-item {
        padding: $space-10 $space-12;
        cursor: pointer;
        border-radius: $radius-s;
        display: flex;
        align-items: center;
        transition: background-color 0.3s ease;
        margin-bottom: $space-2;

        &:hover {
          background-color: var(--active-bg-color);
          color: var(--primary-color);
        }

        &:last-child {
          margin-bottom: 0;
        }

        .all-affiliates-text {
          font-weight: 500;
          color: var(--sec-font-color);
          font-size: $font-size-sm;
        }
      }
    }
  }
}
</style>
