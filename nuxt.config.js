export default {
  ssr: false,

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'THORChain Network Explorer',
    htmlAttrs: {
      lang: 'en',
    },
    meta: [
      { charset: 'utf-8' },
      {
        hid: 'og:title',
        property: 'og:title',
        content: 'THORChain Network Explorer',
      },
      {
        name: 'viewport',
        content:
          'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no;user-scalable=0;',
      },
      {
        hid: 'description',
        name: 'description',
        content:
          'Explore the THORChain network with its interactive charts, detailed tracking, and comprehensive data, ensuring you stay informed about all aspects of THORChain.',
      },
      { name: 'format-detection', content: 'telephone=no' },
      {
        property: 'og:site_name',
        content: 'THORChain Explorer',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:image',
        content: '/meta-card.png',
      },
      {
        hid: 'twitter:title',
        name: 'twitter:title',
        content:
          'Explore the THORChain network with its interactive charts, detailed tracking, and comprehensive data, ensuring you stay informed about all aspects of THORChain.',
      },
      {
        hid: 'twitter:description',
        name: 'twitter:description',
        content:
          'Explore the THORChain network with its interactive charts, detailed tracking, and comprehensive data, ensuring you stay informed about all aspects of THORChain.',
      },
      {
        hid: 'twitter:site',
        name: 'twitter:site',
        content: 'thorchain.net',
      },
      {
        hid: 'twitter:image',
        name: 'twitter:image',
        content: '/meta-card.png',
      },
      {
        hid: 'twitter:card',
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    ],
    link: [{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }],
  },
  loading: {
    color: 'var(--primary-color)',
    height: '4px',
  },

  router: {
    extendRoutes(routes, resolve) {
      routes.push(
        {
          path: '/pools/savers',
          redirect: '/thorfi/savers',
        },
        {
          path: '/assets',
          redirect: '/thorfi/synths',
        }
      )
    },
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['@/assets/styles/main.scss'],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '@/plugins/bootstrap.js',
    '@/plugins/datepicker.js',
    '@/plugins/vue-filters',
    '@/plugins/floating-vue',
    '@/plugins/vgt',
    '@/api/index.js',
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: [
    {
      path: '~/components',
    },
    {
      path: '~/components/layouts',
    },
    {
      path: '~/components/page_components',
      ignore: '*.vue',
    },
  ],

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxtjs/style-resources',
    '@nuxtjs/dotenv',
    '@nuxtjs/svg',
    '@nuxtjs/composition-api/module',
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
  ],

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: [/echarts/, /zrender/],
  },

  styleResources: {
    scss: [
      './assets/styles/_colors.scss',
      '@/assets/styles/_breakpoints.scss',
      '@/assets/styles/variables.scss',
    ],
  },

  env: {
    NETWORK: process.env.NETWORK || 'mainnet',
  },
}
