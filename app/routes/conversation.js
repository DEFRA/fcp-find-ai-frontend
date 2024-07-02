const { isAuthenticated } = require('../cookie-manager')
const { getMessages, setMessages } = require('../session/messages')
const { fetchAnswer } = require('../services/query-service')
const { schemes } = require('../domain/schemes')
const { getChatHistory, parseMessage } = require('../utils/langchain-utils')
const { trackMessage, trackSystemMessage, trackConversationPageView } = require('../lib/events')

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

      trackConversationPageView(conversationId)

      const selectedSchemes = [].concat(request.payload?.scheme || [])
      const schemesList = [...schemes].map((scheme) => {
        return {
          ...scheme,
          isSelected: selectedSchemes.includes(scheme.key)
        }
      })

      const messages = getMessages(request, conversationId)

      return h.view('answer', {
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

      trackConversationPageView(conversationId)

      const input = request.payload?.input
      const validationError = !input
      const selectedSchemes = [].concat(request.payload?.scheme || [])
      const schemesList = [...schemes].map((scheme) => {
        return {
          ...scheme,
          isSelected: selectedSchemes.includes(scheme.key)
        }
      })

      const messages = getMessages(request, conversationId)
      const chatHistory = getChatHistory(messages)

      if (!input) {
        return h.view('answer', {
          validationError: true,
          messages,
          commandText: 'Ask follow-on question...',
          conversationId,
          showHintText: true,
          schemesList
        })
      }

      const startTime = new Date()
      trackMessage({ message: input, conversationId, schemesList, characterCount: input.length, time: startTime, conversationPosition: chatHistory.length + 1 })

      messages.push({
        role: 'user',
        answer: input
      })

      const response = await fetchAnswer(request, input, chatHistory)
      const endTime = new Date()

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
      } finally {
        const responseDuration = (endTime.getTime() - startTime.getTime() / 1000)
        trackSystemMessage({ message: response, conversationId, time: endTime, characterCount: response.length, responseDuration, conversationPosition: chatHistory.length + 2 })
      }

      setMessages(request, conversationId, messages)

      const formattedMessages = [...messages]
      formattedMessages[formattedMessages.length - 2] = {
        ...formattedMessages[formattedMessages.length - 2],
        scrollToMessage: formattedMessages.length > 2
      }

      return h.view('answer', {
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
