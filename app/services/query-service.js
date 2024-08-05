const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createHistoryAwareRetriever } = require('langchain/chains/history_aware_retriever')
const { FakeChatModel } = require('@langchain/core/utils/testing')
// eslint-disable-next-line no-unused-vars
const { BaseMessage } = require('@langchain/core/messages')
const { AzureAISearchVectorStore } = require('../lib/azure-vector-store')
const config = require('../config')
const { trackFetchResponseFailed } = require('../lib/events')
const { returnValidatedResponse } = require('../utils/langchain-utils')
const { getPrompt } = require('../domain/prompt')
const { searchCache, uploadToCache } = require('./ai-search-service')
const { validateResponseLinks } = require('../utils/validators')

const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

const runFetchAnswerQuery = async ({ query, chatHistory, summariesMode, embeddings, model }) => {
  try {
    const vectorStoreKey = summariesMode ? 'summaryIndexName' : 'indexName'
    const itemsToCheck = summariesMode ? 40 : 20
    const promptText = getPrompt(summariesMode)

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', promptText],
      new MessagesPlaceholder('chat_history'),
      ['user', '{input}']
    ])

    const documentChain = await createStuffDocumentsChain({
      llm: model,
      prompt
    })

    const vectorStore = new AzureAISearchVectorStore(embeddings, {
      endpoint: config.azureOpenAI.searchUrl,
      indexName: config.azureOpenAI[vectorStoreKey],
      key: config.azureOpenAI.searchApiKey,
      search: {
        type: 'similarity'
      }
    })

    const retriever = vectorStore.asRetriever(itemsToCheck, { includeEmbeddings: true })

    const historyRetrieverPrompt = ChatPromptTemplate.fromMessages([
      new MessagesPlaceholder('chat_history'),
      ['user', '{input}'],
      [
        'user',
        'Given the above conversation, generate a search query to look up in order to get information relevant to the conversation'
      ]
    ])

    const historyAwareRetriever = await createHistoryAwareRetriever({
      llm: model,
      retriever,
      rephrasePrompt: historyRetrieverPrompt
    })

    const retrievalChain = await createRetrievalChain({
      combineDocsChain: documentChain,
      retriever: historyAwareRetriever
    })

    const response = await retrievalChain.invoke({
      chat_history: chatHistory,
      input: query
    })

    const hallucinated = !validateResponseLinks(response, query)
    const validatedReponse = returnValidatedResponse(response)

    return { response: validatedReponse, hallucinated }
  } catch (error) {
    trackFetchResponseFailed({
      errorMessage: error.message,
      requestQuery: query
    })
    return {
      response: { answer: 'This tool cannot answer that kind of question, ask something about Defra funding instead', hallucinated: true }
    }
  }
}

/**
 * Fetches answer from AI Search and OpenAI
 * @param {*} req
 * @param {string} query
 * @param {BaseMessage[]} chatHistory
 * @param {boolean} cacheEnabled
 * @param {boolean} summariesEnabled
 * @returns {{ response: string, summariesMode: boolean, hallucinated: boolean }}
 */
const fetchAnswer = async (req, query, chatHistory, cacheEnabled, summariesEnabled = false) => {
  if (cacheEnabled) {
    const cacheResponse = await searchCache(query)

    if (cacheResponse) {
      return {
        response: cacheResponse,
        summariesMode: summariesEnabled,
        hallucinated: false
      }
    }
  }

  const embeddings = new OpenAIEmbeddings({
    azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
    azureOpenAIApiKey: config.azureOpenAI.openAiKey,
    azureOpenAIApiDeploymentName: 'text-embedding-ada-002',
    azureOpenAIApiVersion: '2024-02-01',
    onFailedAttempt
  })

  const model = config.useFakeLlm
    ? new FakeChatModel({ onFailedAttempt })
    : new ChatOpenAI({
      azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
      azureOpenAIApiKey: config.azureOpenAI.openAiKey,
      azureOpenAIApiDeploymentName: config.azureOpenAI.openAiModelName,
      azureOpenAIApiVersion: '2024-02-01',
      onFailedAttempt
    })

  if (summariesEnabled) {
    const { response: summariesResponse, hallucinated } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: true, model, embeddings })

    if (!hallucinated) {
      // TODO cache summaries response after enabled
      return {
        response: summariesResponse?.answer,
        summariesMode: true,
        hallucinated
      }
    }
  }

  const { response, hallucinated } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: false, embeddings, model })

  if (cacheEnabled && !hallucinated && !config.useFakeLlm) {
    await uploadToCache(query, response.answer)
  }

  return {
    response: response?.answer,
    summariesMode: false,
    hallucinated
  }
}

module.exports = {
  fetchAnswer
}
