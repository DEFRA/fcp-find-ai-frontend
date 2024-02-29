const config = require('../config')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: (request, h) => {
      let validationError = false

      if (request.query?.error === 'validation') {
        validationError = true
      }

      return h.view('home', {
        envTest: config.envTest,
        fundingFarmingApiUri: config.fundingFarmingApiUri,
        appInsightsKey: config.appInsightsKey,
        validationError
      })
    }
  }
}
