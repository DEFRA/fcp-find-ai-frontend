const homeRoutes = require('../../../app/routes/home')
const healthyRoutes = require('../../../app/routes/healthy')
const healthzRoutes = require('../../../app/routes/healthz')
const staticRoutes = require('../../../app/routes/static')

const router = require('../../../app/plugins/router')

jest.mock('../../../app/routes/home', () => [{ path: '/home' }])
jest.mock('../../../app/routes/healthy', () => [{ path: '/healthy' }])
jest.mock('../../../app/routes/healthz', () => [{ path: '/healthz' }])
jest.mock('../../../app/routes/static', () => [{ path: '/static' }])

describe('router plugin', () => {
  test('should register routes when register is called', () => {
    const mockServer = {
      route: jest.fn()
    }

    router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      [].concat(
        homeRoutes,
        healthyRoutes,
        healthzRoutes,
        staticRoutes
      )
    )
  })
})
