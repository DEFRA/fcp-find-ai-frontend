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
        answer: JSON.stringify(answer)
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

      const { response, summariesMode } = await fetchAnswer({}, input, chatHistory, false, false)

      expect(mockInvoke).toHaveBeenCalledWith({ chat_history: chatHistory, input })
      expect(summariesMode).toBe(false)
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
            summary: 'description'
          }
        ]
      }
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

      const { response, summariesMode, hallucinated } = await fetchAnswer({}, input, [], false, true)

      expect(hallucinated).toBe(true)
      expect(summariesMode).toBe(false)
      expect(response).toStrictEqual(JSON.stringify(answer))
      expect(createStuffDocumentsChain).toHaveBeenCalledWith(
        expect.objectContaining({ prompt })
      )
    })

    test('fetchAnswer detects hallucinated link in summary answer and falls back to full index', async () => {
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
  })
})
