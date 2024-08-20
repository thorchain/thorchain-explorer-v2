<template>
  <div class="navbar-container" :class="{ menu: menu }">
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
    <div class="navbar-lists">
      <template v-for="(item, index) in navbarLists">
        <NuxtLink
          v-if="item"
          :id="`navbar-${item.name}`"
          :key="index"
          :to="item.link"
          :class="['navbar-item']"
        >
          <div class="navbar-wrap">
            <span class="navbar-text">{{ item.name }}</span>
            <span v-if="item.submenu" class="dropdown-icon"></span>
          </div>
        </NuxtLink>
        <b-popover
          v-if="item.submenu"
          triggers="hover"
          :target="`navbar-${item.name}`"
          placement="bottom-start"
          custom-class="popover"
        >
          <div class="submenu">
            <NuxtLink
              v-for="(subItem, subIndex) in item.submenu"
              :key="subIndex"
              :to="subItem.link"
              class="submenu-item"
            >
              {{ subItem.name }}
            </NuxtLink>
          </div>
        </b-popover>
      </template>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import ThorchainLogo from '~/assets/images/thorchain-logo.svg?inline'
import XLogo from '~/assets/images/x.svg?inline'
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
  name: 'NavBar',
  components: {
    XLogo,
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
    Question,
  },
  data() {
    return {
      showExternalMenu: false,
      navbarLists: [
        {
          name: 'Overview',
          unicon: 'appsUnselected',
          icon: 'appsSelected',
          link: '/dashboard',
        },
        {
          name: 'Nodes',
          unicon: 'layersUnselected',
          icon: 'layersSelected',
          link: '/nodes',
        },
        {
          name: 'Network',
          unicon: 'vectorUnselected',
          icon: 'vectorSelected',
          link: '/network',
        },
        {
          name: 'Transactions',
          unicon: 'exchangeUnselected',
          icon: 'exchangeSelected',
          link: '/transactions',
        },
        {
          name: 'Pools',
          unicon: 'swimmerUnselected',
          icon: 'swimmerSelected',
          link: '/pools',
        },
        {
          name: 'THORFi',
          unicon: 'financeUnselected',
          icon: 'financeSelected',
          link: '/thorfi',
          submenu: [
            {
              name: 'Savers',
              link: '/thorfi/savers',
            },
            {
              name: 'Synths',
              link: '/thorfi/synths',
            },
            {
              name: 'Trade Assets',
              link: '/thorfi/trades',
            },
            {
              name: 'Rune Pool',
              link: '/thorfi/runepool',
            },
            {
              name: 'Lending',
              link: '/thorfi/lending',
            },
          ],
        },
        {
          name: 'Vaults',
          unicon: 'shieldUnselected',
          icon: 'shieldSelected',
          link: '/vaults',
        },
        process.env.NETWORK === 'mainnet'
          ? {
              name: 'Insights',
              unicon: 'chartUnselected',
              icon: 'chartSelected',
              link: '/insights',
            }
          : false,
      ],
    }
  },
  computed: {
    ...mapGetters({
      menu: 'getIsMenuOn',
    }),
  },
  methods: {
    ...mapMutations(['toggleMenu']),
    handleResize() {
      if (window.innerWidth > 900 && this.menu) {
        this.toggleMenu()
      }
    },
  },
  mounted() {
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
}
</script>

<style lang="scss" scoped>
.navbar-container {
  padding: 0.25rem 0;
  transition: height 0.3s;
  max-width: 90rem;
  margin: auto;
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .logo-wrapper {
      display: flex;
      align-items: center;
      font-family: 'Exo 2';
      font-size: 0.875rem;

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

  @include lg {
    display: flex;
    justify-content: space-between;

    .dropdown-icon {
      position: relative;
      display: inline-block;
      margin-left: 0.5rem;

      &::after {
        content: '';
        border: solid var(--sec-font-color);
        border-width: 0 2px 2px 0;
        display: inline-block;
        padding: 2.8px;
        transform: rotate(45deg);
        vertical-align: middle;
        margin-bottom: 6px;
        transition: border-color 0.3s;
      }
    }
  }

  &.menu .navbar-lists {
    padding: 12px 0;
  }

  .navbar-lists {
    overflow: hidden;
    max-height: 0;
    transition:
      all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1),
      opacity 1s ease;

    @include lg {
      display: flex;
      flex-direction: row;
      -ms-overflow-style: none;
      scrollbar-width: none;
      justify-content: flex-end;
      margin: 0;
      max-height: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .navbar-item {
      display: flex;
      align-items: center;
      text-decoration: none;
      border-radius: 30px;
      position: relative;
      padding-top: 0.2rem;

      &:hover {
        span,
        .dropdown-icon::after {
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
      }

      &.nuxt-link-active {
        span {
          color: var(--primary-color);
          font-weight: bold;
        }

        .dropdown-icon::after {
          border-color: var(--primary-color);
        }
      }

      &:last-of-type {
        padding-right: 0;
      }

      span {
        font-size: 14px;
        height: 20px;
        line-height: 20px;
        color: var(--sec-font-color);
        font-family: 'Exo 2';
        transition: color 0.3s;
      }

      .navbar-wrap {
        display: flex;
        align-items: center;
        padding: 5px 0;
        border-radius: 30px;
      }

      @include lg {
        padding: 0.2rem 1rem;

        span {
          font-size: 14px;
        }

        .icon {
          width: 20px;
        }
      }
    }
  }

  .menu-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    @include lg {
      display: none;
    }
  }

  .icon {
    margin: 0;
    width: 20px;
    background-color: var(--card-bg-color);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.375rem 0.75rem;
    box-sizing: content-box;
  }

  &.menu {
    .navbar-lists {
      display: flex;
      flex-direction: column;
      max-height: 500px;
    }
  }
}
</style>
