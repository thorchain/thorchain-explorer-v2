<template>
  <div>
    <bounce-loader v-if="loading" color="var(--font-color)" size="3rem" />
    <template v-else>
      <info-card :options="thornames" :inner="true">
        <template #asset="{ item }">
          <template v-for="al in item.aliases">
            <div :key="`asset-` + al.chain" class="mini-bubble">
              <asset-icon
                :asset="baseChainAsset(al.chain)"
                :height="'1.2rem'"
              />
              <nuxt-link class="clickable" :to="`/address/${al.address}`">
                {{ formatAddress(al.address) }}
              </nuxt-link>
            </div>
          </template>
          <span
            v-if="!item.aliases || item.aliases.length == 0"
            class="mini-bubble yellow"
          >
            No Aliases
          </span>
        </template>
        <template #address="{ item }">
          <nuxt-link class="clickable" :to="`/address/${item.value}`">
            {{ formatAddress(item.value) }}
          </nuxt-link>
        </template>
        <template #block="{ item }">
          <nuxt-link class="clickable" :to="`/block/${item.value}`">
            {{ item.filter(item.value) }}
          </nuxt-link>
        </template>
      </info-card>
      <span v-if="thornames.length == 0"> NO THORName </span>
    </template>
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

      const promises = []
      names.forEach((n) => {
        const p = this.$api.getThorname(n).then((res) => {
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
                valueSlot: 'address',
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
                valueSlot: 'block',
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
        promises.push(p)
      })

      Promise.allSettled(promises).then((res) => {
        this.loading = false
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
          this.loading = false
          console.error(e)
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
  font-size: $font-size-xs;
  color: var(--font-color);
}

.s-value {
  display: flex;
  align-items: center;
}
</style>
