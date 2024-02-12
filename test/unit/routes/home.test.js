const home = require('../../../app/routes/home')

describe('/home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test('should return success', async () => {
    const mockRequest = {}
    const mockH = {
      view: jest.fn()
    }

    await home.options.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalled()
  })
})
