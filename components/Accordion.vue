<template>
  <div class="accordion">
    <div :class="['accordion-info', {'not-collapsed': show}]" @click="toggleAccordion">
      <div class="accordion-info-left">
        {{ title | capitalize }}
        <angle-icon v-if="showAccordion" class="trigger" />
      </div>
      <div class="accordion-info-right">
        <slot name="header-extra" />
        <dot-live v-if="pending" />
      </div>
    </div>
    <div v-if="showAccordion" ref="aci" :class="['accordion-inner', {'show': show}]">
      <div v-for="(s,i) in (stacks.filter(s => s.is))" :key="i" class="stack-item">
        <template v-if="!s.slotName">
          <div class="key">
            {{ s.key | capitalize }}
          </div>
          <div v-if="s.type === 'bubble'" class="value mono bubble-wrapper">
            <div v-for="(b, j) in s.value" :key="j" :class="['mini-bubble', ...b.class]">
              {{ b.text | capitalize }}
            </div>
          </div>
          <div v-else :class="['value', {'link': isLink(s.type)}]">
            <component :is="checkType(s.type)" :class="['value mono']" :to="toLink(s.type, s.value)">
              {{ s.formatter ? s.formatter(s.value) : s.value }}
              <arrow-icon v-if="checkType(s.type) === 'nuxt-link'" class="icon arrow-link" />
            </component>
            <a v-if="isLink(s.type) && s.asset" class="value" target="_blank" :href="getUrl(s.asset, s.value)" rel="noopener noreferrer">
              <external class="icon external-link" />
            </a>
          </div>
        </template>
        <slot v-else :name="s.slotName" />
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import ArrowIcon from '@/assets/images/arrow.svg?inline'
import External from '@/assets/images/external.svg?inline'
import { assetFromString, getExplorerAddressUrl } from '~/utils'

export default {
  components: {
    AngleIcon,
    ArrowIcon,
    External
  },
  props: ['title', 'stacks', 'pending', 'showAtFirst'],
  data () {
    return {
      labels: this.data?.labels ?? [],
      show: false
    }
  },
  computed: {
    showAccordion () {
      if (this.stacks.length > 0) {
        return true
      }
      return false
    }
  },
  mounted () {
    if (this.pending || this.showAtFirst) {
      this.toggleAccordion()
    }
  },
  methods: {
    toggleAccordion () {
      this.show = !this.show
      if (this.show) {
        this.$refs.aci.style.maxHeight = `${this.$refs.aci.scrollHeight}px`
      } else {
        this.$refs.aci.style.maxHeight = null
      }
    },
    checkType (type) {
      if (type === 'address' || type === 'hash') {
        return 'nuxt-link'
      }
      return 'div'
    },
    isLink (type) {
      return type === 'address' || type === 'hash'
    },
    toLink (type, value) {
      if (type === 'address') {
        return `/address/${value}`
      } else if (type === 'hash') {
        return `/tx/${value}`
      }
    },
    getUrl (assetString, value) {
      if (!assetString) {
        return
      }

      try {
        const { chain, trade, synth } = assetFromString(assetString)
        if (synth || trade) {
          return
        }
        return getExplorerAddressUrl(chain, value)
      } catch (error) {
        console.error('could\'t read the asset')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .accordion {
    margin: .5rem 1.5rem;

    .accordion-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      border-radius: .5rem;
      cursor: pointer;

      &:hover {
        color: var(--sec-font-color);

        .trigger {
          fill: var(--sec-font-color);
        }
      }

      .trigger {
        width: 1rem;
        height: 1rem;
        fill: var(--font-color);
      }

      &.not-collapsed {
        .trigger {
          transform: rotate(180deg);
        }
      }

      .accordion-info-left, .accordion-info-right {
        display: flex;
        align-items: center;
        gap: .5rem;
      }
    }

    .accordion-inner {
      font-size: .875rem;
      overflow: hidden;
      transition: all .3s ease-in-out;

      max-height: 0;
      opacity: 0;
      margin-top: 0;

      display: flex;
      flex-direction: column;

      &.show {
        margin-top: .5rem;
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
        opacity: 1;
      }

      .stack-item {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        padding: .3rem 0;
        gap: 5px;

        .value {
          display: flex;
          flex-wrap: wrap;
          color: var(--sec-font-color);
          gap: 7px;

          &.bubble-wrapper {
            display: flex;
            gap: .5rem;
          }

          &.link {
            display: flex;

            a {
              color: var(--primary-color);
              align-items: center;
              text-decoration: none;
              gap: .1rem;

              .icon {
                cursor: pointer;
                fill: var(--primary-color);
                margin: 0;
                height: 1rem;
                width: 1rem;
              }

              &:hover {
                color: var(--sec-font-color);

                .icon {
                  fill: var(--sec-font-color);
                }
              }
            }
          }
        }

        &:last-of-type {
          padding-bottom: .5rem;
        }

        &:first-of-type {
          padding-top: .5rem;
        }
      }
    }
  }
</style>
