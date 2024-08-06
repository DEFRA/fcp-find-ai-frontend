const { getSearchClient } = require('../../../app/lib/azure-search-client')
const { uploadToCache, searchCache } = require('../../../app/services/ai-search-service')
const { generateEmbedding } = require('../../../app/services/open-ai-service')

jest.mock('../../../app/services/open-ai-service')
jest.mock('../../../app/lib/azure-search-client')
jest.mock('@azure/search-documents')
jest.mock('../../../app/lib/logger')

describe('AI Search Service', () => {
  let AISearchClient

  beforeEach(() => {
    generateEmbedding.mockResolvedValue('embedding')

    AISearchClient = {
      uploadDocuments: jest.fn(),
      search: jest.fn()
    }

    getSearchClient.mockReturnValue(AISearchClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('uploadToCache', () => {
    test('uploads answer to cache', async () => {
      await uploadToCache('testQuery', 'testAnswer')

      expect(AISearchClient.uploadDocuments).toHaveBeenCalledWith([expect.objectContaining({
        answer: 'testAnswer',
        content: 'testQuery',
        content_vector: 'embedding'
      })])
    })
  })

  describe('searchCache', () => {
    test('get answer from cache', async () => {
      AISearchClient.search.mockResolvedValue({
        results: [{
          document: {
            answer: 'cachedAnswer'
          },
          score: 3.95
        }]
      })

      const result = await searchCache('testQuery')

      expect(result).toBe('cachedAnswer')
    })

    test('returns undefined if query does not closely match cached answer', async () => {
      AISearchClient.search.mockResolvedValue({
        results: [{
          document: {
            answer: 'cachedAnswer'
          },
          score: 2.8
        }]
      })

      const result = await searchCache('testQuery')

      expect(result).toBe(undefined)
    })

    test('returns undefined if searching in azure AI search fails', async () => {
      const error = new Error()
      AISearchClient.search.mockRejectedValue(error)

      const result = await searchCache('testQuery')

      expect(result).toBe(undefined)
    })
  })
})
