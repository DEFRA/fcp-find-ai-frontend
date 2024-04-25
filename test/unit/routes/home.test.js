const config = require('../../../app/config')
const home = require('../../../app/routes/home')

describe('/home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('unauthenticated users are redirected to login page', async () => {
    const mockRequest = {
      logger: {
        debug: jest.fn()
      },
      state: {
        ffa_cookie_policy: {
          auth: 'placeholder'
        }
      }
    }
    const mockH = {
      view: jest.fn(),
      redirect: jest.fn()
    }

    await home.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalled()
  })

  test('render the homepage', async () => {
    config.auth.authVerification = 'placeholder'
    const mockRequest = {
      state: {
        ffa_cookie_policy: {
          auth: 'placeholder'
        }
      }
    }
    const mockH = {
      view: jest.fn(),
      redirect: jest.fn()
    }

    await home.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith('home', expect.objectContaining({}))
  })
})
