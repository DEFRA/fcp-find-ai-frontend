const Uuid = require('uuid')
const { generateEmbedding } = require('./open-ai-service')
const { logger } = require('../lib/logger')
const { getSearchClient } = require('../lib/azure-search-client')
const { logEvent } = require('../insights')
const { Event, trackCacheUpload } = require('../lib/events')
const config = require('../config')

/**
 * Uploads query and answer to cache
 * @param {string} query
 * @param {string} answer
 */
const uploadToCache = async (query, answer) => {
  try {
    const embedding = await generateEmbedding(query)

    const document = {
      id: Uuid.v4(),
      answer,
      content: query,
      content_vector: embedding
    }

    const searchClient = getSearchClient()
    await searchClient.uploadDocuments([document])

    trackCacheUpload({ requestQuery: query })
  } catch (error) {
    logger.error(error, 'Failed to upload query to cache')
  }
}

/**
 * Searches cache
 * @param {string} query
 * @returns {Promise<string>}
*/
const searchCache = async (query) => {
  const scoreTarget = config.azureOpenAI.cacheTarget

  try {
    const searchClient = await getSearchClient()
    let highestScore = 0

    const results = await searchClient.search(query)

    for await (const result of results.results) {
      if (result.score > highestScore) {
        highestScore = result.score
      }

      if (result.score >= scoreTarget) {
        logEvent(Event.CACHE_HIT, { score: result.score, target: scoreTarget })

        return result.document.answer
      }
    }

    logEvent(Event.CACHE_MISS, { score: highestScore, target: scoreTarget })

    return undefined
  } catch (error) {
    logEvent(Event.CACHE_MISS, { score: 0, target: scoreTarget, failed: true })
    logger.error(error)

    return undefined
  }
}

module.exports = {
  uploadToCache,
  searchCache
}
