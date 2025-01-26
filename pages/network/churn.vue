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
  </div>
</template>

<script>
export default {
  data() {
    return {
      network: null,
      mimirInfo: null,
      timer: null,
      nextChurnHeight: 0,
      poolActivationCountdown: 0,
    }
  },
  computed: {
    currentBlock() {
      return this.$store.state.chainsHeight?.THOR ?? 0
    },
  },

  async mounted() {
    const networkData = (await this.$api.getNetwork()).data

    this.nextChurnHeight = +networkData.nextChurnHeight
    this.poolActivationCountdown = +networkData.poolActivationCountdown

    this.mimirInfo = (await this.$api.getMimir()).data
  },

  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  },

  methods: {
    isChurnHalted() {
      return (
        this.mimirInfo?.HALTCHURNING || this.network?.nextChurnHeight === -1
      )
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
.block-details {
  display: flex;
  max-width: 24rem;
  max-height: 300px;
  padding: 3px;
  border-radius: 1rem;
  @include sm {
    max-width: 35rem;
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
</style>
