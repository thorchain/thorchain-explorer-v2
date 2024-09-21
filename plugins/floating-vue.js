import Vue from 'vue'
import FloatingVue from 'floating-vue'

import 'floating-vue/dist/style.css'
import './../assets/styles/tooltip.scss'

Vue.use(FloatingVue, {
  themes: {
    tooltip: {
      placement: 'top',
      distance: 8,
      autoHide: true,
    },
    menu: {
      $extend: 'tooltip',
      triggers: ['click', 'hover', 'touch', 'pointer'],
      delay: {
        show: 0,
        hide: 0,
      },
    },
    dropdown: {
      $extend: 'menu',
    },
  },
})
