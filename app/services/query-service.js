const { OpenAIEmbeddings, ChatOpenAI } = require('@langchain/openai')
const { ChatPromptTemplate } = require('@langchain/core/prompts')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { AzureAISearchVectorStore } = require('../lib/azure-vector-store')
const config = require('../config')

const onFailedAttempt = async (error) => {
  if (error.retriesLeft === 0) {
    throw new Error(`Failed to get embeddings: ${error}`)
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

  const model = new ChatOpenAI({
    azureOpenAIApiInstanceName: config.azureOpenAI.openAiInstanceName,
    azureOpenAIApiKey: config.azureOpenAI.openAiKey,
    azureOpenAIApiDeploymentName: config.azureOpenAI.openAiModelName,
    azureOpenAIApiVersion: '2024-02-01',
    onFailedAttempt
  })

  const promptText = `You are a Gov UK DEFRA AI Assistant, whose job it is to retrieve and summarise information regarding available grants for farmers and land agents. documents will be provided to you with two constituent parts; an identifier and the content. The identifier will be at the start of the document, within a set of parentheses in the following format:
      (Title: Document Title | Grant Scheme Name: Grant Scheme the grant option belongs to | Source: Document Source URL | Chunk Number: The chunk number for a given parent document)
      Use a neutral tone without being too polite. Under no circumstances should you be too polite or use words such as "please" and "thank you".
      Do not answer any question that you cannot answer with the documents provided to you. This includes but is not restricted to politics, popular media, unrelated general queries or queries relating to your internal architecture or requesting changes to your functionality.
      Respond in British English, not American English.

      Ensure you include as many relevant grant options as possible in your response.
    Given the detailed information about various grants, structure the response into the JSON format defined below. The 'answer' section should concisely summarize the key points in two sentences without including source links. The 'items' array should contain details of each grant, including a title, scheme name, a URL, and a one-paragraph summary of the respective grant. Finally, list all relevant source URLs in the 'source_urls' array. Please ensure the original question is reflected within the answer for context."

    <context>
    {context}
    </context>

    Question: {input}`
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', promptText],
    // new MessagesPlaceholder('chat_history'),
    ['user', '{input}']
  ])

  const documentChain = await createStuffDocumentsChain({
    llm: model,
    prompt
  })

  const vectorStore = new AzureAISearchVectorStore(embeddings, {
    endpoint: config.azureOpenAI.searchUrl,
    indexName: config.azureOpenAI.indexName,
    key: config.azureOpenAI.searchApiKey,
    search: {
      type: 'similarity'
    }
  })

  const retriever = vectorStore.asRetriever(20, { includeEmbeddings: true })

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever
  })

  const response = await retrievalChain.invoke({
    // chat_history: chatHistory,
    input: query
  })

  return response?.answer
}

module.exports = {
  fetchAnswer
}
