const config = require('../config')
const { getLogger } = require('../lib/logger')

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    logRequestComplete: false,
    level: config.logLevel,
    instance: getLogger()
  }
}
