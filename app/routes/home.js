const config = require('../config')

module.exports = {
  method: 'GET',
  path: '/',
  options: {
    handler: (request, h) => {
      return h.view('home', {
        envTest: config.envTest,
        fundingFarmingApiUri: config.fundingFarmingApiUri
      })
    }
  }
}
