const { OpenAIClient, OpenAIKeyCredential } = require('@azure/openai')
const { SearchClient, AzureKeyCredential } = require('@azure/search-documents')
const config = require('../config')

const gptModel = 'gpt-35-turbo'
const modelCustomIntro = ''

class AnswerQueryService {
  constructor (openAIClient, searchClient) {
    this.openAIClient = openAIClient
    this.searchClient = searchClient
  }

  async processAnswerQuery (query, tokenBudget, printMessage, selectedSchemes) {
    const message = this.queryMessage(query, tokenBudget, selectedSchemes)

    if (printMessage) {
      console.log(message)
    }

    const messages = [
      { role: 'system', content: modelCustomIntro },
      { role: 'user', content: message }
    ]

    const response = await this.openAIClient.getChatCompletions(messages, 0.0, false, gptModel)
    console.log(response)

    return response.choices[0].message.content
  }

  queryMessage () {
    return '' // TODO
  }
}

module.exports = {
  AnswerQueryService,
  answerQueryService: () => new AnswerQueryService(
    new OpenAIClient(config.ai.openAIUrl, new OpenAIKeyCredential(config.ai.openAIKey)),
    new SearchClient(config.ai.azureUrl, '<indexName>', new AzureKeyCredential(config.ai.aiSearchKey))
  )
}
