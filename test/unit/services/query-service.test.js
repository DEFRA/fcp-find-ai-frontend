const { fetchAnswer } = require('../../../app/services/query-service')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { getChatHistory } = require('../../../app/utils/langchain-utils')

jest.mock('@langchain/openai')
jest.mock('@langchain/core/prompts')
jest.mock('langchain/chains/combine_documents')
jest.mock('langchain/chains/retrieval')
jest.mock('langchain/chains/history_aware_retriever')
jest.mock('../../../app/lib/azure-vector-store')

describe('query-service', () => {
  describe('fetchAnswer', () => {
    beforeEach(() => {
      // Reset mocks before each test to ensure no state leakage
      jest.clearAllMocks()
    })
    test('perform langchain call', async () => {
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'generated response', items: [] }),
          context: [
            {
              pageContent:
                '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
              metadata: {}
            }
          ]
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, false)

      expect(JSON.parse(response).answer).toStrictEqual('generated response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(expect.objectContaining({ prompt }))
    })

    test('generates answer from RAG chain - full index', async () => {
      const input = 'deer fencing'
      const prompt = jest.fn()
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)
      const answer = {
        answer: 'generated response',
        items: [
          {
            title: 'AB1 Grant name',
            scheme: 'SFI',
            url: 'https://test.dev',
            summary: 'description'
          }
        ]
      }
      const mockInvoke = jest.fn().mockResolvedValue({
        answer: JSON.stringify(answer),
        context: [
          {
            pageContent:
              '(Title: AB1 Grant name | Grant Scheme Name: SFI | Source:https://test.dev | Chunk Number: 0)===True summary',
            metadata: {}
          }
        ]
      })
      createRetrievalChain.mockResolvedValue({
        invoke: mockInvoke
      })
      const chatHistory = getChatHistory([
        {
          role: 'user',
          answer: 'old message'
        }
      ])

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, chatHistory, false, false)

      expect(mockInvoke).toHaveBeenCalledWith({ chat_history: chatHistory, input })
      expect(summariesMode).toBe(false)
      expect(hallucinated).toBe(false)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(expect.objectContaining({ prompt }))
    })

    test('fetchAnswer returns summary answer when summariesEnabled is true', async () => {
      const input = 'deer fencing'
      const prompt = jest.fn()
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)
      const answer = {
        answer: 'generated response',
        items: [
          {
            title: 'AB1 Grant name',
            scheme: 'SFI',
            url: 'https://test.dev',
            summary: 'Summary description'
          }
        ]
      }
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify(answer),
          context: [
            {
              pageContent: '(Title: WBD2: ditches | Grant Scheme Name: SFI | Source: https://test.dev | Chunk Number: 1)===This is an action'
            }
          ]
        })
      })

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      expect(summariesMode).toBe(true)
      expect(hallucinated).toBe(false)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer falls back to full index when summary answer returns "Unknown"', async () => {
      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)
      const answer = {
        answer: 'generated response',
        items: [
          {
            title: 'AB1 Grant name',
            scheme: 'SFI',
            url: 'https://test.dev',
            summary: 'Summary description'
          }
        ]
      }
      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      createRetrievalChain
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify({ answer: 'Unknown', items: [] })
          })
        })
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify(answer)
          })
        })

      expect(hallucinated).toBe(false)
      expect(summariesMode).toBe(true)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer detects hallucinated link in summary answer and falls back to full index, return a valid result', async () => {
      const input = 'deer fencing'
      const prompt = jest.fn()
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)
      const answer = {
        answer: 'full index response',
        items: [
          {
            title: 'AB1 Grant name',
            scheme: 'SFI',
            url: 'https://test.dev',
            summary: 'description'
          }
        ]
      }
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
              ]
            })
          })
        })
        .mockResolvedValueOnce({
          invoke: jest.fn().mockResolvedValue({
            answer: JSON.stringify(answer),
            context: [
              {
                pageContent: '(Title: WBD2: ditches | Grant Scheme Name: SFI | Source: https://test.dev | Chunk Number: 1)===This is an action'
              }
            ]
          })
        })

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      expect(hallucinated).toBe(false)
      expect(summariesMode).toBe(false)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer does not fall back to full index when summary answer has no hallucinated links', async () => {
      const input = 'deer fencing'
      const prompt = jest.fn()
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)
      const answer = {
        answer: 'summary response',
        items: [
          {
            title: 'True title',
            scheme: 'True scheme',
            url: 'https://www.true-link.com',
            summary: 'True summary'
          }
        ]
      }
      createRetrievalChain.mockResolvedValueOnce({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify(answer),
          context: [
            {
              pageContent: '(Title: WBD2: ditches | Grant Scheme Name: SFI | Source: https://www.true-link.com | Chunk Number: 1)===This is an action'
            }
          ]
        })
      })

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      expect(summariesMode).toBe(true)
      expect(hallucinated).toBe(false)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer does not return summary answer when summariesEnabled is false', async () => {
      createRetrievalChain.mockResolvedValue({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'full index response', items: [] }),
          context: [
            {
              pageContent:
                '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
              metadata: {}
            }
          ]
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

    test('fetchAnswer does not fall back to full index when summary answer is valid', async () => {
      createRetrievalChain.mockResolvedValueOnce({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'summary response', items: [] }),
          context: [
            {
              pageContent:
                '(Title: True title | Grant Scheme Name: True scheme | Source: https://www.gov.uk/link | Chunk Number: 0)===True summary',
              metadata: {}
            }
          ]
        })
      })

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const { response } = await fetchAnswer({}, input, [], false, true)

      expect(JSON.parse(response).answer).toStrictEqual('summary response')
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })
  })
})
