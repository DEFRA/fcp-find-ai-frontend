const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai')
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createHistoryAwareRetriever } = require('langchain/chains/history_aware_retriever')
const { FakeChatModel } = require('@langchain/core/utils/testing')
const { AzureAISearchVectorStore } = require('../lib/azure-vector-store')
const config = require('../config')
const { trackHallucinatedLinkInResponse, trackFetchResponseFailed } = require('../lib/events')
const { extractLinksForValidatingResponse, validateResponseSummaries } = require('../utils/langchain-utils')
const { redact } = require('../utils/redact-utils')
const { getPrompt } = require('../domain/prompt')

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

    const responseEntriesAndLinks = extractLinksForValidatingResponse(JSON.parse(response.answer))
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

    const invalidLinks = responseEntriesAndLinks.filter((entry) =>
      entry.matches.some((link) => !trueEntriesAndLinks.some((trueEntry) => trueEntry.matches.includes(link)))
    )

    if (invalidLinks !== undefined && invalidLinks.length > 0) {
      return trackIssueAndBreak('validateResponseLinks failed because invalid links detected in response objects')
    }
  } catch {
    return trackIssueAndBreak('validateResponseLinks failed because of an error')
  }

  return true
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

    const redactedQuery = await redact(query)

    const response = await retrievalChain.invoke({
      chat_history: chatHistory,
      input: redactedQuery
    })

    const hallucinated = !validateResponseLinks(response, query)

    return { response, hallucinated }
  } catch (error) {
    trackFetchResponseFailed({
      errorMessage: error.message,
      requestQuery: query
    })
    return {
      response: { answer: 'This tool cannot answer that kind of question, ask something about Defra funding instead' }
    }
  }
}

const fetchAnswer = async (req, query, chatHistory) => {
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

  const { response: summariesResponse, hallucinated } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: true, model, embeddings })
  const isResponseValid = validateResponseSummaries(summariesResponse)

  if (isResponseValid && !hallucinated && hallucinated !== undefined) {
    return summariesResponse?.answer
  }

  const { response } = await runFetchAnswerQuery({ query, chatHistory, summariesMode: false, embeddings, model })

  return response?.answer
}

module.exports = {
  fetchAnswer,
  validateResponseLinks
}
