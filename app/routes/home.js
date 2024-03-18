const axios = require('axios')
const { isAuthenticated } = require('../cookie-manager')

const config = require('../config')

module.exports = {
  method: ['GET', 'POST'],
  path: '/',
  handler: async (request, h) => {
    if (!isAuthenticated(request, h)) {
      return h.redirect('/login')
    }

    let validationError = false

    const input = request.payload?.input

    if (!input || input?.trim() === '') {
      if (input?.trim() === '') {
        validationError = true
      }

      return h.view('home', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        commandText: 'Start search...'
      })
    }

    try {
      const url = `${config.fundingFarmingApiUri}/answer_query`
      console.log(request.payload)
      const selectedSchemes = [].concat(request.payload.scheme || [])

      console.log(`Performing POST request: ${url}`)
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
          'selected_schemes': selectedSchemes,
        },
        axiosConfig
      )

      const messages = [response.data]

      return h.view('answer', {
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        validationError,
        messages,
        input,
        commandText: 'Follow-on search...'
      })
    } catch (error) {
      console.error(error)
      throw error
    }
  }
}
