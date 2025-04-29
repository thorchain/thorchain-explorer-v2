<template>
  <div class="vote-list">
    <nuxt-link
      v-for="(address, idx) in filteredAddresses.slice(0, 6)"
      :key="idx"
      :to="`/address/${address}`"
      class="mini-bubble"
      :style="{
        backgroundColor: color,
      }"
    >
      {{ formatAddress(address) }}
    </nuxt-link>
    <button
      v-if="filteredAddresses.length > 6 && !show"
      class="more-button"
      @click="show = true"
    >
      +{{ filteredAddresses.length - 6 }} more
    </button>
    <template v-if="show">
      <nuxt-link
        v-for="(address, idx) in filteredAddresses.slice(6)"
        :key="idx + 6"
        :to="`/address/${address}`"
        class="mini-bubble"
        :style="{
          backgroundColor: color,
        }"
      >
        {{ formatAddress(address) }}
      </nuxt-link>
      <button class="more-button" @click="show = false">Show Less</button>
    </template>
  </div>
</template>
<script>
export default {
  props: {
    addresses: {
      type: Array,
      required: true,
    },
    color: {
      required: false,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      show: false,
    }
  },
  computed: {
    filteredAddresses() {
      if (!this.searchQuery) {
        return this.addresses
      }
      const query = this.searchQuery.toLowerCase()
      return this.addresses.filter((address) =>
        address.toLowerCase().includes(query)
      )
    },
  },
  methods: {
    formatAddress(address) {
      return address.slice(-4)
    },
  },
}
</script>

<style scoped lang="scss">
.vote-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  .mini-bubble {
    padding: $space-4 $space-8;
    border-radius: $radius-xl;
    font-size: $font-size-xs;
    color: var(--sec-font-color);
    cursor: pointer;
    text-decoration: none;
    display: inline-block;
    transition: opacity 0.3s ease;

    &:hover {
      opacity: 0.8;
    }
  }

  .more-button {
    background: none;
    border: none;
    color: var(--primary-color);
    cursor: pointer;
    font-size: $font-size-xs;
    transition: color 0.3s ease;

    &:hover {
      color: var(--primary-color-dark);
    }
  }
}
</style>
