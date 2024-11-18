<template>
  <div class="container-page">
    <div class="burn-card">
      <h3>
        <burn class="burn-icon"></burn>
        Burned RUNE
      </h3>
      <div class="burned-value">
        <h1 v-if="totalBurned">
          {{ runeCur() }}
          {{ totalBurned | number('0,0.00') }}
        </h1>
        <skeleton-loader v-else height="1rem" width="12rem"></skeleton-loader>
      </div>
    </div>
    <div class="block-card">
      <div
        v-for="(block, index) in burnedBlocks"
        :key="index"
        class="block-item"
      >
        <div class="block-info">
          <span class="height">{{ block.blockHeight | number('0,0') }}</span>
          <span class="duration">
            {{ getDuration(block.timestamp) }}
          </span>
        </div>
        <div class="burn-info">
          {{ runeCur() }}
          {{ block.burnedAmount / 1e8 }}
        </div>
      </div>
      <template v-if="burnedBlocks.length == 0">
        <div v-for="index in 10" :key="index" class="loader-item">
          <skeleton-loader class="value-loader" height="1rem"></skeleton-loader>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import moment from 'moment'
import Burn from '~/assets/images/burn.svg?inline'

export default {
  components: { Burn },
  data() {
    return {
      updateInterval: undefined,
      totalBurned: undefined,
      burnedBlocks: [],
    }
  },
  mounted() {
    this.updateInterval = setInterval(() => {
      this.getBurnData()
    }, 5000)
  },
  destroyed() {
    clearInterval(this.updateInterval)
  },
  methods: {
    getBurnData() {
      this.$api
        .getBurnedBlocks()
        .then(({ data }) => {
          this.totalBurned = 500_000_000 - +data.totalBurned / 1e8
          this.burnedBlocks = data.burnedBlocks.reverse()
        })
        .catch((error) => {
          console.error('Error fetching swap history:', error)
        })
    },
    getDuration(timestamp) {
      return moment.duration(timestamp).humanize()
    },
  },
}
</script>

<style lang="scss" scoped>
.burn-card {
  text-align: center;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 1rem 2rem;
  font-size: 1.875rem;
  color: var(--sec-font-color);
  max-width: 50rem;
  margin: auto;

  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }

  .burned-value {
    display: flex;
    justify-content: center;
    h1 {
      margin: 0.5rem;

      @include md {
        font-size: 7rem;
      }
    }
  }

  .burn-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    margin-right: 0.5rem;
    fill: #ffa86b;
  }
}

.block-card {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  max-width: 50rem;
  margin: auto;
  margin-top: 1rem;
}

.block-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  margin: 1rem;

  .block-info {
    display: flex;
    flex-direction: column;

    .height {
      font-size: 1.2rem;
      color: var(--sec-font-color);
    }
  }

  .burn-info {
    color: #ffa86b;
  }
}

.loader-item {
  margin: 2rem 0;
}
</style>
