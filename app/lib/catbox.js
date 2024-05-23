const config = require('../config')

const getCatbox = () => {
  if (config.env === 'test' || !config.cookie.useRedis) {
    return require('@hapi/catbox-memory')
  }

  return require('@hapi/catbox-redis')
}

module.exports = {
  getCatbox
}
