<template>
  <card title="Latest Blocks">
    <div>
      <template v-if="burnedBlocks.length > 0">
        <transition-group name="block" tag="div">
          <div
            v-for="block in burnedBlocks"
            :key="block.blockHeight"
            class="block-items"
          >
            <div class="block-info-overview">
              <nuxt-link
                class="height clickable"
                :to="`/block/${block.blockHeight}`"
              >
                {{ block.blockHeight | number('0,0') }}
              </nuxt-link>
              <small class="duration">
                {{ getDuration(block.timestamp) }} Seconds
              </small>
            </div>
            <div class="middle-section-overview">
              <div class="block-burned-item">
                <small>Burned</small>
                <div class="burn-item mini-bubble orange">
                  <Burn class="burn-icon"></Burn>
                  {{ decimalFormat(block.burnedAmount / 1e8) }}
                </div>
              </div>

              <div class="block-burned-item">
                <small>Dev</small>
                <div class="burn-item mini-bubble yellow">
                  <rune class="rune-icon"></rune>
                  <div class="amount-burn">
                    {{ decimalFormat(block.devAmount / 1e8) }}
                  </div>
                </div>
              </div>

              <div class="block-burned-item">
                <small>Pool</small>
                <div class="burn-item mini-bubble info">
                  <rune class="rune-icon"></rune>
                  <div class="amount-burn">
                    {{ decimalFormat(block.poolAmount / 1e8) }}
                  </div>
                </div>
              </div>

              <div class="block-burned-item">
                <small>Bond</small>
                <div class="burn-item mini-bubble">
                  <rune class="rune-icon"></rune>
                  <div class="amount-burn">
                    {{ decimalFormat(block.bondAmount / 1e8) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </template>
      <template v-else>
        <div v-for="index in 15" :key="index" class="block-items">
          <div class="block-info-overview">
            <skeleton-loader width="80px"></skeleton-loader>
            <skeleton-loader width="60px"></skeleton-loader>
          </div>
          <div class="middle-section-overview">
            <div
              v-for="(item, itemIndex) in skeletonItems"
              :key="itemIndex"
              class="block-burned-item"
            >
              <skeleton-loader :width="item.labelWidth"></skeleton-loader>
              <div>
                <skeleton-loader width="50px"></skeleton-loader>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </card>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import Burn from '~/assets/images/burn.svg?inline'
import Rune from '~/assets/images/rune.svg?inline'
import SkeletonLoader from '~/components/SkeletonLoader.vue'

export default {
  name: 'LatestBlocks',
  components: {
    BounceLoader,
    Burn,
    Rune,
    SkeletonLoader,
  },
  props: {
    burnedBlocks: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      skeletonItems: [
        { labelWidth: '40px' },
        { labelWidth: '30px' },
        { labelWidth: '35px' },
        { labelWidth: '35px' },
      ],
    }
  },
  methods: {
  }
}
</script>

<style lang="scss" scoped>
.block-items {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding: $space-8 $space-0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
  .block-info-overview {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .height {
      color: var(--primary-color);
      text-decoration: none;
    }
  }
  .block-burned-item {
    padding: $space-4 $space-5;
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 0.3rem;
  }
  .amount-burn {
    font-size: $font-size-xs;
    color: var(--sec-font-color);
    font-weight: 500;
  }

  .burn-item {
    display: flex;
    gap: 0.2rem;
    align-items: center;
  }
  .middle-section-overview {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}

.block-enter-active {
  transition: all 1s;
  .block-info-overview.height {
    color: #ffa86b;
  }
}

.burn-icon {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: $radius-full;
  fill: #ffa86b;
}

.rune-icon {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: $radius-full;
  fill: var(--sec-font-color);
}

.block-enter {
  opacity: 0;
  transform: translateY(-30px);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 2rem;
}
</style>