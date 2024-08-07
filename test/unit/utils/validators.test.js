const { validateResponseLinks } = require('../../../app/utils/validators')

describe('validators', () => {
  describe('validateResponseLinks', () => {
    beforeEach(() => {
      // Reset mocks before each test to ensure no state leakage
      jest.clearAllMocks()
    })

    test('validate a correctly structured response without hallucinated links', async () => {
      const mockResponseValid = {
        answer: JSON.stringify({
          answer: 'generated response',
          items: [
            {
              title: 'True title',
              scheme: 'True scheme',
              url: 'https://www.gov.uk/link',
              summary: 'True summary'
            }
          ]
        }),
        context: [
          {
            pageContent:
              '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      }

      const validatedResponseTrue = validateResponseLinks(mockResponseValid, 'deer fencing')

      expect(validatedResponseTrue).toBe(true)
    })

    test('invalidate incorrectly structured or has hallucinated links', async () => {
      const mockResponseInvalid = {
        answer: JSON.stringify({
          answer: 'generated response',
          items: [
            {
              title: 'True title',
              scheme: 'True scheme',
              url: 'https://www.gov.uk/link',
              summary: 'True summary'
            },
            {
              title: 'Fake title',
              scheme: 'Fake scheme',
              url: 'https://www.gov.uk/fake_link',
              summary: 'Fake summary'
            }
          ]
        }),
        context: [
          {
            pageContent:
              '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      }

      const mockResponseNoContext = {
        answer: JSON.stringify({
          answer: 'generated response',
          items: [
            {
              title: 'True title',
              scheme: 'True scheme',
              url: 'https://www.gov.uk/link',
              summary: 'True summary'
            }
          ]
        })
      }

      const mockResponseNoAnswer = {
        context: [
          {
            pageContent:
              '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      }

      const validatedResponseInvalid = validateResponseLinks(mockResponseInvalid, 'deer fencing')
      const validatedResponseNoContext = validateResponseLinks(mockResponseNoContext, 'deer fencing')
      const validatedResponseNoAnswer = validateResponseLinks(mockResponseNoAnswer, 'deer fencing')

      expect(validatedResponseInvalid).toBe(false)
      expect(validatedResponseNoContext).toBe(false)
      expect(validatedResponseNoAnswer).toBe(false)
    })
  })
})
