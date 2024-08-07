import Vue from 'vue'
import FloatingVue from 'floating-vue'

import 'floating-vue/dist/style.css'

Vue.use(FloatingVue, {
  themes: { tooltip: { triggers: ['hover', 'focus', 'touch', 'click'] } },
})
