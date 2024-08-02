const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createHistoryAwareRetriever } = require('langchain/chains/history_aware_retriever')
const { FakeChatModel } = require('@langchain/core/utils/testing')
const { AzureAISearchVectorStore } = require('../lib/azure-vector-store')
const config = require('../config')
const { trackHallucinatedLinkInResponse, trackFetchResponseFailed } = require('../lib/events')
const { extractLinksForValidatingResponse, returnValidatedResponse } = require('../utils/langchain-utils')
const { getPrompt } = require('../domain/prompt')
const { searchCache, uploadToCache } = require('./ai-search-service')

const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
  }
}

const validateResponseLinks = (response, query) => {
  const trackIssueAndBreak = (errorMessage) => {
    trackHallucinatedLinkInResponse({
      errorMessage,
      failedObject: response,
      requestQuery: query
    })
    return false
  }

  try {
    if (!response.answer || !response.context) {
      return trackIssueAndBreak('validateResponseLinks failed because response object does not contain answer or context fields')
    }

    if (typeof response === 'string') {
      response = JSON.parse(response)
    }

    const responseEntriesAndLinks = extractLinksForValidatingResponse(response.answer)
    const trueEntriesAndLinks = extractLinksForValidatingResponse(response.context)

    if (trueEntriesAndLinks === undefined || trueEntriesAndLinks.length === 0) {
      return trackIssueAndBreak('validateResponseLinks failed because no links detected in true context object')
    }

    if (!responseEntriesAndLinks && !trueEntriesAndLinks) {
      return trackIssueAndBreak('validateResponseLinks failed because hallucinated links detected in response objects')
    }

    if (responseEntriesAndLinks !== undefined && responseEntriesAndLinks.length !== 0 && trueEntriesAndLinks !== undefined && trueEntriesAndLinks.length === 0) {
      return trackIssueAndBreak('validateResponseLinks failed because hallucinated links detected in response objects')
    }

    const trueMatches = trueEntriesAndLinks.map(entry => entry.matches).flat()
    const responseMatches = responseEntriesAndLinks.map(entry => entry.matches).flat()

    const invalidLinks = responseMatches.filter(link => !trueMatches.some(trueLink => trueLink === link || trueLink.includes(link)))

    if (invalidLinks !== undefined && invalidLinks.length > 0) {
      return trackIssueAndBreak('validateResponseLinks failed because invalid links detected in response objects')
    }
  } catch {
    return trackIssueAndBreak('validateResponseLinks failed')
  }

  return true
}

const runFetchAnswerQuery = async ({ query, chatHistory, summariesMode, embeddings, model, retryCount }) => {
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
      requestQuery: query,
      retryCount
    })
    return {
      response: { answer: 'This tool cannot answer that kind of question, ask something about Defra funding instead', hallucinated: true }
    }
  }
}

const runFetchAnswer = async ({ query, chatHistory, cacheEnabled, summariesEnabled, embeddings, model, retryCount }) => {
  if (summariesEnabled) {
    const { response: summariesResponse, hallucinated } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: true, model, embeddings, retryCount })

    if (!hallucinated) {
      // TODO cache summaries response after enabled
      return {
        answer: summariesResponse?.answer,
        summariesMode: true,
        hallucinated
      }
    }
  }

  const { response, hallucinated } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: false, embeddings, model, retryCount })

  if (cacheEnabled && !hallucinated && !config.useFakeLlm) {
    await uploadToCache(query, response.answer)
  }

  return {
    response: response?.answer,
    summariesMode: false,
    hallucinated
  }
}

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

  const initialResponse = await runFetchAnswer({ query, chatHistory, cacheEnabled, summariesEnabled, embeddings, model, retryCount: 0 })

  if (!initialResponse.hallucinated) {
    return initialResponse
  }

  const finalResponse = await runFetchAnswer({ query, chatHistory, cacheEnabled, summariesEnabled, embeddings, model, retryCount: 1 })

  if (!finalResponse.hallucinated) {
    return finalResponse
  }

  return {
    response: 'This tool cannot answer that kind of question, ask something about Defra funding instead',
    hallucinated: true,
    summariesMode: finalResponse.summariesMode
  }
}

module.exports = {
  fetchAnswer,
  validateResponseLinks
}
