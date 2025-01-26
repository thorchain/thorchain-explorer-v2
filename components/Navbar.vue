<template>
  <div class="navbar-container" :class="{ menu: menu }">
    <div class="header">
      <nuxt-link to="/dashboard" class="logo-link">
        <div class="logo-wrapper">
          <ThorchainLogo class="logo" />
          <div class="thorchain-name">
            <strong>THORChain</strong>
            Explorer
          </div>
        </div>
      </nuxt-link>

      <div class="menu-wrapper" @click="toggleMenu()">
        <MenuIcon v-if="!menu" class="icon" />
        <CrossIcon v-else class="icon" />
      </div>
    </div>
    <div class="navbar-lists">
      <template v-for="(item, index) in navbarLists">
        <NuxtLink
          v-if="item && !(item.submenu && isMobile) && item.link"
          :id="`navbar-${item.name}`"
          :key="index"
          :to="item.link"
          class="navbar-item"
        >
          <div class="navbar-wrap">
            <span class="navbar-text">{{ item.name }}</span>
            <span v-if="item.submenu" class="dropdown-icon"></span>
          </div>
        </NuxtLink>
        <div
          v-if="item.submenu && isMobile"
          :id="`menu-item-${index}`"
          :key="`item-${index}`"
          :class="['navbar-item', { active: $route.path.includes(item.link) }]"
          @click="toggleSubmenu(index)"
        >
          <div class="navbar-wrap">
            <span class="navbar-text">{{ item.name }}</span>
            <span class="dropdown-icon"></span>
          </div>
          <div :id="`submenu-${index}`" class="submenu">
            <NuxtLink
              v-for="(subItem, subIndex) in item.submenu.filter(
                (it) => it.link
              )"
              :key="subIndex"
              :to="subItem.link"
              class="submenu-item"
              :class="{ active: isActive(subItem) }"
            >
              {{ subItem.name }}
            </NuxtLink>
          </div>
        </div>
        <b-popover
          v-if="item.submenu && !isMobile"
          :key="`popover-menu-${index}`"
          triggers="hover"
          :target="`navbar-${item.name}`"
          placement="bottom"
          :custom-class="`nav-popover ${item.name === 'Insights' ? 'last-nav-popover' : ''}`"
        >
          <div class="submenu">
            <NuxtLink
              v-for="(subItem, subIndex) in item.submenu.filter(
                (it) => it.link
              )"
              :key="subIndex"
              :to="subItem.link"
              class="submenu-item"
            >
              {{ subItem.name }}
            </NuxtLink>
          </div>
        </b-popover>
      </template>
      <div v-if="menu" class="navbar-item" @click="toggleDropdown">
        <div class="navbar-wrap">
          <span class="navbar-text">Appearance & Network</span>
          <span class="dropdown-icon"></span>
        </div>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <div id="theme-wrapper" class="dropdown-item">
            <div class="settings-container">
              <div
                :class="['settings-option', { active: theme === 'dark' }]"
                @click="setTheme('dark')"
              >
                <MoonIcon class="menu-icon" />
                <div>Dark</div>
              </div>
              <div
                :class="['settings-option', { active: theme === 'light' }]"
                @click="setTheme('light')"
              >
                <SunIcon class="menu-icon" />
                <div>Light</div>
              </div>
              <div
                :class="[
                  'settings-option',
                  { active: theme === 'BlueElectra' },
                ]"
                @click="setTheme('BlueElectra')"
              >
                <BlueElectra class="menu-icon" />
                <div>BlueElectra</div>
              </div>
            </div>
            <div class="line"></div>
            <div class="settings-container">
              <div class="settings-option">
                <a
                  :class="{
                    active: networkEnv === 'mainnet',
                  }"
                  :href="gotoInstance('mainnet', networkEnv === 'mainnet')"
                >
                  Mainnet
                </a>
              </div>
              <div class="settings-option">
                <a
                  :class="{
                    active: networkEnv === 'stagenet',
                  }"
                  :href="gotoInstance('stagenet', networkEnv === 'stagenet')"
                >
                  Stagenet
                </a>
              </div>
              <div class="settings-option">
                <a
                  :class="{
                    active: networkEnv === 'devnet',
                  }"
                  :href="gotoInstance('devnet', networkEnv === 'devnet')"
                >
                  Devnet
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapGetters } from 'vuex'
import ThorchainLogo from '~/assets/images/thorchain-logo.svg?inline'
import BlueElectra from '~/assets/images/blueelectra.svg?inline'
import MenuIcon from '~/assets/images/menu-burger.svg?inline'
import CrossIcon from '~/assets/images/cross.svg?inline'
import MoonIcon from '~/assets/images/moon-icon.svg?inline'
import SunIcon from '~/assets/images/sun-icon.svg?inline'
import links from '~/const/links'

export default {
  name: 'NavBar',
  components: {
    ThorchainLogo,
    MenuIcon,
    CrossIcon,
    SunIcon,
    MoonIcon,
    BlueElectra,
  },
  data() {
    return {
      isThorfiDropdownOpen: false,
      isMobile: window.innerWidth <= 990,
      openSubmenus: {},
      showExternalMenu: false,
      showSettings: false,
      isDropdownOpen: false,

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
          submenu: [
            {
              name: 'Overview',
              link: '/network',
            },
            {
              name: 'Constants',
              link: '/network/settings',
            },
            {
              name: 'Votes',
              link: '/network/votes',
            },
            {
              name: 'Churn',
              link: '/network/churn',
            },
          ],
        },
        {
          name: 'Transactions',
          unicon: 'exchangeUnselected',
          icon: 'exchangeSelected',
          link: '/txs',
          submenu: [
            {
              name: 'Transactions',
              link: '/txs',
            },
            {
              name: 'Swap',
              link: '/swaps',
            },
          ],
        },
        {
          name: 'Pools',
          unicon: 'swimmerUnselected',
          icon: 'swimmerSelected',
          link: '/pools',
          submenu: [
            {
              name: 'Pools',
              link: '/pools/main',
            },
            process.env.NETWORK === 'mainnet'
              ? {
                  name: 'Pool Earnings',
                  link: '/pools/earnings',
                }
              : false,
            {
              name: 'TVL by Chain',
              link: '/pools/tvl',
            },
          ],
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
              name: 'Secured Assets',
              link: '/thorfi/secured',
            },
            {
              name: 'Synths',
              link: '/thorfi/synths',
            },
            {
              name: 'Trade Assets',
              link: '/thorfi/trades',
            },
            process.env.NETWORK === 'mainnet'
              ? {
                  name: 'Rune Pool',
                  link: '/thorfi/runepool',
                }
              : false,
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
              submenu: [
                {
                  name: 'Overview',
                  link: '/insights/main',
                },
                {
                  name: 'Leaderboard',
                  link: '/insights/leaderboard',
                },
                {
                  name: 'Burn',
                  link: '/insights/burn',
                },
                {
                  name: 'Execution Quality',
                  link: '/insights/execution',
                },
              ],
            }
          : false,
      ],
    }
  },
  computed: {
    ...mapGetters({
      menu: 'getIsMenuOn',
      theme: 'getTheme',
    }),
    theme() {
      return this.$store.getters.getTheme
    },
    networkEnv() {
      return process.env.NETWORK
    },
  },
  methods: {
    ...mapMutations(['toggleMenu']),
    handleResize() {
      if (window.innerWidth > 900 && this.menu) {
        this.toggleMenu()
      }
      this.isMobile = window.innerWidth <= 990
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
      const navbarLists = this.$el.querySelector('.navbar-lists')
      navbarLists.style.height = this.isDropdownOpen ? '460px' : 'auto'
    },

    toggleSubmenu(index) {
      this.$set(this.openSubmenus, index, !this.openSubmenus[index])
      this.$nextTick(() => {
        const submenu = this.$el.querySelector(`#submenu-${index}`)
        if (submenu) {
          submenu.classList.toggle('open', this.openSubmenus[index])
        }
      })
    },
    isActive(item) {
      return (
        this.$route.path === item.link ||
        (item.submenu &&
          item.submenu.some((subItem) => this.$route.path === subItem.link))
      )
    },
    isSubmenuOpen(index) {
      return !!this.openSubmenus[index]
    },
    setTheme(theme) {
      if (theme === 'BlueElectra') {
        this.$store.commit('setTheme', 'BlueElectra')
      } else {
        this.$store.commit('setTheme', theme === 'dark')
      }
    },
    gotoInstance(instance, disabled) {
      if (disabled) return
      return links[instance]
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
  .logo-link {
    color: var(--font-color);
    text-decoration: none;
  }
  .submenu {
    display: none;
    flex-direction: column;
    transition: height 0.3s ease;
    overflow: hidden;
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: 0.3rem;
    z-index: 1000;
    transform: translateY(0);
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
    margin-top: 0.5rem;
    max-width: 56rem;
    .submenu-item {
      font-size: 14px;
      padding: 10px;
      text-decoration: none;
      &:hover {
        color: var(--primary-color);
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      &.active {
        color: var(--primary-color);
      }
    }
  }
  .submenu.open {
    display: flex;
  }
  .navbar-lists::-webkit-scrollbar,
  .submenu::-webkit-scrollbar {
    width: 5px;
  }

  .navbar-lists::-webkit-scrollbar-track,
  .submenu::-webkit-scrollbar-track {
    background-color: var(--border-color);
  }

  .navbar-lists::-webkit-scrollbar-thumb,
  .submenu::-webkit-scrollbar-thumb {
    background-color: var(--font-color);
    border-radius: 5px;
  }

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
      align-items: center;
      text-decoration: none;
      border-radius: 30px;
      position: relative;

      &:hover {
        span,
        .dropdown-icon::after {
          color: var(--primary-color);
          border-color: var(--primary-color);
        }
      }

      &.active {
        span {
          color: var(--primary-color);

          &::after {
            border-color: var(--primary-color);
          }
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
      overflow: auto;
    }

    .navbar-text {
      cursor: pointer;
      &.active,
      &.nuxt-link-exact-active,
      &.nuxt-link-active {
        border-radius: 0.3rem;
        color: var(--primary-color);
        margin-bottom: 5px;
      }

      &:hover {
        border-radius: 0.3rem;
        color: var(--primary-color);
      }
    }

    .network-dialog,
    .theme-dialog {
      position: absolute;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
      width: 100px;
      background: var(--card-bg-color);

      a {
        cursor: pointer;
        background: var(--card-bg-color);
        color: var(--font-color);
        border: none;
        padding: 0.5rem 1rem;
        text-decoration: none;
        text-align: center;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background-color 0.3s ease;

        &:first-of-type {
          border-radius: 0.5rem 0.5rem 0 0;
        }

        &:last-of-type {
          border-radius: 0 0 0.5rem 0.5rem;
        }

        &:hover {
          background: var(--darker-bg);
          color: var(--primary-color);
        }

        &.active {
          color: var(--primary-color);

          &:hover {
            background-color: var(--card-bg-color);
          }
        }
      }
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      border: 1px solid var(--border-color);
      width: 100%;
      max-width: 100%;
      border-radius: 0.5rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      padding: 0.3rem;
      z-index: 1000;
      transform: translateY(0);
      transition:
        opacity 0.3s ease,
        transform 0.3s ease;
      display: flex;
      flex-direction: column;
      margin-top: 0.5rem;

      .settings-option {
        display: flex;
        align-items: center;
        font-size: 13px;
        color: var(--sec-font-color);
        text-decoration: none;
        padding: 5px;
        margin: 5px;

        &:hover {
          color: var(--primary-color);
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        &.active {
          color: var(--primary-color);
        }

        a {
          text-decoration: none;

          &.active {
            color: var(--primary-color);
          }
        }

        .menu-icon {
          fill: currentColor;
          margin-right: 8px;
        }
      }

      .line {
        height: 0.5px;
        background-color: var(--border-color);
        margin: 10px 0;
        width: 100%;
      }

      .network-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        padding: 5px;
        margin: 5px;
      }

      .icon-label-container {
        display: flex;
        align-items: center;
      }

      .network-label-group {
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: var(--sec-font-color);
        margin-left: 10px;
      }

      .network-label-group a {
        text-decoration: none;
        color: var(--sec-font-color);
        margin-bottom: 8px;
        font-size: 13px;

        &:hover {
          color: var(--primary-color);
          transition: background-color 0.3s ease;
        }
      }
    }
  }
}
</style>
