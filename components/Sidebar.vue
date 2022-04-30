<template>
  <div class="side-bar-container" :class="{'mini': mini? true:false}">
      <img v-if="!mini" class="logo" src="@/assets/images/thorchain.png" alt="">
      <div class="side-bar-lists">
        <template v-for="(item, index) in sidebarLists" >
          <NuxtLink :to="item.link" :class="['side-bar-item']" :key="index">
            <component v-bind:is="item.icon" class="icon selected"></component>
            <component v-bind:is="item.unicon" class="icon unselected"></component>
            <span class="sidebar-text">{{item.name}}</span>
          </NuxtLink>
        </template>
      </div>
      <div class="social-items" v-show="!mini">
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
</template>

<script>
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

export default {
  name: 'SideBar',
  props: ['mini'],
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
    shieldUnselected
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
        }
      ]
    }
  }
}
</script>

<style lang="scss">
.side-bar-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &.mini {
    flex-direction: row;
    align-items: center;

    .logo {
      margin-bottom: 0;
    }

    .sidebar-text {
      display: none;
    }

    .side-bar-item {
      justify-content: center;
      .icon {
        margin: 0;
      }
    }

    .side-bar-lists {
      flex: 1;
      justify-content: space-around;
      flex-direction: row;
    }
  }

  .logo {
    border-radius: .3rem;
    width: 2rem;
    height: 2rem;
    margin-bottom: 2.25rem;
  }

  .side-bar-lists {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .side-bar-item {
    cursor: pointer;
    display: flex;
    background: transparent;
    border: none;
    width: 100%;
    padding: .7rem;
    text-align: left;
    border-radius: .5rem;
    color: var(--font-color);
    color: inherit;
    text-decoration: none;
    line-height: 1.25rem;

    &:hover {
      background-color: var(--bg-color);
      color: var(--sec-font-color);
    }

    &.nuxt-link-active {
      color: var(--sec-font-color);

      .icon.selected {
        display: block;
      }

      .icon.unselected {
        display: none;
      }
    }

    .icon {
      fill: var(--sec-font-color);
      margin-right: .5rem;
      height: 1.25rem;
      width: 1.25rem;

      &.selected {
        display: none;
      }

      &.unselected {
        fill: var(--font-color);
      }
    }
  }

  .social-items {
    margin-top: auto;
    display: flex;
    justify-content: space-around;
  }

  .social-icon {
    color: var(--font-color);
    cursor: pointer;
    width: 1.5rem;
    height: 1.5rem;

    &:hover {
      color: var(--sec-font-color);
    }
  }
}
</style>