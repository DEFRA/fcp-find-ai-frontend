const axios = require('axios')
const { isAuthenticated, addMessage, getMessages } = require('../cookie-manager')

const config = require('../config')

module.exports = {
  method: ['GET', 'POST'],
  path: '/',
  handler: async (request, h) => {
    if (!isAuthenticated(request, h)) {
      request.logger.debug('Redirecting user to auth page')

      return h.redirect('/login')
    }

    let validationError = false

    const input = request.payload?.input
    const selectedSchemes = [].concat(request.payload?.scheme || [])

    if (!input || input?.trim() === '') {
      if (input?.trim() === '') {
        validationError = true
      }

      return h.view('home', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        commandText: 'Ask a question...',
        showHintText: true,
        csSelected: selectedSchemes.includes('CS'),
        fetfSelected: selectedSchemes.includes('FETF'),
        sigSelected: selectedSchemes.includes('SIG'),
        sfiSelected: selectedSchemes.includes('SFI')
      })
    }

    try {
      const url = `${config.fundingFarmingApiUri}/answer_query`

      request.logger.info(`Performing POST request: ${url}`)
      const axiosConfig = {
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': config.fundingFarmingApiKey
        }
      }

      const response = await axios.post(
        url,
        {
          input,
          selected_schemes: selectedSchemes
        },
        axiosConfig
      )

      const messages = []

      const previousMessages = getMessages(request, h)

      const historyMessages = previousMessages.map((previousMessage) => ({
        role: previousMessage.role,
        answer: previousMessage.content
      }))

      messages.push(...historyMessages)

      messages.push({
        role: 'user',
        answer: input,
        is_latest: historyMessages?.length > 0
      })
      messages.push(response.data)

      addMessage(request, h, {
        role: 'user',
        content: input
      })
      addMessage(request, h, {
        role: 'system',
        content: response.data.answer
      })

      return h.view('answer', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        messages,
        input,
        commandText: 'Ask follow-on question...',
        showHintText: true,
        csSelected: selectedSchemes.includes('CS'),
        fetfSelected: selectedSchemes.includes('FETF'),
        sigSelected: selectedSchemes.includes('SIG'),
        sfiSelected: selectedSchemes.includes('SFI')
      })
    } catch (error) {
      request.logger.error(error)
      throw error
    }
  }
}
