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
            <div v-for="(b, j) in s.value" :key="j" :class="['mini-bubble', ...s.class]">
              {{ b.text | capitalize }}
            </div>
          </div>
          <component :is="checkType(s.type)" v-else :class="['value mono']" :to="toLink(s.type, s.value)">
            {{ s.formatter ? s.formatter(s.value) : s.value }}
            <arrow-icon v-if="checkType(s.type) === 'nuxt-link'" class="icon arrow-link" />
          </component>
        </template>
        <slot v-else :name="s.slotName" />
      </div>
    </div>
  </div>
</template>

<script>
import AngleIcon from '~/assets/images/angle-down.svg?inline'
import ArrowIcon from '@/assets/images/arrow.svg?inline'

export default {
  components: {
    AngleIcon,
    ArrowIcon
  },
  props: ['title', 'stacks', 'pending'],
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
    toLink (type, value) {
      if (type === 'address') {
        return `/address/${value}`
      } else if (type === 'hash') {
        return `/tx/${value}`
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
        justify-content: space-between;
        padding: .3rem 0;

        .value {
          flex-wrap: wrap;
          color: var(--sec-font-color);

          &.bubble-wrapper {
            display: flex;
            gap: .5rem;
          }
        }

        a.value {
          display: flex;
          align-items: center;
          color: var(--primary-color);
          text-decoration: none;
          gap: .2rem;

          .arrow-link {
            fill: var(--primary-color);
            transform: rotate(45deg);
            margin: 0;
            height: 1rem;
            width: 1rem;
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
