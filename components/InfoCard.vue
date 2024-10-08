<template>
  <component :is="inner ? 'div' : 'card'" extra-class="info-card">
    <div class="flex-containers">
      <div
        v-for="(container, key, i) in flexContainers"
        :key="`container-${i}`"
        :class="['flex-container']"
      >
        <div
          v-for="(section, rowIndex) in container"
          :key="`row-${rowIndex}`"
          class="flex-section"
          :style="addStyle(section)"
        >
          <template v-if="section.allSlot">
            <slot :name="section.allSlot" :items="section.items" />
          </template>
          <template v-else>
            <h4>{{ section.title }}</h4>
            <div :class="['flex-items', { cluster: section.cluster }]">
              <div
                v-for="(item, colIndex) in section.items"
                :key="`item-${rowIndex}-${colIndex}`"
                class="flex-item"
                :style="[
                  {
                    borderTop: item.header
                      ? '1px solid var(--border-color)'
                      : false,
                    marginTop: item.header ? '8px' : false,
                    paddingTop: item.header ? '8px' : false,
                  },
                ]"
              >
                <h4 v-if="item.header">
                  {{ item.header }}
                </h4>
                <template v-else>
                  <div class="item-name">
                    <template v-if="hasSlot('name') && item.nameSlot">
                      <slot name="name" :item="item" />
                    </template>
                    <template v-else>
                      {{ item.name }}
                      <unknown-icon
                        v-if="item.extraInfo"
                        v-tooltip="item.extraInfo"
                        class="header-icon"
                      />
                    </template>
                  </div>
                  <skeleton-item
                    :loading="isReady(item)"
                    custom-class="info-loader"
                  >
                    <div
                      v-if="typeof item.value === 'number' || item.value"
                      class="item-value"
                    >
                      <template v-if="item.valueSlot">
                        <slot :name="item.valueSlot" :item="item" />
                      </template>
                      <template v-else>
                        <template v-if="item.usdValue">
                          <small v-if="item.value && runePrice">
                            ({{ (runePrice * item.value) | currency }}) -
                          </small>
                        </template>
                        <span v-if="item.filter">
                          {{ item.filter(item.value) }}
                        </span>
                        <span v-else>
                          {{ item.value || '-' }}
                        </span>
                        <progress-icon
                          v-if="item.progress"
                          :data-number="item.progress.data"
                          :is-down="item.progress.down"
                          :filter="item.progress.filter"
                        />
                      </template>
                    </div>
                  </skeleton-item>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </component>
</template>

<script>
import { mapGetters } from 'vuex'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  name: 'InfoCard',
  components: { UnknownIcon },
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    inner: Boolean,
    isLoading: Boolean,
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    flexContainers() {
      const flexes = {}
      for (let i = 0; i < this.options.length; i++) {
        const index = this.options[i].rowStart
        if (flexes[index]) {
          flexes[index].push(this.options[i])
        } else {
          flexes[index] = [this.options[i]]
        }
      }

      return flexes
    },
  },
  methods: {
    addStyle(item) {
      return {
        flex: item.colSpan,
      }
    },
    hasSlot(name = 'default') {
      return !!this.$slots[name] || !!this.$scopedSlots[name]
    },
    isReady(item) {
      if (!(typeof item.value === 'string') && isNaN(item.value)) {
        return true
      }
      return !(typeof item.value === 'number') && !item.value
    },
  },
}
</script>

<style lang="scss" scoped>
.usd-value {
  font-size: 0.9rem;
  margin-right: 12px;
}
.flex-containers {
  .flex-container {
    display: flex;
    flex-wrap: wrap;
    min-width: 100%;
    overflow: hidden;

    @include md {
      margin-bottom: 1rem;

      &:last-of-type {
        margin-bottom: 0;
        .flex-section {
          padding-bottom: 0;
          border-bottom: none !important;
        }
      }
    }

    @include sm {
      .flex-item {
        flex-direction: row;
      }
    }

    h4 {
      font-weight: bold;
      color: var(--sec-font-color);
      font-size: 1.1rem;
      margin: 0 0 0.5rem 0;
    }

    .flex-section {
      flex: 1;
      margin: 0 0.7rem;
      padding-bottom: 0.7rem;
      margin-bottom: 0.7rem;
      border-bottom: 1px solid var(--border-color);

      @include md {
        margin-bottom: 0;
        border-bottom: 1px solid var(--border-color);

        // &:nth-of-type(even) {
        //   border-left: 1px solid var(--border-color);
        // }
      }

      .flex-items {
        gap: 0.3rem 0;
        min-width: 320px;

        &.cluster {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .flex-item {
            justify-content: start;
          }
        }

        .flex-item {
          display: flex;
          flex-direction: column;
          font-size: 0.9rem;
          justify-content: space-between;

          @include md {
            flex-direction: row;
            font-size: 1rem;
            align-items: center;
            padding: 4px 0;
          }

          .info-loader {
            margin-top: 0;
            min-width: 200px;
          }

          .item-name {
            display: flex;
            align-items: center;

            .header-icon {
              fill: var(--font-color);
              height: 12px;

              @include md {
                height: 16px;
              }
            }
          }

          .item-value {
            display: flex;
            align-items: center;
            gap: 5px;
            color: var(--sec-font-color);
            font-family: 'Roboto Mono';
          }
        }
      }
    }
  }
}
</style>
