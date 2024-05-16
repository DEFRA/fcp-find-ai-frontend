const { isAuthenticated } = require('../cookie-manager')
const { getMessages, setMessages } = require('../session/messages')
const { fetchAnswer } = require('../services/query-service')
const config = require('../config')
const { schemes } = require('../domain/schemes')

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

      const messages = getMessages(request, conversationId)

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

      const responseMessage = await fetchAnswer(request, input, selectedSchemes)

      messages.push({
        role: 'system',
        ...responseMessage
      })

      setMessages(request, conversationId, messages)

      return h.view('answer', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        messages,
        commandText: 'Ask follow-on question...',
        conversationId,
        showHintText: true,
        schemesList
      })
    }
  }
]
