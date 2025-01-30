<template>
  <div class="footer">
    <div class="footer-container">
      <div class="text">
        <p>THORChain Explorer 2025 ❄️ - Made with ❤</p>
      </div>
      <div class="block-height" :class="{ animate: blockHeight !== null }">
        <BlockIcon class="block-icon" />
        <small style="color: var(--sec-font-color)">Block Height</small>
        <small
          v-if="blockHeight"
          style="color: var(--primary-color)"
          class="mono value"
        >
          {{ blockHeight | number('0,0') }}
        </small>
        <small v-else>-</small>
      </div>

      <div class="footer-icon">
        <a
          href="https://gitlab.com/thorchain"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Gitlab />
        </a>
        <a
          href="https://github.com/thorchain"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github />
        </a>
        <a
          href="https://discord.gg/tW64BraTnX"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Discord />
        </a>
        <a
          href="https://x.com/THORChain"
          target="_blank"
          rel="noopener noreferrer"
        >
          <XIcon />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import XIcon from '~/assets/images/x.svg?inline'
import Github from '~/assets/images/github-brands.svg?inline'
import Discord from '~/assets/images/discord-brands.svg?inline'
import Gitlab from '~/assets/images/gitlab.svg?inline'
import BlockIcon from '~/assets/images/block.svg?inline'

export default {
  name: 'FooterContent',
  components: {
    XIcon,
    Github,
    Discord,
    Gitlab,
    BlockIcon,
  },
  data() {
    return {
      blockHeight: null,
    }
  },
  computed: {
    ...mapGetters({
      chainsHeight: 'getChainsHeight',
    }),
  },
  watch: {
    'chainsHeight.THOR'(newHeight) {
      this.blockHeight = newHeight
      this.triggerAnimation() 
    },
  },
  methods: {
    triggerAnimation() {
      this.$nextTick(() => {
        const blockHeight = this.$el.querySelector('.block-height')
        blockHeight.classList.add('animate')

        setTimeout(() => {
          blockHeight.classList.remove('animate')
        }, 1000)
      })
    }
  },
}
</script>

<style lang="scss" scoped>
.footer {
  border-top: 1px solid var(--border-color);
  padding: 1rem 2rem;
  color: var(--sec-font-color);
  text-align: center;
  position: relative;
}

.block-height {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.8rem;

  @include md {
    margin-bottom: 0rem;
  }
  @include lg {
    position: relative;
    right: 3rem;
  }
  .block-icon {
    fill: currentColor;
    width: 1rem;
    height: 1rem;
  }

  &.animate {
    .value {
      -webkit-animation: jello-vertical 1s both;
      animation: jello-vertical 1s both;
    }
  }
}

.footer-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.text {
  font-size: 10px;
}
@include md {
  .footer-container {
    flex-direction: row;
  }
  .text {
    font-size: 14px;
  }
}
.footer-icon {
  display: flex;
  flex-direction: row;
  align-items: center;
  svg {
    width: 20px !important;
    height: 20px !important;
    margin: 0 0.5rem;
    &:hover {
      color: var(--primary-color);
    }
  }
}

@keyframes jello-vertical {
  0% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
  30% {
    -webkit-transform: scale3d(0.75, 1.25, 1);
    transform: scale3d(0.75, 1.25, 1);
  }
  40% {
    -webkit-transform: scale3d(1.25, 0.75, 1);
    transform: scale3d(1.25, 0.75, 1);
  }
  50% {
    -webkit-transform: scale3d(0.85, 1.15, 1);
    transform: scale3d(0.85, 1.15, 1);
  }
  65% {
    -webkit-transform: scale3d(1.05, 0.95, 1);
    transform: scale3d(1.05, 0.95, 1);
  }
  75% {
    -webkit-transform: scale3d(0.95, 1.05, 1);
    transform: scale3d(0.95, 1.05, 1);
  }
  100% {
    -webkit-transform: scale3d(1, 1, 1);
    transform: scale3d(1, 1, 1);
  }
}
</style>
