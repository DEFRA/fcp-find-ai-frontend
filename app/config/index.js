require('dotenv').config()

const config = {
  envTest: process.env.ENVTEST,
  fundingFarmingApiUri: process.env.FARMING_FUNDING_API_URI
}

module.exports = config
