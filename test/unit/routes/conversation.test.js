const conversationPage = require('../../../app/routes/conversation')
const { fetchAnswer } = require('../../../app/services/query-service')

jest.mock('../../../app/services/query-service')
jest.mock('../../../app/services/ai-search-service')

describe('/conversation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    test('unauthenticated users get redirected to login', async () => {
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

      await conversationPage[0].handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    test('renders conversation page', async () => {
      const mockRequest = {
        params: {
          conversationId: 'testConversationId'
        },
        logger: {
          debug: jest.fn()
        },
        state: {
          ffa_cookie_policy: {
            auth: 'validpass'
          }
        },
        yar: {
          get: jest.fn()
        }
      }
      const mockH = {
        view: jest.fn(),
        redirect: jest.fn()
      }

      mockRequest.yar.get.mockReturnValue(({ testConversationId: [{ answer: 'test message', role: 'user' }] }))

      await conversationPage[0].handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('answer', {
        commandText: 'Ask follow-on question...',
        conversationId: 'testConversationId',
        messages: [{
          answer: 'test message',
          role: 'user'
        }],
        showHintText: true,
        validationError: false
      })
    })
  })

  describe('POST', () => {
    test('unauthenticated users get redirected to login', async () => {
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

      await conversationPage[1].handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    test('send user input and load response', async () => {
      fetchAnswer.mockResolvedValue({
        response: JSON.stringify({
          answer: 'responseMsg',
          items: []
        })
      })
      const mockRequest = {
        payload: {
          input: 'grants for deer fencing'
        },
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
      const expectedMessages = [
        {
          answer: 'test message',
          role: 'user'
        },
        {
          answer: 'grants for deer fencing',
          role: 'user',
          scrollToMessage: true
        },
        {
          answer: 'responseMsg',
          items: [],
          role: 'assistant'
        }
      ]

      mockRequest.yar.get.mockReturnValue(({ testConversationId: [{ answer: 'test message', role: 'user' }] }))

      await conversationPage[1].handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('messages', {
        testConversationId: [
          { answer: 'test message', role: 'user' },
          { answer: 'grants for deer fencing', role: 'user' },
          { answer: 'responseMsg', items: [], role: 'assistant' }
        ]
      })
      expect(mockH.view).toHaveBeenCalledWith('answer', {
        commandText: 'Ask follow-on question...',
        conversationId: 'testConversationId',
        messages: expectedMessages,
        showHintText: true,
        validationError: false
      })
    })

    test('empty user input renders error', async () => {
      const mockRequest = {
        payload: {
          input: undefined
        },
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
      const expectedMessages = [
        {
          answer: 'test message',
          role: 'user'
        }
      ]

      mockRequest.yar.get.mockReturnValue(({ testConversationId: [{ answer: 'test message', role: 'user' }] }))

      await conversationPage[1].handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('answer', {
        commandText: 'Ask follow-on question...',
        conversationId: 'testConversationId',
        messages: expectedMessages,
        showHintText: true,
        validationError: true
      })
    })
  })
})
