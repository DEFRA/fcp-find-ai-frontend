const resetPage = require('../../../app/routes/reset')

describe('/reset', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    test('clears stored messages and redirects to homepage', async () => {
      const mockRequest = {
        params: {
          conversationId: 'testConversationId'
        },
        logger: {
          debug: jest.fn(),
          info: jest.fn()
        },
        state: {
          ffa_cookie_policy: {
            auth: 'validpass'
          }
        },
        yar: {
          get: jest.fn(),
          set: jest.fn()
        }
      }
      const mockH = {
        view: jest.fn(),
        redirect: jest.fn()
      }

      mockRequest.yar.get.mockReturnValue(({ testConversationId: [{ answer: 'test message', role: 'user' }] }))

      await resetPage.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('messages', {
        testConversationId: []
      })
      expect(mockH.redirect).toHaveBeenCalled()
    })
  })
})
