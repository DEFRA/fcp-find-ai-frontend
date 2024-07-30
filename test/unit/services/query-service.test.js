const { fetchAnswer, validateResponseLinks } = require('../../../app/services/query-service')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { ChatPromptTemplate } = require('@langchain/core/prompts')

jest.mock('@langchain/openai')
jest.mock('@langchain/core/prompts')
jest.mock('langchain/chains/combine_documents')
jest.mock('langchain/chains/retrieval')
jest.mock('langchain/chains/history_aware_retriever')
jest.mock('../../../app/lib/azure-vector-store')

describe('query-service', () => {
  describe('fetchAnswer', () => {
    test('perform langchain call', async () => {
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'generated response', items: [] })
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const response = await fetchAnswer({}, input)

      expect(JSON.parse(response).answer).toStrictEqual(JSON.stringify({
        answer: 'generated response',
        items: []
      }))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(expect.objectContaining({ prompt }))
    })

    test('validateResponseLinks to validate a correctly structured response without hallucinated links', async () => {
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
          ],
          source_urls: ['https://www.gov.uk/link']
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

      expect(validatedResponseTrue).toStrictEqual(true)
    })

    test('validateResponseLinks to invalidate a response that is either incorrectly structred or has hallucinated links', async () => {
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
          ],
          source_urls: ['https://www.gov.uk/link', 'https://www.gov.uk/fake_link']
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
          ],
          source_urls: ['https://www.gov.uk/link']
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

      expect(validatedResponseInvalid).toStrictEqual(false)
      expect(validatedResponseNoContext).toStrictEqual(false)
      expect(validatedResponseNoAnswer).toStrictEqual(false)
    })
  })
})
