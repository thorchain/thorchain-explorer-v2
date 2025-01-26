<template>
  <div class="churn-container">
    <div class="countdown-churn">
      <div class="next-churn">
        <counter
          :counter="nextChurnHeight - currentBlock"
          title="Next Churn"
          :visible-units="['Days', 'Hours', 'Minutes', 'Seconds']"
        />

        <card class="block-details">
          <div class="block-details-items">
            <div class="block-details-title">
              <strong>Block Details</strong>
            </div>
            <div class="block-info-items">
              <strong>Remaining Blocks</strong>
              <span
                >#{{ (nextChurnHeight - currentBlock) | number('0,0') }}</span
              >
              <strong>Current Block</strong>
              <span>#{{ currentBlock | number('0,0') }}</span>
            </div>
          </div>
        </card>
      </div>
      <div class="next-churn">
        <counter
          :counter="poolActivationCountdown"
          title="Next Pool"
          :visible-units="['Days', 'Hours', 'Minutes', 'Seconds']"
        />

        <card class="block-details">
          <div class="block-details-items">
            <div class="block-details-title">
              <strong>Block Details</strong>
            </div>
            <div class="block-info-items">
              <strong>Remaining Blocks</strong>
              <span>#{{ poolActivationCountdown | number('0,0') }}</span>
              <strong>Current Block</strong>
              <span>#{{ currentBlock | number('0,0') }}</span>
            </div>
          </div>
        </card>
      </div>
    </div>
    <!-- Churn Lists -->
    <div class="block-card">
      <transition-group name="block" tag="div">
        <div
          v-for="(churn, i) in churns"
          :key="churn.height"
          class="block-item"
        >
          <div class="block-info">
            <span class="height">Churn #{{ i }}</span>
            <nuxt-link class="clickable" :to="`/block/${churn.height}`">
              {{ churn.height | number('0,0') }}
            </nuxt-link>
          </div>
          <div class="right-section">
            <div style="color: var(--sec-font-color)">
              {{ getDate(churn.date) }}
            </div>
            <small> {{ untilNow(churn.date) }} </small>
          </div>
        </div>
        <template v-if="churns.length === 0">
          <div v-for="index in 10" :key="index" class="loader-item">
            <skeleton-loader height="1rem"></skeleton-loader>
          </div>
        </template>
      </transition-group>
    </div>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  data() {
    return {
      network: null,
      mimirInfo: null,
      timer: null,
      nextChurnHeight: 0,
      poolActivationCountdown: 0,
      churns: [],
    }
  },

  computed: {
    currentBlock() {
      return this.$store.state.chainsHeight?.THOR ?? 0
    },
  },

  mounted() {
    this.$api.getNetwork().then(({ data: networkData }) => {
      this.nextChurnHeight = +networkData.nextChurnHeight
      this.poolActivationCountdown = +networkData.poolActivationCountdown
    })

    this.$api.getMimir().then(({ data: mimirInfo }) => {
      this.mimirInfo = mimirInfo
    })

    this.$api.getChurn().then(({ data: churnData }) => {
      this.churns = churnData.slice(0, 10)
    })
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  methods: {
    getDate(timestamp) {
      return moment.unix(timestamp / 1e9).format('YYYY MMM D')
    },
    untilNow(timestamp) {
      return moment.unix(timestamp / 1e9).fromNow()
    },
  },
}
</script>

<style lang="scss" scoped>
.countdown-churn {
  display: flex;
  flex-direction: row;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  > div {
    flex: 1;
    max-width: 35rem;
  }
}
.block-details {
  display: flex;
  max-height: 300px;
  padding: 3px;
  border-radius: 1rem;

  @include sm {
    max-width: 35rem;
  }

  .block-details-items {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1rem;

    p {
      font-size: 18.75px;
      color: var(--sec-font-color);
      margin: 0;
    }
  }
}
.block-info-items {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  span {
    color: var(--sec-font-color);
    font-weight: bold;
  }
}
.block-details-title {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  align-items: center;
}
.next-churn {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.block-card {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 1rem;
  padding: 0.5rem 1rem;
  max-width: 72rem;
  margin: auto;
  margin-top: 1rem;

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

    .right-section {
      display: flex;
      flex-direction: column;
      align-items: end;
    }
  }

  .loader-item {
    margin: 2rem 0;
  }
}
</style>
