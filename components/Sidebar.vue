<template>
  <div class="side-bar-container" :class="{'menu': menu}">
    <div class="upper-wrapper">
      <div class="header">
        <div class="logo-wrapper">
          <ThorchainLogo class="logo" />
          <div>
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
        <template v-for="(item, index) in sidebarLists" >
          <NuxtLink :to="item.link" :class="['side-bar-item']" :key="index" v-on:click.native="toggleMenu(false)">
            <component v-bind:is="item.icon" class="icon selected"></component>
            <component v-bind:is="item.unicon" class="icon unselected"></component>
            <span class="sidebar-text">{{item.name}}</span>
          </NuxtLink>
        </template>
      </div>
    </div>
    <div class="footer-wrapper">
      <div class="social-items">
        <a href="https://twitter.com/THORChain">
          <TwitterLogo class="social-icon" />
        </a>
        <a href="https://discord.gg/KjPVnGy5jR">
          <DiscordLogo class="social-icon" />
        </a>
        <a href="https://github.com/thorchain/thorchain-explorer-v2">
          <GithubLogo class="social-icon" />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import ThorchainLogo from '~/assets/images/thorchain-logo.svg?inline';

import TwitterLogo from '~/assets/images/twitter-brands.svg?inline';
import DiscordLogo from '~/assets/images/discord-brands.svg?inline';
import GithubLogo from '~/assets/images/github-brands.svg?inline';

import appsSelected from '~/assets/images/apps-selected.svg?inline';
import appsUnselected from '~/assets/images/apps-unselected.svg?inline';

import vectorSelected from '~/assets/images/vector-selected.svg?inline';
import vectorUnselected from '~/assets/images/vector-unselected.svg?inline';

import layersSelected from '~/assets/images/layers-selected.svg?inline';
import layersUnselected from '~/assets/images/layers-unselected.svg?inline';

import exchangeSelected from '~/assets/images/exchange-selected.svg?inline';
import exchangeUnselected from '~/assets/images/exchange-unselected.svg?inline';

import swimmerSelected from '~/assets/images/swimmer-selected.svg?inline';
import swimmerUnselected from '~/assets/images/swimmer-unselected.svg?inline';

import moneySelected from '~/assets/images/money-selected.svg?inline';
import moneyUnselected from '~/assets/images/money.svg?inline';

import shieldSelected from '~/assets/images/shield.svg?inline';
import shieldUnselected from '~/assets/images/shield-unselected.svg?inline';

import chartSelected from '~/assets/images/chart-selected.svg?inline';
import chartUnselected from '~/assets/images/chart-unselected.svg?inline';

import MenuIcon from '~/assets/images/menu-burger.svg?inline';
import CrossIcon from '~/assets/images/cross.svg?inline';
import { mapMutations, mapGetters } from 'vuex';

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
    moneySelected,
    moneyUnselected,
    shieldSelected,
    shieldUnselected,
    ThorchainLogo,
    MenuIcon,
    CrossIcon,
    chartSelected,
    chartUnselected
  },
  data() {
    return {
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
          name: 'Assets',
          unicon: 'moneyUnselected',
          icon: 'moneySelected',
          link: '/assets'
        },
        {
          name: 'Vaults',
          unicon: 'shieldUnselected',
          icon: 'shieldSelected',
          link: '/vaults'
        },
        {
          name: 'Insights',
          unicon: 'chartUnselected',
          icon: 'chartSelected',
          link: '/insights'
        }
      ]
    }
  },
  methods: {
    ...mapMutations([
      'toggleMenu'
    ])
  },
  computed: {
    ...mapGetters({
      menu: 'getIsMenuOn'
    })
  }
}
</script>

<style lang="scss">
.side-bar-container {
  display: grid;
  grid-template-rows: 1fr auto;
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

      .social-items {
        display: flex;
        gap: 10px;
        width: 100%;
        padding: 10px;
        border-top: 1px solid var(--border-color);

        a {
          color: var(--font-color);
          text-decoration: none;

          .social-icon {
            fill: inherit;
            widows: 1.2rem;
            height: 1.2rem;
          }

          &:hover {
            color: var(--border-color);

            .social-icon {
              fill: var(--border-color);
            }
          }
        }
      }
    }
  
  .side-bar-lists {
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
        font-size: 2.25rem;
        color: var(--sec-font-color);
        font-family: 'Exo 2';
      }

      @include lg {
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
    .header {
      margin-bottom: 25px;
    }

    .side-bar-lists {
      display: flex;
      flex-direction: column;

      .side-bar-item {
        padding: 14px 20px;

        span {
          font-size: 14px;
        }

        .icon {
          width: 20px;
        }
      }
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
}
</style>
