import { mainnetNav, dynamicLinks } from '~/const/mainnet'
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

  const dynamicBasePaths = Object.values(dynamicLinks)
    .filter((link) => !!link.basePath)
    .map((link) => link.basePath)

  app.router.beforeEach((to, from, next) => {
    if (to.path === '/') {
      return next()
    }

    const isAllowedStatic = allowedRoutes.includes(to.path)
    const isAllowedDynamic = dynamicBasePaths.some((base) =>
      to.path.startsWith(base)
    )

    if (isAllowedStatic || isAllowedDynamic || to.path === '/404') {
      next()
    } else {
      next('/404')
    }
  })
}
