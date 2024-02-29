const axios = require('axios')
const config = require('../config')

module.exports = {
  method: 'POST',
  path: '/answer',
  options: {
    handler: async (request, h) => {
      const url = `${config.fundingFarmingApiUri}/answer_query`
      const input = request.payload.input

      if (!input) {
        return h.redirect('/?error=validation')
      }

      try {
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

        return h.view('answer', {
          messages
        })
      } catch (error) {
        console.error(error)
        throw error
      }
    }
  }
}
