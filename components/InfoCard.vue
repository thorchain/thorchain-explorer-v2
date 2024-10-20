<template>
  <component :is="inner ? 'div' : 'card'" extra-class="info-card">
    <div :class="grid ? 'grid-containers' : 'flex-containers'">
      <div
        v-for="(container, key, i) in flexContainers"
        :key="`container-${i}`"
        :class="[grid ? 'grid-container' : 'flex-container']"
      >
        <div
          v-for="(section, rowIndex) in container"
          :key="`row-${rowIndex}`"
          :class="grid ? 'grid-section' : 'flex-section'"
          :style="addStyle(section)"
        >
          <template v-if="section.allSlot">
            <slot :name="section.allSlot" :items="section.items" />
          </template>
          <template v-else>
            <div 
              class="section-header"
              :class="{ 'has-icon': section.icon }" 
            >
              <div class="header-content">
                <template v-if="section.icon">
                  <img :src="section.icon" class="header-icon" alt="Icon" />
                </template>
                <h4>{{ section.title }}</h4>
              </div>
              <nuxt-link
                v-if="section.link"
                :to="section.link"
                class="more-link clickable"
              >
                More
                <right-arrow />
              </nuxt-link>
            </div>
            <div
              :class="
                grid
                  ? 'grid-items'
                  : ['flex-items', { cluster: section.cluster }]
              "
            >
              <div
                v-for="(item, colIndex) in section.items"
                :key="`item-${rowIndex}-${colIndex}`"
                :class="grid ? 'grid-item' : 'flex-item'"
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
                          size="15.5px"
                        />
                      </template>
                      <template v-if="item.usdValue" class="item-value">
                        <small v-if="item.value && runePrice">
                          (${{ (runePrice * item.value) | number('0a') }})
                        </small>
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
import RightArrow from '~/assets/images/arrow-right.svg?inline'

export default {
  name: 'InfoCard',
  components: { UnknownIcon, RightArrow },
  props: {
    options: {
      type: Array,
      default: () => [],
    },
    inner: Boolean,
    isLoading: Boolean,
    link: {
      type: String,
      default: null,
    },
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
    grid() {
      return this.options.some((option) => option.grid)
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
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.has-icon {
    border-bottom: 1px solid var(--border-color);
  }
  .header-icon {
    height: 20px;
    width: 20px;
  }
  .header-content {
    display: flex;
    gap: 0.5rem;
  }
  h4 {
    margin: 0;
  }

  .more-link {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.9rem;

    svg {
      fill: currentColor;
      height: 1rem;
      width: 1rem;
    }
  }
}

.usd-value {
  font-size: 0.9rem;
  margin-right: 12px;
}
.flex-containers,
.grid-containers {
  .flex-container,
  .grid-container {
    display: flex;
    flex-wrap: wrap;
    min-width: 100%;
    overflow: hidden;
    flex-direction: column;

    @include md {
      margin-bottom: 1rem;
      flex-direction: row;

      &:last-of-type {
        margin-bottom: 0;
        .flex-section,
        .grid-section {
          padding-bottom: 0;
          border-bottom: none !important;
        }
      }
    }

    @include sm {
      .flex-item,
      .grid-item {
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
      padding-bottom: 0.7rem;
      margin-bottom: 0.7rem;
      border-bottom: 1px solid var(--border-color);
    }

    .grid-section {
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.7rem;
      margin-bottom: 0.7rem;
    }
    .grid-items {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      margin: 0.8rem 0.5rem;
      @include md{
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));

      }

      .grid-item {
        font-size: 0.9rem;
      }
      .item-name {
        display: flex;
        font-size: 14px;

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
        font-size: 16px;
        gap: 5px;
        color: var(--sec-font-color);
        font-family: 'Roboto Mono';
      }
    }
    .flex-items {
      gap: 0.3rem 0;
      min-width: 320px;
      margin: 0.5rem 0.5rem;

      &.cluster {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .flex-item,
        .grid-item {
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
          font-size: 14px;

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
          font-size: 16px;
          gap: 5px;
          color: var(--sec-font-color);
          font-family: 'Roboto Mono';
        }
      }
    }
  }
}
</style>
