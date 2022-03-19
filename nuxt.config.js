export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'THORChain Network Explorer',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  loading: {
    color: '#63FDD9',
    height: '4px'
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@/assets/styles/main.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '@/plugins/vue-filters',
    '@/api/index.js'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: [
    {
      path: '~/components'
    },
    {
      path: '~/components/page_components',
      ignore: '*.vue'
    }
  ],

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxtjs/style-resources',
    '@nuxtjs/dotenv',
    "@nuxtjs/svg"
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    '@nuxtjs/apollo',
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: process.env.MIDGARD_BASE_URL,
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  },

  styleResources: {
    scss: [
      './assets/styles/_colors.scss',
      '@/assets/styles/_breakpoints.scss'
      ]
  },

  // Graphql appollo configure
  apollo: {
    clientConfigs: {
      default: {
        httpEndpoint: process.env.MIDGARD_BASE_URL,
      }
    }
  },

  env: {
    MIDGARD_BASE_URL: process.env.MIDGARD_BASE_URL,
    THORNODE_URL: process.env.THORNODE_URL,
  }
}
