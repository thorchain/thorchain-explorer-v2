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
          @click.native="closeAllSubmenus"
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
          @click.stop="toggleSubmenu(index)"
        >
          <div class="navbar-wrap">
            <span class="navbar-text">{{ item.name }}</span>
            <span
              class="dropdown-icon"
              :class="{ rotated: openSubmenus[index] }"
            ></span>
          </div>
          <div
            :id="`submenu-${index}`"
            class="submenu"
            :class="{ open: openSubmenus[index] }"
            @click.stop
          >
            <NuxtLink
              v-for="(subItem, subIndex) in item.submenu.filter(
                (it) => it.link
              )"
              :key="subIndex"
              :to="subItem.link"
              class="submenu-item"
              :class="{ active: isActive(subItem) }"
              @click.native="closeAllSubmenus"
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
      <div
        v-if="menu"
        class="navbar-item dropdown-wrapper"
        @click.stop="toggleDropdown"
      >
        <div class="navbar-wrap">
          <span class="navbar-text">Appearance & Network</span>
          <span
            class="dropdown-icon"
            :class="{ rotated: isDropdownOpen }"
          ></span>
        </div>
        <div class="dropdown-menu" :class="{ open: isDropdownOpen }">
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
            {
              name: 'Pendulum',
              link: '/network/pendulum',
            },
            {
              name: 'Outbound Fees',
              link: '/network/outbounds',
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
              name: 'TOP Swaps',
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
              name: 'TCY',
              link: '/thorfi/tcy',
            },
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
        {
          name: 'Rujira',
          unicon: 'chartUnselected',
          icon: 'chartSelected',
          link: '/rujira',
          submenu: [
            {
              name: 'Secured Assets',
              link: '/rujira/secured',
            },
            {
              name: 'Contracts',
              link: '/rujira/contracts',
            },
            process.env.NETWORK === 'mainnet'
              ? {
                  name: 'Merge',
                  link: '/rujira/merge',
                }
              : false,
            {
              name: 'Tokens',
              link: '/rujira/tokens',
            },
          ],
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
  mounted() {
    window.addEventListener('resize', this.handleResize)
    document.addEventListener('click', this.handleDocumentClick)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    document.removeEventListener('click', this.handleDocumentClick)
  },
  methods: {
    ...mapMutations(['toggleMenu']),
    handleResize() {
      if (window.innerWidth > 900 && this.menu) {
        this.toggleMenu()
      }
      this.isMobile = window.innerWidth <= 990
    },
    closeMenu() {
      this.toggleMenu()
      this.closeAllSubmenus()
    },
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen
      Object.keys(this.openSubmenus).forEach((key) => {
        this.$set(this.openSubmenus, key, false)
      })
    },
    toggleSubmenu(index) {
      Object.keys(this.openSubmenus).forEach((key) => {
        if (key !== index.toString()) {
          this.$set(this.openSubmenus, key, false)
        }
      })

      this.$set(this.openSubmenus, index, !this.openSubmenus[index])

      if (this.openSubmenus[index]) {
        this.isDropdownOpen = false
      }
    },
    closeAllSubmenus() {
      Object.keys(this.openSubmenus).forEach((key) => {
        this.$set(this.openSubmenus, key, false)
      })
      this.isDropdownOpen = false
      if (this.isMobile && this.menu) {
        this.toggleMenu()
      }
    },
    handleDocumentClick(event) {
      if (!this.$el.contains(event.target)) {
        this.closeAllSubmenus()
      }
    },
    isActive(item) {
      return (
        this.$route.path === item.link ||
        (item.submenu &&
          item.submenu.some((subItem) => this.$route.path === subItem.link))
      )
    },
    setTheme(theme) {
      if (theme === 'BlueElectra') {
        this.$store.commit('setTheme', 'BlueElectra')
      } else {
        this.$store.commit('setTheme', theme === 'dark')
      }
      this.isDropdownOpen = false
    },
    gotoInstance(instance, disabled) {
      if (disabled) return
      return links[instance]
    },
  },
}
</script>

<style lang="scss" scoped>
.navbar-container {
  padding: $space-4 $space-0;
  transition: height 0.3s;
  max-width: 90rem;
  margin: auto;
  position: relative;

  .logo-link {
    color: var(--font-color);
    text-decoration: none;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .logo-wrapper {
      display: flex;
      align-items: center;
      font-family: 'Exo 2';
      font-size: $font-size-sm;

      .logo {
        width: 1.5rem;
      }

      @include lg {
        font-size: $font-size-desktop;

        .logo {
          width: 1.75rem;
        }
      }
    }
  }

  .dropdown-icon {
    position: relative;
    display: inline-block;
    margin-left: $space-8;
    transition: transform 0.3s ease;

    &::after {
      content: '';
      border: solid var(--sec-font-color);
      border-width: 0 2px 2px 0;
      display: inline-block;
      padding: $space-3;
      transform: rotate(45deg);
      vertical-align: middle;
      margin-bottom: $space-5;
      transition: border-color 0.3s;
    }

    &.rotated::after {
      transform: rotate(-135deg);
      margin-bottom: $space-2;
    }
  }

  @include lg {
    display: flex;
    justify-content: space-between;

    .dropdown-icon {
      position: relative;
      display: inline-block;
      margin-left: $space-8;

      &::after {
        content: '';
        border: solid var(--sec-font-color);
        border-width: 0 2px 2px 0;
        display: inline-block;
        padding: $space-2;
        transform: rotate(45deg);
        vertical-align: middle;
        margin-bottom: $space-5;
        transition: border-color 0.3s;
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

    .icon {
      margin: $space-0;
      width: 20px;
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      border-radius: $radius-lg;
      padding: $space-5 $space-12;
      box-sizing: content-box;
    }
  }

  .navbar-lists {
    overflow: hidden;
    max-height: 0;
    transition:
      all 0.7s cubic-bezier(0.25, 0.1, 0.25, 1),
      opacity 1s ease;
    gap: 0.25rem;

    @include lg {
      display: flex;
      flex-direction: row;
      -ms-overflow-style: none;
      scrollbar-width: none;
      justify-content: flex-end;
      margin: $space-0;
      max-height: none;
      overflow: visible !important;

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
        padding-right: $space-0;
      }

      span {
        font-size: $font-size-sm;
        height: 20px;
        line-height: 20px;
        color: var(--sec-font-color);
        font-family: 'Exo 2';
        transition: color 0.3s;
      }

      .navbar-wrap {
        display: flex;
        align-items: center;
        padding: $space-5 $space-0;
        border-radius: 30px;
        justify-content: space-between;
        cursor: pointer;
      }

      @include lg {
        padding: $space-3 $space-16;

        span {
          font-size: $font-size-sm;
        }

        .icon {
          width: 20px;
        }
      }
    }

    .dropdown-wrapper {
      position: relative;
    }

    .dropdown-menu {
      width: 100%;
      border: none;
      box-shadow: none;
      padding: $space-0;
      background: var(--card-bg-color);
      border-radius: $radius-lg;
      overflow: hidden;
      max-height: 0;
      transition: max-height 0.3s ease;
      margin-top: $space-8;

      &.open {
        max-height: 500px;
        border: 1px solid var(--border-color);
      }

      .settings-container {
        padding: $space-8;
        font-size: $font-size-s;
      }

      .settings-option {
        display: flex;
        align-items: center;
        padding: $space-10;
        margin: $space-0;
        color: var(--sec-font-color);
        cursor: pointer;

        &:hover {
          color: var(--primary-color);
          background: var(--darker-bg);
          border-radius: $radius-s;
        }

        &.active {
          color: var(--primary-color);
        }

        a {
          display: flex;
          align-items: center;
          width: 100%;
          color: inherit;
          text-decoration: none;

          &.active {
            color: var(--primary-color);
          }
        }

        .menu-icon {
          margin-right: $space-8;
          fill: currentColor;
        }
      }

      .line {
        height: 0.5px;
        background-color: var(--border-color);
        margin: $space-8;
      }
    }
  }

  .submenu {
    display: none;
    flex-direction: column;
    transition: height 0.3s ease;
    overflow: hidden;
    border: 1px solid var(--border-color);
    border-radius: $radius-lg;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    padding: $space-5;
    z-index: 1000;
    margin-top: $space-8;
    max-height: 0;
    opacity: 0;
    transition: max-height 0.3s ease;

    &.open {
      display: flex;
      max-height: 500px;
      opacity: 1;
      transition:
        max-height 0.3s ease,
        opacity 0.2s ease 0.1s;
    }

    .submenu-item {
      font-size: 13px;
      padding: $space-10;
      text-decoration: none;
      color: var(--sec-font-color);

      &:hover {
        color: var(--primary-color);
        cursor: pointer;
        transition: background-color 0.3s ease;
        background: var(--darker-bg);
        border-radius: $radius-s;
      }

      &.active {
        color: var(--primary-color);
      }
    }
  }

  &.menu {
    .navbar-lists {
      display: flex;
      flex-direction: column;
      max-height: none;
      overflow: visible;
      padding: $space-12 $space-0;
      gap: 0.25rem !important;
    }
  }
}
</style>
