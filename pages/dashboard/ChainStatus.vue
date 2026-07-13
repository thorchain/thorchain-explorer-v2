<template>
  <card title="Network Status">
    <template #header>
      <nuxt-link to="/network" class="more-link">
        <span
          v-if="chains.length > 0"
          :class="[
            'mini-bubble',
            { danger: networkStatus === 'Degraded' },
            { yellow: networkStatus === 'Limited' },
          ]"
        >
          {{ networkStatus }}
        </span>
      </nuxt-link>
    </template>
    <div v-if="chains.length > 0">
      <div class="status-row status-header">
        <span class="chain-cell">Chain</span>
        <span
          v-for="status in statusFields"
          :key="status.field"
          class="status-cell"
        >
          {{ status.label }}
        </span>
      </div>
      <div v-for="chain in chains" :key="chain.chain" class="status-row">
        <div class="chain-cell">
          <asset-icon :asset="baseChainAsset(chain.chain)" height="1.2rem" />
          <span class="chain-name">{{ chain.chain }}</span>
        </div>
        <div
          v-for="status in statusFields"
          :key="status.field"
          class="status-cell"
        >
          <danger-icon
            v-if="chain[status.field] > 1"
            v-tooltip="`Scheduled halt: ${chain[status.field]}`"
            class="status-icon"
          />
          <danger-icon
            v-else-if="chain[status.field] === 1"
            v-tooltip="`Mimir halt`"
            class="status-icon"
          />
          <span v-else class="mono ok">OK</span>
        </div>
      </div>
    </div>
    <template v-else>
      <div v-for="index in 10" :key="index" class="status-row">
        <div class="chain-cell">
          <skeleton-loader width="80px"></skeleton-loader>
        </div>
        <div
          v-for="(_, itemIndex) in statusFields"
          :key="itemIndex"
          class="status-cell"
        >
          <skeleton-loader width="30px"></skeleton-loader>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="churn-info">
        <div class="churn-item">
          <span class="churn-label">Latest Churn</span>
          <nuxt-link
            v-if="latestChurn"
            class="churn-value clickable"
            :to="`/block/${latestChurn.height}`"
          >
            {{ churnDate(latestChurn.date) }}
          </nuxt-link>
          <skeleton-loader v-else width="90px"></skeleton-loader>
        </div>
        <div class="churn-item">
          <span class="churn-label">Churn Duration</span>
          <span v-if="latestChurn" class="churn-value">
            {{ churnDuration(latestChurn.date) }}
          </span>
          <skeleton-loader v-else width="70px"></skeleton-loader>
        </div>
      </div>
    </template>
  </card>
</template>

<script>
import moment from 'moment'
import DangerIcon from '@/assets/images/danger.svg?inline'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

export default {
  name: 'ChainStatus',
  components: {
    DangerIcon,
    SkeletonLoader,
  },
  props: {
    inboundData: {
      type: Array,
      default: () => [],
    },
    mimir: {
      type: Object,
      default: () => null,
    },
  },
  data() {
    return {
      latestChurn: null,
      statusFields: [
        { label: 'Scanning', field: 'haltHeight' },
        { label: 'Trading', field: 'haltTradingHeight' },
        { label: 'LP', field: 'haltLPHeight' },
        { label: 'Signing', field: 'haltSigningHeight' },
      ],
    }
  },
  computed: {
    chains() {
      if (!this.inboundData || this.inboundData.length === 0 || !this.mimir) {
        return []
      }

      return this.inboundData.map((chain) => ({
        chain: chain.chain,
        haltHeight: this.maxMimirValue(
          (key) =>
            new RegExp(`.*HALT.*${chain.chain}CHAIN`).test(key) ||
            key === 'HALTCHAINGLOBAL'
        ),
        haltTradingHeight: this.maxMimirValue(
          (key) =>
            new RegExp(`HALT${chain.chain}TRADING`).test(key) ||
            key === 'HALTTRADING'
        ),
        haltLPHeight: this.maxMimirValue(
          (key) =>
            new RegExp(`PAUSELP${chain.chain}`).test(key) || key === 'PAUSELP'
        ),
        haltSigningHeight: this.maxMimirValue(
          (key) =>
            new RegExp(`HALTSIGNING${chain.chain}`).test(key) ||
            key === 'HALTSIGNING'
        ),
      }))
    },
    networkStatus() {
      // LP pauses don't stop the chain from operating: they only limit it
      const hasHalts = this.chains.some((c) =>
        this.statusFields.some(
          (s) => s.field !== 'haltLPHeight' && c[s.field] >= 1
        )
      )
      if (hasHalts) {
        return 'Degraded'
      }

      const hasLPPauses = this.chains.some((c) => c.haltLPHeight >= 1)
      if (hasLPPauses) {
        return 'Limited'
      }

      return 'All Operational'
    },
  },
  mounted() {
    this.$api
      .getChurn()
      .then(({ data }) => {
        if (data && data.length > 0) {
          this.latestChurn = data.reduce((a, c) =>
            +c.height > +a.height ? c : a
          )
        }
      })
      .catch((error) => {
        console.error('Error fetching churns:', error)
      })
  },
  methods: {
    churnDate(timestamp) {
      return moment.unix(timestamp / 1e9).format('MMM D, YYYY')
    },
    churnDuration(timestamp) {
      return moment.unix(timestamp / 1e9).fromNow(true)
    },
    maxMimirValue(matcher) {
      const values = Object.keys(this.mimir)
        .filter((key) => matcher(key) && this.mimir[key] !== 0)
        .map((key) => this.mimir[key])

      return values.length > 0 ? Math.max(...values) : 0
    },
  },
}
</script>

<style lang="scss" scoped>
.more-link {
  text-decoration: none;
}

.churn-info {
  display: flex;
  justify-content: space-between;
  padding: $space-12 $space-16;

  .churn-item {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    &:last-child {
      align-items: flex-end;
    }

    .churn-label {
      color: var(--font-color);
      font-size: $font-size-xs;
      text-transform: uppercase;
      font-weight: 600;
    }

    .churn-value {
      color: var(--sec-font-color);
      font-size: $font-size-sm;
      font-weight: 600;
      text-decoration: none;
    }
  }
}

.status-row {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, 1fr);
  align-items: center;
  padding: $space-8 $space-0;
  border-bottom: 1px solid var(--border-color);

  &:last-child {
    border-bottom: none;
  }

  &.status-header {
    color: var(--font-color);
    font-size: $font-size-sm;
    font-weight: 600;
    text-transform: uppercase;

    .status-cell {
      font-size: $font-size-xs;
    }
  }

  .chain-cell {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    .chain-name {
      color: var(--sec-font-color);
      font-weight: 600;
      font-size: $font-size-sm;
    }
  }

  .status-cell {
    display: flex;
    justify-content: center;
    align-items: center;

    .ok {
      color: var(--green);
      font-size: $font-size-sm;
    }

    .status-icon {
      width: 1.1rem;
      height: 1.1rem;
      fill: var(--red);
    }
  }
}
</style>
