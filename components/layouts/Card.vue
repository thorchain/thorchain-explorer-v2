<template>
  <div :class="['card-container', {'loading-container': isLoading}, extraClass]">
    <BounceLoader v-if="isLoading" color="var(--font-color)" size="3rem" />
    <template v-else>
      <div v-if="title" :class="[{ 'has-extra': $slots.header }, 'card-header']">
        <div class="header-title-section">
          <img v-if="imgSrc" class="stat-image" :src="imgSrc">
          <h2 class="card-header-title">
            {{ title }}
          </h2>
        </div>
        <slot name="header" />
      </div>
      <div v-else-if="navs" class="card-header" :style="{padding: '0 1rem'}">
        <div
          v-for="(nav, i) in navs"
          :key="i"
          :class="['nav-section', 'card-header-title', {'active': actNav == nav.value}]"
          @click="$emit('update:actNav', nav.value)"
        >
          {{ nav.title }}
        </div>
      </div>
      <div class="card-body">
        <slot />
      </div>
      <div v-if="$slots['footer']" class="footer">
        <slot name="footer" />
      </div>
    </template>
  </div>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import { mapMutations } from 'vuex'

export default {
  components: {
    BounceLoader
  },
  props: ['imgSrc', 'title', 'isLoading', 'extraClass', 'fullscreen', 'navs', 'actNav'],
  emits: ['update'],
  methods: {
    ...mapMutations([
      'toggleFullscreen'
    ])
  },
  mode: {
    prop: 'actNav',
    event: 'update'
  }
}
</script>

<style lang="scss" scoped>
.card-container {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  word-wrap: break-word;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg-color);

  border-left: 0;
  border-right: 0;

  @include lg {
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  &.loading-container {
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .card-header {
    padding: 1rem;
    margin-bottom: 0;
    border-bottom: 1px solid var(--border-color);

    display: flex;
    align-items: center;

    .header-title-section {
      display: flex;
      align-items: center;
    }

    .card-header-title {
      color: var(--sec-font-color);
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0;
      margin: 0;
    }

    &.has-extra {
      justify-content: space-between;
    }

    .nav-section {
      cursor: pointer;
      color: var(--font-color);
      border-bottom: 1px solid transparent;
      margin-right: 1rem;
      padding: 1rem .1rem;

      &.active {
        color: var(--sec-font-color);
        border-bottom: 2px solid var(--sec-font-color);
      }
    }

    .stat-image {
      margin-right: 10px;
      height: 1.5rem;
    }

    .fullscreen-container {
      display: flex;
      align-items: center;
      margin-left: auto;
      gap: 10px;
      cursor: pointer;
      padding: 5px;
      border-radius: 5px;

      .icon {
        margin-right: 0;
      }

      &:hover {
        background-color: var(--active-bg-color);
      }
    }
  }

  .card-body {
    flex: 1;
    padding: .75rem;
    .row-item {
      justify-content: space-between;
      display: flex;

      .meta {
        display: flex;
        flex-direction: column;
        color: var(--sec-font-color);

        .header {
          font-size: .975rem;
        }

        .timestamp {
          color: var(--font-color);
          font-size: .75rem;
        }
      }

      .txs {
        display: flex;
        flex-direction: column;
        text-overflow: ellipsis;
        overflow: hidden;
        width: 66%;

        > span {
          white-space: nowrap;
          word-break: keep-all;
          font-size: .875rem;
          color: var(--sec-font-color);

          .value {
            color: var(--primary-color);
          }
        }

        a {
          cursor: pointer;
        }
      }
    }

    .hr-space {
      margin-top: 0.75rem;
      margin-bottom: 0.75rem;
      opacity: .75;
      height: 0;
      border: 0;
      border-top: 1px solid var(--border-color);

      &:last-of-type {
        display: none;
      }
    }
  }

  .footer {
    margin-top: auto;
    border-top: 1px solid var(--border-color);
  }
}
</style>
