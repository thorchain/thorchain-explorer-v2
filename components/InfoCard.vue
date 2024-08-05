<template>
  <card>
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
          <h4>{{ section.title }}</h4>
          <div class="flex-items">
            <div
              v-for="(item, colIndex) in section.items"
              :key="`item-${rowIndex}-${colIndex}`"
              class="flex-item"
            >
              <div class="item-name">
                {{ item.name }}
                <unknown-icon
                  v-if="item.extraInfo"
                  v-tooltip="item.extraInfo"
                  class="header-icon"
                />
              </div>
              <skeleton-item :loading="!item.value" custom-class="info-loader">
                <div v-if="item.value" class="item-value">
                  <template v-if="item.slotName">
                    <slot :name="item.slotName" :item="item" />
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
                    />
                  </template>
                </div>
              </skeleton-item>
            </div>
          </div>
        </div>
      </div>
    </div>
  </card>
</template>

<script>
import { mapGetters } from 'vuex'
import UnknownIcon from '~/assets/images/unknown.svg?inline'

export default {
  name: 'InfoCard',
  components: { UnknownIcon },
  props: {
    gridSettings: {
      type: Array,
      default: () => [],
    },
    isLoading: Boolean,
  },
  computed: {
    ...mapGetters({
      runePrice: 'getRunePrice',
    }),
    flexContainers() {
      const flexes = {}
      for (let i = 0; i < this.gridSettings.length; i++) {
        const index = this.gridSettings[i].rowStart
        if (flexes[index]) {
          flexes[index].push(this.gridSettings[i])
        } else {
          flexes[index] = [this.gridSettings[i]]
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
  },
}
</script>

<style lang="scss" scoped>
.flex-containers {
  .flex-container {
    display: flex;
    flex-wrap: wrap;
    min-width: 100%;

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
      padding: 0 0.7rem;
      padding-bottom: 0.7rem;
      margin-bottom: 0.7rem;
      border-bottom: 1px solid var(--border-color);

      @include md {
        margin-bottom: 0;
        border-bottom: 1px solid var(--border-color);

        &:nth-of-type(even) {
          border-left: 1px solid var(--border-color);
        }
      }

      .flex-items {
        display: grid;
        gap: 0.3rem 0;

        .flex-item {
          display: flex;
          align-items: center;
          flex-direction: column;
          justify-content: space-between;
          font-size: 0.9rem;

          @include md {
            flex-direction: row;
          }

          .info-loader {
            margin-top: 0;
            min-width: 200px;
          }

          .item-name {
            display: flex;

            .header-icon {
              fill: var(--font-color);
              height: 16px;
            }
          }

          .item-value {
            color: var(--sec-font-color);
            font-family: 'Roboto Mono';
          }
        }
      }
    }
  }
}
</style>
