const { AzureKeyCredential, SearchClient } = require('@azure/search-documents')
const config = require('../config')

/**
 * Returns instance of azure ai search client
 * @returns {SearchClient}
 */
const getSearchClient = () => {
  const searchClient = new SearchClient(
    config.azureOpenAI.searchUrl,
    config.azureOpenAI.cacheIndexName,
    new AzureKeyCredential(config.azureOpenAI.searchApiKey)
  )

  return searchClient
}

module.exports = {
  getSearchClient
}
