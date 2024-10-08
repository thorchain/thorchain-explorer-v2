<template>
  <div class="footer">
    <div class="footer-container">
      <div class="text">
        <p>THORChain Explorer 2024 - Made with ❤</p>
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
import XIcon from '~/assets/images/x.svg?inline'
import Github from '~/assets/images/github-brands.svg?inline'
import Discord from '~/assets/images/discord-brands.svg?inline'
import Gitlab from '~/assets/images/gitlab.svg?inline'

export default {
  name: 'FooterContent',
  components: {
    XIcon,
    Github,
    Discord,
    Gitlab,
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
