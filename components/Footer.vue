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
          :key="blockHeight"
          style="color: var(--primary-color)"
          class="mono value new-value"
        >
          {{ blockHeight | number('0,0') }}
        </small>
        
        <small
          v-else
          class="mono value old-value"
        >
          -
        </small>
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
  
  &.animate {
    .old-value {
      opacity: 0;
      transform: translateX(20px);
      animation: fade-out 0.5s forwards;
    }
    .new-value {
      opacity: 1;
      transform: translateX(0);
      animation: fade-in 0.5s forwards;
    }
  }

  .block-icon {
    fill: currentColor;
    width: 1rem;
    height: 1rem;
  }
}
@keyframes fade-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(20px);
  }
}

@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
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
</style>
