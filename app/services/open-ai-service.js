const { OpenAIEmbeddings } = require('@langchain/openai')
const config = require('../config')

/**
 * Generates vector embeddings for content
 * @param {string} content
 * @returns {number[]}
 */
const generateEmbedding = async (content) => {
  const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
    azureOpenAIApiKey: config.azureOpenAI.openAiKey,
    azureOpenAIApiDeploymentName: 'text-embedding-ada-002',
    azureOpenAIApiVersion: '2024-02-01',
    onFailedAttempt
  })

  const embedding = await embeddings.embedDocuments([content])

  return embedding[0]
}

const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

module.exports = {
  generateEmbedding
}
