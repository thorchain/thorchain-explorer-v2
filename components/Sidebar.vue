<template>
  <div class="side-bar-container" :class="{'menu': menu}">
    <div class="header">
      <div class="logo-wrapper">
        <ThorchainLogo class="logo" />
        <div class="thorchain-name">
          <strong>THORChain</strong>
          Explorer
        </div>
      </div>
      <div class="menu-wrapper" @click="toggleMenu()">
        <MenuIcon v-if="!menu" class="icon" />
        <CrossIcon v-else class="icon" />
      </div>
    </div>
    <div class="side-bar-lists">
      <template v-for="(item, index) in sidebarLists">
        <NuxtLink
          v-if="item"
          :id="`sidebar-${item.name}`"
          :key="index"
          :to="item.link"
          :class="['side-bar-item']"
          @click.native="toggleMenu(false)"
        >
          <div class="side-bar-wrap">
            <component :is="item.icon" class="icon selected" />
            <component :is="item.unicon" class="icon unselected" />
            <span class="sidebar-text">{{ item.name }}</span>
            <b-popover
              placement="right"
              custom-class="sidebar-popover"
              :target="`sidebar-${item.name}`"
              triggers="hover"
              :content="`${item.name}`"
            />
          </div>
        </NuxtLink>
      </template>
    </div>
    <div class="footer-wrapper">
      <div class="footer-item" @click="toggleExternal">
        <question />
        <span>Extra Links</span>
      </div>
      <div id="externalMenu">
        <transition name="fade-up">
          <div v-show="showExternalMenu" class="simple-card normal external-menu">
            <a href="https://twitter.com/THORChain" target="_blank">
              <TwitterLogo class="social-icon" />
              <span>Twitter</span>
            </a>
            <a href="https://discord.gg/KjPVnGy5jR" target="_blank">
              <DiscordLogo class="social-icon" />
              <span>Discord</span>
            </a>
            <a href="https://github.com/thorchain/thorchain-explorer-v2" target="_blank">
              <GithubLogo class="social-icon" />
              <span>Github</span>
            </a>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import ThorchainLogo from '~/assets/images/thorchain-logo.svg?inline'

import TwitterLogo from '~/assets/images/twitter-brands.svg?inline'
import DiscordLogo from '~/assets/images/discord-brands.svg?inline'
import GithubLogo from '~/assets/images/github-brands.svg?inline'
import Question from '~/assets/images/question.svg?inline'

import appsSelected from '~/assets/images/apps-selected.svg?inline'
import appsUnselected from '~/assets/images/apps-unselected.svg?inline'

import vectorSelected from '~/assets/images/vector-selected.svg?inline'
import vectorUnselected from '~/assets/images/vector-unselected.svg?inline'

import layersSelected from '~/assets/images/layers-selected.svg?inline'
import layersUnselected from '~/assets/images/layers-unselected.svg?inline'

import exchangeSelected from '~/assets/images/exchange-selected.svg?inline'
import exchangeUnselected from '~/assets/images/exchange-unselected.svg?inline'

import swimmerSelected from '~/assets/images/swimmer-selected.svg?inline'
import swimmerUnselected from '~/assets/images/swimmer-unselected.svg?inline'

import financeSelected from '~/assets/images/finance-selected.svg?inline'
import financeUnselected from '~/assets/images/finance.svg?inline'

import shieldSelected from '~/assets/images/shield.svg?inline'
import shieldUnselected from '~/assets/images/shield-unselected.svg?inline'

import chartSelected from '~/assets/images/chart-selected.svg?inline'
import chartUnselected from '~/assets/images/chart-unselected.svg?inline'

import MenuIcon from '~/assets/images/menu-burger.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'

export default {
  name: 'SideBar',
  components: {
    TwitterLogo,
    DiscordLogo,
    GithubLogo,
    appsSelected,
    appsUnselected,
    vectorSelected,
    vectorUnselected,
    layersSelected,
    layersUnselected,
    exchangeSelected,
    exchangeUnselected,
    swimmerSelected,
    swimmerUnselected,
    financeSelected,
    financeUnselected,
    shieldSelected,
    shieldUnselected,
    ThorchainLogo,
    MenuIcon,
    CrossIcon,
    chartSelected,
    chartUnselected,
    Question
  },
  data () {
    return {
      showExternalMenu: false,
      sidebarLists: [
        {
          name: 'Overview',
          unicon: 'appsUnselected',
          icon: 'appsSelected',
          link: '/dashboard'
        },
        {
          name: 'Nodes',
          unicon: 'layersUnselected',
          icon: 'layersSelected',
          link: '/nodes'
        },
        {
          name: 'Network',
          unicon: 'vectorUnselected',
          icon: 'vectorSelected',
          link: '/network'
        },
        {
          name: 'Transactions',
          unicon: 'exchangeUnselected',
          icon: 'exchangeSelected',
          link: '/transactions'
        },
        {
          name: 'Pools',
          unicon: 'swimmerUnselected',
          icon: 'swimmerSelected',
          link: '/pools'
        },
        {
          name: 'THORFi',
          unicon: 'financeUnselected',
          icon: 'financeSelected',
          link: '/thorfi'
        },
        {
          name: 'Vaults',
          unicon: 'shieldUnselected',
          icon: 'shieldSelected',
          link: '/vaults'
        },
        (
          process.env.NETWORK === 'mainnet'
            ? {
                name: 'Insights',
                unicon: 'chartUnselected',
                icon: 'chartSelected',
                link: '/insights'
              }
            : false
        )
      ]
    }
  },
  computed: {
    ...mapGetters({
      menu: 'getIsMenuOn'
    })
  },
  mounted () {
    window.addEventListener('click', (e) => {
      if (
        !document.getElementById('externalMenu')?.contains(e.target) &&
        !document.getElementsByClassName('footer-item')[0]?.contains(e.target)
      ) {
        this.showExternalMenu = false
      }
    })
  },
  methods: {
    ...mapMutations([
      'toggleMenu'
    ]),
    toggleExternal () {
      this.showExternalMenu = !this.showExternalMenu
    }
  }
}
</script>

<style lang="scss">
.side-bar-container {
  display: grid;
  grid-template-rows: 64px 1fr auto;
  min-height: 64px;

  background-color: var(--color-light);

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    min-height: 64px;

    border-bottom: 1px solid var(--border-color);

    .logo-wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Exo 2';
      font-size: .875rem;

      .logo {
        width: 1.5rem;
      }

      @include lg {
        font-size: 1rem;

        .logo {
          width: 1.75rem;
        }
      }
    }
  }

  .footer-wrapper {
    display: none;
    padding: 18px 20px;

    @include lg {
      display: block;
    }
  }

  .side-bar-lists {
    margin-top: 20px;
    display: none;

    .side-bar-item {
      display: flex;
      align-items: center;
      text-decoration: none;
      padding: 5px 20px;

      .icon {
        display: none;
      }

      &.nuxt-link-active {
        span {
          color: var(--font-color);
          font-weight: bolder;
        }
      }

      span {
        font-size: 2rem;
        height: 2rem;
        line-height: 2rem;
        color: var(--sec-font-color);
        font-family: 'Exo 2';
      }

      .side-bar-wrap {
        display: flex;
        align-items: center;
        padding: 12px 2rem;
        border-radius: 3rem;

        &:hover {
          background: var(--darker-bg);
        }
      }

      @include lg {
        .side-bar-wrap {
          padding-right: 1.5rem;
          padding-left: 1.5rem;
        }

        span {
          height: 1rem;
          line-height: 1rem;
        }

        &.nuxt-link-active {
          .selected {
            display: block;
          }

          span {
            color: var(--sec-font-color);
            font-weight: bolder;
          }

          .icon {
            fill: var(--sec-font-color);
          }
        }

        &:not(.nuxt-link-active) {
          .unselected {
            display: block;
          }
        }
      }
    }
  }

  .menu-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;

    @include lg {
      display: none;
    }
  }

  .icon {
    width: 1.5rem;
  }

  @include lg {
    grid-template-columns: 1fr;
    grid-template-rows: 64px 1fr 64px;
    grid-template-areas: "header" "sidebar" "footer";

    .header {
      grid-area: header;
      margin-bottom: 25px;
    }

    .side-bar-lists {
      grid-area: sidebar;
      display: flex;
      flex-direction: column;

      overflow: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }

      .side-bar-item {
        padding: 4px 0;
        padding-left: 20px;

        span {
          font-size: 14px;
        }

        .icon {
          width: 20px;
        }
      }
    }

    .footer-wrapper {
      grid-area: footer;
      align-self: end;
    }
  }

  &.menu {
    .header {
      margin-bottom: 25px;
    }

    .side-bar-lists {
      display: flex;
      flex-direction: column;
    }

    .footer-wrapper {
      display: flex;
    }
  }

  .footer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: var(--darker-bg);
    }

    svg {
      height: 1rem;
    }

    span {
      font-family: "Exo 2";
    }
  }

  @include olg {
    grid-template-columns: 4rem;
    grid-template-rows: 64px 1fr 64px;
    grid-template-areas: "header" "sidebar" "footer";

    .sidebar-text, .footer-wrapper, .thorchain-name {
      display: none;
    }

    .header {
      padding: 0;
      justify-content: center;
      align-items: center;
    }

    .side-bar-lists {
      align-items: center;

      .side-bar-item {
        width: 100%;
        padding: 0;

        .side-bar-wrap {
          justify-content: center;
          width: 100%;
          padding: 8px 12px;

          &:hover {
            border-radius: 0;
          }
        }

        .icon {
          margin: 0;
        }

        &.nuxt-link-active {
          .side-bar-wrap svg {
            fill: var(--primary-color);
          }
        }
      }
    }
  }
}

#externalMenu {
  .external-menu {
    position: absolute;
    min-width: 8.125rem;
    bottom: 50px;
    left: 20px;
    padding: 0.2rem 0;

    a {
      display: flex;
      align-items: center;
      color: var(--font-color);
      text-decoration: none;
      padding: 0.5rem;
      border-radius: 0.2rem;
      margin: 0 0.2rem;
      gap: 10px;
      font-family: "Exo 2";
      font-size: 0.8rem;

      .social-icon {
        fill: inherit;
        widows: 1rem;
        height: 1rem;
      }

      &:hover {
        background-color: var(--darker-bg);
      }
    }
  }
}

.sidebar-popover {
  background: var(--bg-color);
  padding: .5rem;
  border-radius: .5rem;
  margin-left: .5rem;
  border: 1px solid var(--border-color);
  display: none;

  @include olg {
    display: block;
  }
}
</style>
