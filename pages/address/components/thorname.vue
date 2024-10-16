<template>
  <div>
    <bounce-loader v-if="loading" color="var(--font-color)" size="3rem" />
    <info-card :options="thornames" :inner="true">
      <template #asset="{ item }">
        <template v-for="al in item.aliases">
          <div :key="`asset-` + al.chain" class="mini-bubble">
            <asset-icon :asset="baseChainAsset(al.chain)" :height="'1.2rem'" />
            <nuxt-link class="clickable" :to="`/address/${al.address}`">
              {{ formatAddress(al.address) }}
            </nuxt-link>
          </div>
        </template>
        <span v-if="item.aliases.length == 0" class="mini-bubble yellow">
          No Aliases
        </span>
      </template>
    </info-card>
    <span v-if="!loading && (!thornames || thornames.length == 0)">
      NO THORName
    </span>
  </div>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'

export default {
  components: {
    BounceLoader,
  },
  props: ['address'],
  data() {
    return {
      loading: true,
      owner: undefined,
      preferredAsset: undefined,
      thornames: [],
    }
  },
  mounted() {
    this.rlookThorname(this.address)
  },
  methods: {
    checkThornameAddresses(names) {
      if (!names) {
        return
      }

      names.forEach((n) => {
        this.$api.getThorname(n).then((res) => {
          this.thornames.push({
            title: '',
            rowStart: 1,
            colSpan: 1,
            items: [
              {
                name: 'Name',
                value: res.data?.name,
              },
              {
                name: 'Owner',
                value: res.data?.owner,
              },
              {
                name: 'Affiliate Collector',
                value: res.data?.affiliate_collector_rune,
                filter: (v) =>
                  `${this.$options.filters.number(v / 1e8, '0,0')} RUNE`,
              },
              {
                name: 'Preferred Asset',
                value: res.data?.preferred_asset,
              },
              {
                name: 'Expire',
                value: res.data?.expire_block_height,
                format: this.normalFormat,
                filter: (v) => `${this.$options.filters.number(v, '0,0')}`,
              },
              {
                name: 'Aliases',
                aliases: res.data?.aliases,
                value: res.data?.aliases !== undefined,
                valueSlot: 'asset',
              },
            ],
          })
        })
      })
    },
    rlookThorname(address) {
      this.$api
        .getRevThorname(address)
        .then((res) => {
          const names = res?.data
          this.checkThornameAddresses(names)
        })
        .catch((e) => {
          console.error(e)
        })
        .finally(() => {
          this.loading = false
        })
    },
  },
}
</script>

<style lang="scss" scoped>
.addresses-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  align-items: center;
  justify-items: center;

  .addresses {
    display: flex;
    align-items: center;
  }
}

.s-header {
  display: flex;
  font-size: 0.75rem;
  color: var(--font-color);
}

.s-value {
  display: flex;
  align-items: center;
}
</style>
