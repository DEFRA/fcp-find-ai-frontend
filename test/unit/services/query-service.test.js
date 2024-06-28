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
      createRetrievalChain.mockResolvedValue(({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'generated response', items: [] })
        })
      }))

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const response = await fetchAnswer({}, input)

      expect(JSON.parse(response).answer).toStrictEqual('generated response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(expect.objectContaining({ prompt }))
    })

    test('validateResponseLinks to correctly evaluate a response', async () => {
      const mockResponseTrue = {
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

      const validatedResponseTrue = validateResponseLinks(mockResponseTrue)
      const validatedResponseInvalid = validateResponseLinks(mockResponseInvalid)
      const validatedResponseNoContext = validateResponseLinks(mockResponseNoContext)
      const validatedResponseNoAnswer = validateResponseLinks(mockResponseNoAnswer)

      expect(validatedResponseTrue).toStrictEqual(true)
      expect(validatedResponseInvalid).toStrictEqual('validateResponseLinks failed because invalid links detected in response objects')
      expect(validatedResponseNoContext).toStrictEqual('validateResponseLinks failed because response object does not contain answer or context fields')
      expect(validatedResponseNoAnswer).toStrictEqual('validateResponseLinks failed because response object does not contain answer or context fields')
    })
  })
})
