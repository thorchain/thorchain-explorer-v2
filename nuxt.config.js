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
        name: 'viewport',
        content:
          'width=device-width, height=device-height,  initial-scale=1.0, user-scalable=no;user-scalable=0;',
      },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' },
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
    scss: ['./assets/styles/_colors.scss', '@/assets/styles/_breakpoints.scss'],
  },

  env: {
    NETWORK: process.env.NETWORK || 'mainnet',
  },
}
