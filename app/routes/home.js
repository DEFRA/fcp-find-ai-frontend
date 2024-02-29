const axios = require('axios')
const config = require('../config')

module.exports = {
  method: ['GET', 'POST'],
  path: '/',
  options: {
    handler: async (request, h) => {
      console.log('Loaded home')
      let validationError = false

      if (request.query?.error === 'validation') {
        validationError = true
      }

      const input = request.payload?.input

      if (!input) {
        return h.view('home', {
          envTest: config.envTest,
          fundingFarmingApiUri: config.fundingFarmingApiUri,
          appInsightsKey: config.appInsightsKey,
          validationError
        })
      }

      try {
        const url = `${config.fundingFarmingApiUri}/answer_query`

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
            input
          },
          axiosConfig
        )

        const messages = [response.data]

        return h.view('home', {
          envTest: config.envTest,
          fundingFarmingApiUri: config.fundingFarmingApiUri,
          appInsightsKey: config.appInsightsKey,
          validationError,
          messages
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
}
