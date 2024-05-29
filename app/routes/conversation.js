const { isAuthenticated } = require('../cookie-manager')
const { getMessages, setMessages } = require('../session/messages')
const { fetchAnswer } = require('../services/query-service')
const config = require('../config')
const { schemes } = require('../domain/schemes')
const { getChatHistory, parseMessage } = require('../utils/langchain-utils')

module.exports = [
  {
    method: 'GET',
    path: '/conversation/{conversationId}',
    handler: (request, h) => {
      if (!isAuthenticated(request, h)) {
        request.logger.debug('Redirecting user to auth page')

        return h.redirect('/login')
      }

      const conversationId = request.params.conversationId
      const selectedSchemes = [].concat(request.payload?.scheme || [])
      const schemesList = [...schemes].map((scheme) => {
        return {
          ...scheme,
          isSelected: selectedSchemes.includes(scheme.key)
        }
      })

      const messages = getMessages(request, conversationId)

      return h.view('answer', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError: false,
        messages,
        commandText: 'Ask follow-on question...',
        conversationId,
        showHintText: true,
        schemesList
      })
    }
  },
  {
    method: 'POST',
    path: '/conversation/{conversationId}',
    handler: async (request, h) => {
      if (!isAuthenticated(request, h)) {
        request.logger.debug('Redirecting user to auth page')

        return h.redirect('/login')
      }

      const conversationId = request.params.conversationId
      const input = request.payload?.input
      const validationError = !input
      const selectedSchemes = [].concat(request.payload?.scheme || [])
      const schemesList = [...schemes].map((scheme) => {
        return {
          ...scheme,
          isSelected: selectedSchemes.includes(scheme.key)
        }
      })

      request.logger.info(`User input: ${input}`, {
        input,
        schemesList,
        conversationId
      })

      const messages = getMessages(request, conversationId)
      const chatHistory = getChatHistory(messages)

      if (!input) {
        return h.view('answer', {
          fundingFarmingApiUri: config.fundingFarmingApiUri,
          validationError: true,
          messages,
          commandText: 'Ask follow-on question...',
          conversationId,
          showHintText: true,
          schemesList
        })
      }

      messages.push({
        role: 'user',
        answer: input
      })

      const response = await fetchAnswer(request, input, chatHistory)
      request.logger.info(`Generated response: ${response}`, {
        conversationId
      })
      try {
        const langchainData = parseMessage(request, response)

        messages.push({
          role: 'system',
          ...langchainData
        })
      } catch (error) {
        messages.push({
          role: 'system',
          answer: response
        })
      }

      setMessages(request, conversationId, messages)

      const formattedMessages = [...messages]
      formattedMessages[formattedMessages.length - 2] = {
        ...formattedMessages[formattedMessages.length - 2],
        scrollToMessage: formattedMessages.length > 2
      }

      return h.view('answer', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        messages: formattedMessages,
        commandText: 'Ask follow-on question...',
        conversationId,
        showHintText: true,
        schemesList
      })
    }
  }
]
