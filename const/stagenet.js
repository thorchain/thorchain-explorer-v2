export const stagenetNav = {
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
        {
          name: 'Tokens',
          link: '/rujira/tokens',
        },
      ],
    },
  ],
}
