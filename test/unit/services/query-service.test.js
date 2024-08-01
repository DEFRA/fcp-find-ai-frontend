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

      const { response } = await fetchAnswer({}, input)

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

    test('fetchAnswer returns summary answer when summariesEnabled is true', async () => {
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'summary response', items: [] })
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('summary response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )

      if (!hallucinated) {
        expect(summariesMode).toBe(true)
      }
    })

    test('fetchAnswer does not return summary answer when summariesEnabled is false', async () => {
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'full index response', items: [] })
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response, summariesMode } = await fetchAnswer({}, input, [], false, false)

      expect(JSON.parse(response).answer).toStrictEqual('full index response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
      expect(summariesMode).toBe(false)
    })

    test('fetchAnswer falls back to full index when summary answer returns "Unknown"', async () => {
      createRetrievalChain
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify({ answer: 'Unknown', items: [] })
          })
        })
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify({ answer: 'full index response', items: [] })
          })
        })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('full index response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer does not fall back to full index when summary answer is valid', async () => {
      createRetrievalChain.mockResolvedValueOnce({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'summary response', items: [] })
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('full index response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer detects hallucinated link in summary answer and falls back to full index', async () => {
      createRetrievalChain
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
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
            })
          })
        })
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify({ answer: 'full index response', items: [] })
          })
        })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('full index response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer does not fall back to full index when summary answer has no hallucinated links', async () => {
      createRetrievalChain.mockResolvedValueOnce({
        invoke: jest.fn().mockResolvedValue({
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
          })
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('full index response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })
  })

  describe('validateResponseLinks', () => {
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
  })
})
