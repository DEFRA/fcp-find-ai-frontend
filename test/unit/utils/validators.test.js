const { validateResponseLinks } = require('../../../app/utils/validators')

describe('validators', () => {
  describe('validateResponseLinks', () => {
    beforeEach(() => {
      // Reset mocks before each test to ensure no state leakage
      jest.clearAllMocks()
    })

    test('validateResponseLinks detects hallucinated links in summary answer', async () => {
      const mockResponseWithHallucinatedLinks = {
        answer: JSON.stringify({
          answer: 'summary response with hallucinated link',
          items: [
            {
              title: 'Fake title',
              scheme: 'Fake scheme',
              url: 'https://www.fake-link.com',
              summary: 'Fake summary'
            }
          ],
          source_urls: ['https://www.fake-link.com']
        }),
        context: [
          {
            pageContent:
              '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.true-link.com | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      }

      const isValid = validateResponseLinks(
        mockResponseWithHallucinatedLinks,
        'deer fencing'
      )

      expect(isValid).toStrictEqual(false)
    })

    test('validateResponseLinks passes when no hallucinated links are present', async () => {
      const mockResponseValid = {
        answer: JSON.stringify({
          answer: 'summary response',
          items: [
            {
              title: 'True title',
              scheme: 'True scheme',
              url: 'https://www.true-link.com',
              summary: 'True summary'
            }
          ],
          source_urls: ['https://www.true-link.com']
        }),
        context: [
          {
            pageContent:
              '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.true-link.com | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      }

      const isValid = validateResponseLinks(mockResponseValid, 'deer fencing')

      expect(isValid).toStrictEqual(true)
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
