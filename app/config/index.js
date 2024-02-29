require('dotenv').config()

const config = {
  envTest: process.env.ENVTEST,
  fundingFarmingApiUri: process.env.FARMING_FUNDING_API_URI,
  fundingFarmingApiKey: process.env.FARMING_FUNDING_API_KEY,
  appInsightsKey: process.env.APPINSIGHTS_CONNECTIONSTRING
}

module.exports = config
