<template>
  <div class="churn-container">
    <div class="countdown-churn">
      <div class="next-churn">
        <counter
          :counter="nextChurnHeight - currentBlock"
          :halted="isChurnHalted()"
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
              <strong>Churn Block</strong>
              <span>#{{ nextChurnHeight | number('0,0') }}</span>
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
              <strong>Activation Block</strong>
              <span
                >#{{
                  (currentBlock + poolActivationCountdown) | number('0,0')
                }}</span
              >
            </div>
          </div>
        </card>
      </div>
    </div>
    <!-- Churn Lists -->
    <!-- <div class="churn-cards">
      <div v-for="(churn, i) in churns" :key="churn.height" class="block-item">
        <div class="block-upper-info">
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
        <div class="block-downer-info">
          <strong>Active Nodes</strong>
          <span
            v-for="n in churn.active_nodes"
            :key="n"
            class="mini-bubble"
            style="margin-left: 0.5rem"
          >
            <nuxt-link class="clickable" :to="`/node/${n}`">
              {{ addressFormatV2(n, 4, true) }}
            </nuxt-link>
          </span>
        </div>
        <div class="block-downer-info">
          <strong>Standby Nodes</strong>
          <span
            v-for="n in churn.standby_nodes"
            :key="n"
            class="mini-bubble danger"
            style="margin-left: 0.5rem"
          >
            <nuxt-link class="clickable danger" :to="`/node/${n}`">
              {{ addressFormatV2(n, 4, true) }}
            </nuxt-link>
          </span>
        </div>
      </div>
      <template v-if="churns.length === 0">
        <div v-for="index in 10" :key="index" class="loader-item">
          <skeleton-loader height="1rem"></skeleton-loader>
        </div>
      </template>
    </div> -->
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
    isChurnHalted() {
      if (this.mimirInfo && this.mimirInfo.HALTCHURNING) {
        return true
      }

      return false
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
  padding: $space-3;
  border-radius: $radius-2xl;

  @include sm {
    max-width: 35rem;
  }

  .block-details-items {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1rem;

    p {
      font-size: $font-size-md;
      color: var(--sec-font-color);
      margin: $space-0;
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

.churn-cards {
  max-width: 72rem;
  display: flex;
  gap: 1rem;
  flex-direction: column;
  margin: $space-16 $space-10;

  @include lg {
    margin: $space-16 auto;
  }

  .block-item {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-2xl;
    padding: $space-8 $space-16;

    .block-upper-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;

      .block-info {
        display: flex;
        flex-direction: column;

        .height {
          font-size: $font-size-md;
          color: var(--sec-font-color);
        }
      }

      .right-section {
        display: flex;
        flex-direction: column;
        align-items: end;
      }
    }

    .block-downer-info {
      margin-top: $space-8;

      a {
        text-decoration: none;
      }
    }
  }

  .loader-item {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: $radius-2xl;
    padding: $space-16 $space-16;
    margin: $space-8 0;
  }
}
</style>
