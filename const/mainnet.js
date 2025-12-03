export const mainnetNav = {
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
        {
          name: 'Holders',
          link: '/holders',
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
        {
          name: 'Pool Earnings',
          link: '/pools/earnings',
        },
        {
          name: 'TVL by Chain',
          link: '/pools/tvl',
        },
        {
          name: 'Rune Pool',
          link: '/pools/runepool',
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
          name: 'RUJI',
          link: '/rujira/ruji',
        },
        {
          name: 'Secured Assets',
          link: '/rujira/secured',
        },
        {
          name: 'Contracts',
          link: '/rujira/contracts',
        },
        {
          name: 'Merge',
          link: '/rujira/merge',
        },
        {
          name: 'Tokens',
          link: '/rujira/tokens',
        },
      ],
    },
    {
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
          name: 'Affiliates',
          link: '/charts/affiliates',
        },
        {
          name: 'Burn',
          link: '/insights/burn',
        },
        {
          name: 'Earnings',
          link: '/charts/earnings',
        },
        {
          name: 'Execution Quality',
          link: '/insights/execution',
        },
      ],
    },
  ],
}
export const dynamicLinks = {
  txLink: {
    basePath: '/tx/',
  },
  addressLink: {
    basePath: '/address/',
  },
  stakersLink: {
    basePath: '/stakers',
  },
  chartsLink: {
    basePath: '/charts/',
  },
  blockLink: {
    basePath: '/block/',
  },
  poolLink: {
    basePath: '/pool/',
  },
  nodeLink: {
    basePath: '/node/',
  },
}
