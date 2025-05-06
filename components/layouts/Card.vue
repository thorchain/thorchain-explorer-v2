<template>
  <div
    :class="['card-container', { 'loading-container': isLoading }, extraClass]"
  >
    <BounceLoader v-if="isLoading" color="var(--font-color)" size="3rem" />
    <template v-else>
      <div
        v-if="title"
        :class="[
          { 'has-extra': $slots.header },
          'card-header',
          { 'has-image': imgSrc },
        ]"
      >
        <div class="header-title-section">
          <img
            v-if="imgSrc"
            class="stat-image"
            :src="imgSrc"
            :style="imgStyle"
          />
          <h2 class="card-header-title">
            {{ title }}
          </h2>
        </div>
        <slot name="header" />
      </div>
      <div v-else-if="navs" class="card-header" :style="{ padding: '0 1rem' }">
        <div class="nav-header">
          <div
            v-for="(nav, i) in navs"
            :key="i"
            :class="[
              'nav-section',
              'card-header-title',
              { active: actNav == nav.value },
            ]"
            @click="$emit('update:actNav', nav.value)"
          >
            {{ nav.title }}
          </div>
        </div>
        <slot name="header" />
      </div>
      <div :class="['card-body', bodyClass]">
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
    BounceLoader,
  },
  props: [
    'imgStyle',
    'imgSrc',
    'title',
    'isLoading',
    'extraClass',
    'bodyClass',
    'fullscreen',
    'navs',
    'actNav',
  ],
  emits: ['update'],
  methods: {
    ...mapMutations(['toggleFullscreen']),
  },
  mode: {
    prop: 'actNav',
    event: 'update',
  },
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
  border-radius: $radius-lg;
  background-color: var(--card-bg-color);
  max-width: 100%;
  margin: $space-0 $space-10;

  @include lg {
    margin: $space-0;
  }

  &.loading-container {
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .card-header {
    padding: $space-16;
    margin-bottom: $space-0;
    border-bottom: 1px solid var(--border-color);
    justify-content: space-between;

    display: flex;
    align-items: center;

    .nav-header {
      display: flex;
      overflow: scroll;

      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    .header-title-section {
      display: flex;
      align-items: center;
    }

    .card-header-title {
      color: var(--sec-font-color);
      font-size: $font-size-desktop;
      font-weight: 700;
      margin-bottom: $space-0;
      margin: $space-0;
      @include lg {
        font-size: $font-size-md;
      }
    }

    &.has-image {
      padding: $space-12;
    }

    &.has-extra {
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 0.5rem;

      @include lg {
        margin: $space-0;
        gap: $space-0;
      }
    }
    .nav-section {
      cursor: pointer;
      color: var(--font-color);
      border-bottom: 1px solid transparent;
      margin-right: $space-16;
      padding: $space-16 0.1rem;

      &.active {
        color: var(--sec-font-color);
        border-bottom: 2px solid var(--sec-font-color);
      }
    }

    .stat-image {
      margin-right: $space-10;
      height: 36px;
    }

    .fullscreen-container {
      display: flex;
      align-items: center;
      margin-left: auto;
      gap: 10px;
      cursor: pointer;
      padding: $space-5;
      border-radius: $radius-s;

      .icon {
        margin-right: $space-0;
      }

      &:hover {
        background-color: var(--active-bg-color);
      }
    }
  }

  .card-body {
    flex: 1;
    padding: $space-12;
    .row-item {
      justify-content: space-between;
      display: flex;

      .meta {
        display: flex;
        flex-direction: column;
        color: var(--sec-font-color);

        .header {
          font-size: $font-size-mobile;
        }

        .timestamp {
          color: var(--font-color);
          font-size: $font-size-xs;
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
          font-size: $font-size-sm;
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
      margin-top: $space-12;
      margin-bottom: $space-12;
      opacity: 0.75;
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

.streaming-flex {
  display: flex;
  flex-direction: column;
}
</style>
