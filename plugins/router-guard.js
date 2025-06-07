import { mainnetNav } from '~/const/mainnet'
import { stagenetNav } from '~/const/stagenet'

export default function ({ app }) {
  const ENV = process.env.NETWORK || 'mainnet'

  const nav = (ENV === 'mainnet' ? mainnetNav : stagenetNav).navbarLists

  const allowedRoutes = nav.flatMap((item) => {
    const routes = [item.link]
    if (item.submenu) {
      routes.push(...item.submenu.map((sub) => sub.link))
    }
    return routes
  })

  app.router.beforeEach((to, from, next) => {
    if (allowedRoutes.includes(to.path) || to.path === '/404') {
      next()
    } else {
      next('/404')
    }
  })
}
