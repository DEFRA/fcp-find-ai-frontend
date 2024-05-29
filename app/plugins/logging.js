const config = require('../config')
const { logger } = require('../lib/logger')

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    logRequestComplete: false,
    level: config.logLevel,
    instance: logger
  }
}
