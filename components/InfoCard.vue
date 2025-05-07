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
            <div class="section-header" :class="{ 'has-icon': section.icon }">
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
                        <span v-if="item.filter && item.value !== undefined">
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
                      <template v-if="item.extraText" class="item-value">
                        <small> ({{ item.extraText }}) </small>
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

    .header-content {
      margin-bottom: $space-12;
      h4 {
        margin: $space-0 !important;
      }
    }
  }
  .header-icon {
    height: 36px;
    width: 36px;
  }
  .header-content {
    display: flex;
    gap: $space-8;
    align-items: center;

    h4 {
      margin: $space-0;
    }
  }

  .more-link {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: $font-size-sm;
    margin-right: $space-8;

    svg {
      fill: currentColor;
      height: 1rem;
      width: 1rem;
    }
  }
}

.usd-value {
  font-size: $font-size-sm;
  margin-right: $space-12;
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
      margin-bottom: $space-16;
      flex-direction: row;

      &:last-of-type {
        margin-bottom: $space-0;
        .flex-section,
        .grid-section {
          padding-bottom: $space-0;
          border-bottom: none !important;
        }
      }
    }

    &:last-of-type {
      .flex-section:last-of-type {
        border-bottom: none !important;
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
      font-size: $font-size-mobile;
      margin: $space-0 $space-0 $space-8 $space-0;

      @include lg {
        font-size: $font-size-smm;
      }
    }

    .flex-section {
      flex: 1;
      padding-bottom: $space-12;
      margin-bottom: $space-12;
      border-bottom: 1px solid var(--border-color);
    }

    .grid-section {
      gap: 1rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: $space-12;
      margin-bottom: $space-12;
    }
    .grid-items {
      display: grid;
      gap: $space-16;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      margin: $space-12 $space-8;
      @include md {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }

      .grid-item {
        font-size: 0.9rem;
      }
      .item-name {
        display: flex;
        font-size: $font-size-sm;

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
        font-size: $font-size-desktop;
        gap: 5px;
        color: var(--sec-font-color);
        font-family: 'Roboto Mono';
      }
    }
    .flex-items {
      gap: 0.5rem 0;
      min-width: 320px;
      margin: $space-8 $space-8;
      display: flex;
      flex-direction: column;

      @include lg {
        gap: 0;
      }

      &.cluster {
        display: flex;
        flex-direction: row;
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
        font-size: $font-size-sm;
        justify-content: space-between;
        gap: 0.3rem 0;

        @include md {
          flex-direction: row;
          font-size: $font-size-desktop;
          align-items: center;
          padding: $space-4 $space-0;
        }

        .info-loader {
          margin-top: $space-0;
          min-width: 200px;
        }

        .item-name {
          display: flex;
          font-size: $font-size-sm;

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
          font-size: $font-size-desktop;
          gap: 5px;
          color: var(--sec-font-color);
          font-family: 'Roboto Mono';
        }
      }
    }
  }
}
</style>
