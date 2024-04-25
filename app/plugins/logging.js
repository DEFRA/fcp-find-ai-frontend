const config = require('../config')
const appInsightsTransport = require('../lib/insights-transport')

const pino = require('pino')

const logger = config.env === 'production' ? pino({}, appInsightsTransport()) : pino()

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    logPayload: true,
    level: 'debug',
    instance: logger
  }
}
