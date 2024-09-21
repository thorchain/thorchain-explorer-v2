import Vue from 'vue'
import FloatingVue from 'floating-vue'

import 'floating-vue/dist/style.css'
import './../assets/styles/tooltip.scss'

Vue.use(FloatingVue, {
  themes: {
    tooltip: {
      placement: 'top',
      triggers: ['click', 'hover', 'touch', 'pointer'],
      distance: 8,
      autoHide: true,
    },
    menu: {
      placement: 'top',
      triggers: ['click', 'hover', 'touch', 'pointer'],
      distance: 8,
    },
  },
})
