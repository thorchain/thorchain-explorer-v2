<template>
  <div>
    <info-card :options="thornames" :inner="true">
      <template #asset>
        <div v-if="preferredAsset">
          <span class="s-header"> Preferred Asset </span>
          <div class="s-value">
            {{ showAsset(preferredAsset) }}
          </div>
        </div>
      </template>
      <template #address>
        <div v-if="owner">
          <span class="s-header"> Owner </span>
          <NuxtLink
            class="clickable s-value"
            :to="{ path: `/address/${owner}` }"
          >
            {{ formatAddress(owner) }}
          </NuxtLink>
        </div>
      </template>
    </info-card>
    <div v-if="thornameAddresses.length > 0">
      <div class="addresses-container">
        <div
          v-for="address in thornameAddresses"
          :key="address.chain"
          class="addresses"
        >
          <img
            class="asset-icon"
            :src="assetImage(baseChainAsset(address.chain))"
          />
          <span class="clickable mono" @click="gotoAddr(address.address)"
            >{{ address.address.slice(0, 8) }}...{{
              address.address.slice(-8)
            }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['address'],
  data() {
    return {
      owner: undefined,
      preferredAsset: undefined,
      thornames: [],
      thornameAddresses: [],
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
                value: res.data.name,
              },
            ],
          })

          this.preferredAsset = res.data?.preferred_asset ?? 'N/A'
          this.owner = res.data?.owner ?? 'N?A'
        })
      })
    },
    rlookThorname(address) {
      this.$api
        .getRevThorname(address)
        .then((res) => {
          const names = res?.data
          this.thornames = names.map((n) => {
            return [
              {
                name: 'Address Name',
                value: n,
                filter: true,
              },
            ]
          })
          this.checkThornameAddresses(names)
        })
        .catch((e) => {
          if (e.response.status === 404) {
            this.thornames = [
              [
                {
                  name: 'Address Name',
                  value: 'Not assigned',
                  filter: true,
                },
              ],
            ]
          } else {
            console.error(e)
          }
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
