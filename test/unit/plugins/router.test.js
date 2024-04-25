const homeRoutes = require('../../../app/routes/home')
const loginRoutes = require('../../../app/routes/login')
const resetRoutes = require('../../../app/routes/reset')
const healthyRoutes = require('../../../app/routes/healthy')
const healthzRoutes = require('../../../app/routes/healthz')
const errorRoutes = require('../../../app/routes/error')
const staticRoutes = require('../../../app/routes/static')

const router = require('../../../app/plugins/router')

jest.mock('../../../app/routes/home', () => [{ path: '/home' }])
jest.mock('../../../app/routes/login', () => [{ path: '/login' }])
jest.mock('../../../app/routes/reset', () => [{ path: '/reset' }])
jest.mock('../../../app/routes/healthy', () => [{ path: '/healthy' }])
jest.mock('../../../app/routes/healthz', () => [{ path: '/healthz' }])
jest.mock('../../../app/routes/error', () => [{ path: '/error' }])
jest.mock('../../../app/routes/static', () => [{ path: '/static' }])

describe('router plugin', () => {
  test('should register routes when register is called', () => {
    const mockServer = {
      route: jest.fn()
    }

    router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      [].concat(homeRoutes, loginRoutes, resetRoutes, healthyRoutes, healthzRoutes, errorRoutes, staticRoutes)
    )
  })
})
