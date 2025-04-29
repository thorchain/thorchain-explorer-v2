<template>
  <div class="footer">
    <div class="footer-container">
      <div class="footer-text">
        <span>THORChain Explorer 2025 🌸 - Made with ❤</span>
      </div>

      <div class="footer-text">
        <div ref="block-height" class="block-height">
          <small style="color: var(--primary-color)" class="mono value">
            <block-icon class="block-icon" />
            {{ currentBlock | number('0,0') }}
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
    currentBlock() {
      return this.$store.state.chainsHeight?.THOR ?? 0
    },
  },
  watch: {
    currentBlock(newVal) {
      this.animate('block-height', 'animate')
    },
  },
  methods: {},
}
</script>

<style lang="scss" scoped>
.footer {
  border-top: 1px solid var(--border-color);
  padding: $space-16 $space-32;
  color: var(--sec-font-color);
  text-align: center;
  position: relative;

  .block-height {
    display: flex;
    align-items: center;
    justify-content: center;

    &.animate {
      .value {
        -webkit-animation: border-offset 2s both;
        animation: border-offset 2s both;
      }
    }

    .value {
      display: flex;
      padding: $space-2 $space-4;
      align-items: center;
      justify-content: center;
      position: relative;
      border-radius: $radius-lg;
      border: 1px solid transparent;

      .block-icon {
        fill: var(--primary-color);
        width: 0.8rem;
        height: 0.8rem;
        margin-right: $space-5;
      }
    }
  }

  .footer-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    min-height: 3rem;

    @include md {
      flex-direction: row;
    }
  }

  .footer-text {
    display: flex;
    font-size: $font-size-sm;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.8rem;
    line-height: 16px;

    flex-direction: column-reverse;

    @include md {
      flex-direction: row;
    }
  }

  .footer-icon {
    display: flex;
    flex-direction: row;
    align-items: center;
    svg {
      width: 20px !important;
      height: 20px !important;
      margin: $space-0 $space-8;
      &:hover {
        color: var(--primary-color);
      }
    }
  }
}

@keyframes border-offset {
  0% {
    border-color: transparent;
  }

  50% {
    border-color: var(--primary-color);
  }

  100% {
    border-color: transparent;
  }
}
</style>
