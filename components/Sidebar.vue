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
          @click.native="toggleMenu(false)"
        >
          <div class="navbar-wrap">
            <span class="navbar-text">{{ item.name }}</span>
          </div>
        </NuxtLink>
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
  },
}
</script>

<style lang="scss">
.navbar-container {
  display: grid;
  grid-template-rows: 64px 1fr auto;
  min-height: 64px;

  @include lg {
    grid-template-columns: auto 1fr;
    grid-template-rows: 64px 1fr;
    grid-template-areas: 'header' 'navbar';
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    min-height: 64px;
    border-bottom: 1px solid var(--border-color);

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

    @include lg {
      grid-area: header;
      margin-bottom: 25px;
    }
  }

  .navbar-lists {
    margin-top: 20px;
    display: none;

    @include lg {
      display: flex;
      flex-direction: row;
      -ms-overflow-style: none;
      scrollbar-width: none;
      margin: 1rem;
      justify-content: flex-end;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .navbar-item {
      display: flex;
      align-items: center;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 30px;
      position: relative;
      justify-content: center;

      &:hover {
        background-color: var(--darker-bg);
        transform: translateY(-2px);
      }

      &.nuxt-link-active {
        span {
          color: var(--primary-color);
          font-weight: bold;
        }
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
        padding: 5px 20px;
        border-radius: 30px;

        &:hover {
          background: var(--darker-bg);
        }
      }

      @include lg {
        padding: 4px 0;

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
    align-items: center;
    cursor: pointer;

    @include lg {
      display: none;
    }
  }

  .icon {
    width: 1.5rem;
  }

  &.menu {
    .header {
      margin-bottom: 25px;
    }

    .navbar-lists {
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
