<template>
  <div :class="['card-container', {'loading-container': isLoading}, extraClass]">
    <BounceLoader v-if="isLoading" color="var(--font-color)" size="3rem" />
    <template v-else>
      <div v-if="title" class="card-header">
        <img v-if="imgSrc" class="stat-image" :src="imgSrc">
        <h2 class="card-header-title">
          {{ title }}
        </h2>

        <div v-if="fullscreen" class="fullscreen-container" @click="toggleFullscreen">
          <span>
            FullScreen
          </span>
          <ExpandIcon class="icon" />
        </div>
      </div>
      <div class="card-body">
        <slot />
      </div>
    </template>
  </div>
</template>

<script>
import BounceLoader from 'vue-spinner/src/BounceLoader.vue'
import ExpandIcon from 'assets/images/expand.svg?inline'
import { mapMutations } from 'vuex'

export default {
  components: {
    BounceLoader,
    ExpandIcon
  },
  props: ['imgSrc', 'title', 'isLoading', 'extraClass', 'fullscreen'],
  methods: {
    ...mapMutations([
      'toggleFullscreen'
    ])
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

    .card-header-title {
      color: var(--font-color);
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0;
      margin: 0;
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
}
</style>
