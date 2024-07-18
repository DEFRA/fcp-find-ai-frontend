const { isAuthenticated } = require('../cookie-manager')
const { getMessages, setMessages } = require('../session/messages')
const { fetchAnswer } = require('../services/query-service')
const { schemes } = require('../domain/schemes')
const { getChatHistory, parseMessage } = require('../utils/langchain-utils')
const { trackMessage, trackSystemMessage, trackConversationPageView } = require('../lib/events')
const boom = require('@hapi/boom')
const { logger } = require('../lib/logger')
const { redact } = require('../utils/redact-utils')
const config = require('../config')

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

      if (!messages) {
        return boom.notFound()
      }

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

      const messages = getMessages(request, conversationId) || []
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

      const redactedQuery = await redact(input)

      const startTime = new Date()
      trackMessage({ message: redactedQuery, conversationId, schemesList, characterCount: redactedQuery.length, time: startTime, conversationPosition: chatHistory.length + 1 })

      messages.push({
        role: 'user',
        answer: redactedQuery
      })

      const response = await fetchAnswer(request, redactedQuery, chatHistory, config.azureOpenAI.cacheEnabled)

      const endTime = new Date()

      request.logger.debug(`Generated response: ${response}`, {
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
        const responseDuration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)
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
  },
  {
    method: 'GET',
    path: '/test_prompts',
    handler: async (request, h) => {
      if (config.endpointTestingEnabled !== true) {
        return h.response().code(404)
      }

      logger.info('Testing prompts')

      const inputs = [
        'Give me grants for deer fencing',
        'Give me grants to increase biodiversity',
        'Give me grants for planting flowers',
        "What's the price for FG10",
        'what land types does AB1 apply to',
        'funding for slurry'
      ]

      const processInput = async (input, index) => {
        try {
          const startTime = new Date()
          let response
          let passedValidation = false

          try {
            response = await fetchAnswer(request, input, [])
            passedValidation = parseMessage(request, response) !== undefined
          } catch (error) {
            logger.info(`Response ${index + 1} out of ${inputs.length} failed validation or fetch with error:`, error)
          }

          const endTime = new Date()
          const responseDuration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)
          const responseLength = response && passedValidation ? JSON.parse(response).answer.split(' ').length : response.split(' ').length

          logger.info(`Response ${index + 1} out of ${inputs.length} generated in ${responseDuration} seconds`)

          return {
            question: input,
            answer: passedValidation ? JSON.parse(response) : response,
            responseDuration,
            responseLength,
            passedValidation
          }
        } catch (error) {
          return {
            question: input,
            answer: 'Error:' + error,
            responseDuration: 0,
            responseLength: 0,
            passedValidation: false
          }
        }
      }

      const responses = await Promise.all(inputs.map(async (input, index) =>
        await processInput(input, index)
      ))

      return h.view('test_prompts_response', {
        responses
      })
    }
  }
]
