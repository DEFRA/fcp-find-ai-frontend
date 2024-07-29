const homeRoutes = require('../../../app/routes/home')
const conversationRoutes = require('../../../app/routes/conversation')
const testingRoutes = require('../../../app/routes/testing')
const loginRoutes = require('../../../app/routes/login')
const resetRoutes = require('../../../app/routes/reset')
const healthyRoutes = require('../../../app/routes/healthy')
const healthzRoutes = require('../../../app/routes/healthz')
const staticRoutes = require('../../../app/routes/static')

const router = require('../../../app/plugins/router')

jest.mock('../../../app/routes/home', () => [{ path: '/home' }])
jest.mock('../../../app/routes/conversation', () => [{ path: '/conversation/{conversationId}' }])
jest.mock('../../../app/routes/login', () => [{ path: '/login' }])
jest.mock('../../../app/routes/reset', () => [{ path: '/reset' }])
jest.mock('../../../app/routes/healthy', () => [{ path: '/healthy' }])
jest.mock('../../../app/routes/healthz', () => [{ path: '/healthz' }])
jest.mock('../../../app/routes/static', () => [{ path: '/static' }])
jest.mock('../../../app/routes/testing', () => [{ path: '/test_prompts' }])

describe('router plugin', () => {
  test('should register routes when register is called', () => {
    const mockServer = {
      route: jest.fn()
    }

    router.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledWith(
      [].concat(
        homeRoutes,
        conversationRoutes,
        testingRoutes,
        loginRoutes,
        resetRoutes,
        healthyRoutes,
        healthzRoutes,
        staticRoutes
      )
    )
  })
})
