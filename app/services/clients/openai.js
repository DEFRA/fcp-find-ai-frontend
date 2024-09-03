const { ChatOpenAI, OpenAIEmbeddings } = require('@langchain/openai')

const config = require('../../config')

const embeddings = new OpenAIEmbeddings({
  azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
  azureOpenAIApiKey: config.azureOpenAI.openAiKey,
  azureOpenAIApiDeploymentName: 'ada-002',
  azureOpenAIApiVersion: '2024-02-01',
  onFailedAttempt: async (error) => {
    if (error.retriesLeft) {
      throw new Error(`Failed to get OpenAI embeddings: ${error}`)
    }
  }
})

const openai = new ChatOpenAI({
  azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
  azureOpenAIApiKey: config.azureOpenAI.openAiKey,
  azureOpenAIApiDeploymentName: config.azureOpenAI.openAiModelName,
  azureOpenAIApiVersion: '2024-02-01',
  onFailedAttempt: async (error) => {
    if (error.retriesLeft) {
      throw new Error(`Failed to query Azure OpenAI: ${error}`)
    }
  },
  verbose: true
})

module.exports = {
  openai,
  embeddings
}
