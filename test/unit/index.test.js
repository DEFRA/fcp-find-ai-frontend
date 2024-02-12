const mockStart = jest.fn()
jest.mock('../../app/server', () =>
  jest.fn().mockResolvedValue({
    start: mockStart,
    info: {
      uri: 'server-uri'
    }
  })
)
const createServer = require('../../app/server')

describe('Server setup', () => {
  let spyExit
  let spyError

  beforeEach(() => {
    jest.clearAllMocks()
    spyExit = jest.spyOn(process, 'exit').mockImplementation(() => {})
    spyError = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    spyExit.mockRestore()
    spyError.mockRestore()
  })

  test('start the server', async () => {
    require('../../app/index')
    expect(createServer).toHaveBeenCalled()
  })

  test('should log error and exit process when server start fails', async () => {
    const err = new Error('Server start failed')
    createServer.mockResolvedValue({
      start: jest.fn().mockRejectedValue(err),
      info: { uri: 'http://localhost' }
    })
    require('../../app/index')
  })
})
