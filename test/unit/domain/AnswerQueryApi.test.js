const { AnswerQueryService } = require('../../../app/domain/AnswerQueryService')

describe('AnswerQueryService', () => {
  let openAiClientMock

  beforeEach(() => {
    openAiClientMock = {
      getChatCompletions: jest.fn()
    }
  })

  describe('processAnswerQuery', () => {
    test('returns answer query', async () => {
      openAiClientMock.getChatCompletions.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'test response'
            }
          }
        ]
      })

      const answerQueryService = new AnswerQueryService(openAiClientMock)

      const response = await answerQueryService.processAnswerQuery('test query', 200, false, [])

      expect(response).toBe('test response')
    })
  })
})
