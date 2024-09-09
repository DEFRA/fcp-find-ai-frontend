const { v4: uuidv4 } = require('uuid')

const { AzureAISearchVectorStore } = require('../lib/azure-vector-store')
const config = require('../config')
const { trackFetchResponseFailed } = require('../lib/events')
const { openai, embeddings } = require('./clients/openai')
const util = require('util')
const { buildContextHistoryChain } = require('./chains/contextualise')
const { buildGenerateChain } = require('./chains/generate')
const IgLogCallbackHandler = require('../lib/ig-log/callback-handler')

const infer = async (query, chatHistory, embeddings, model, retryCount) => {
  try {
    const vectorStoreKey = 'indexName'
    const itemsToCheck = 20

    const vectorStore = new AzureAISearchVectorStore(embeddings, {
      endpoint: config.azureOpenAI.searchUrl,
      indexName: config.azureOpenAI[vectorStoreKey],
      key: config.azureOpenAI.searchApiKey,
      search: {
        type: 'similarity'
      }
    })

    const handler1 = new IgLogCallbackHandler({
      baseurl: 'http://host.docker.internal:3555',
      projectId: '1965bb1c-9efc-4417-b452-a5eb8f11fd86',
      sessionId: uuidv4(),
      user: 'test@test.com'
    })

    const retriever = vectorStore.asRetriever(itemsToCheck, { includeEmbeddings: true })

    const contextChain = buildContextHistoryChain(model)
    const generationChain = buildGenerateChain(model, contextChain, retriever)

    const response = await generationChain.invoke({
      chat_history: chatHistory,
      input: query
    }, {
      callbacks: [handler1]
    })

    return {
      response: JSON.parse(response.generated)
    }
  } catch (error) {
    console.log(error)
    trackFetchResponseFailed({
      errorMessage: error.message,
      requestQuery: query,
      retryCount
    })
    return {
      response: { answer: 'This tool cannot answer that kind of question, ask something about Defra funding instead', hallucinated: true }
    }
  }
}

const fetchAnswer = async (req, query, chatHistory) => {
  console.log('Fetching answer')
  const initialResponse = await infer(query, chatHistory, embeddings, openai, 0)

  console.log(util.inspect(initialResponse, { showHidden: false, depth: null }))

  return initialResponse

  // if (!initialResponse.hallucinated) {
  //   return initialResponse
  // }

  // return {
  //   response: JSON.stringify({ answer: 'This tool cannot answer that kind of question, ask something about Defra funding instead', items: [] }),
  //   hallucinated: true,
  //   summariesMode: false
  // }
}

module.exports = {
  fetchAnswer
}
