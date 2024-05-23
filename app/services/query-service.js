const axios = require('axios')
const config = require('../config')

const fetchAnswer = async (req, input, selectedSchemes) => {
  const url = `${config.fundingFarmingApiUri}/answer_query`

  req.logger.info(`Performing POST request: ${url}`)
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

  return response.data
}

module.exports = {
  fetchAnswer
}
