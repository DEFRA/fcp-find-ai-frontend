const config = require('../config')

const localVars = [
  {
    key: 'version',
    value: config.version
  },
  {
    key: 'googleTagManagerKey',
    value: config.googleAnalytics.key
  }
]

module.exports = {
  plugin: {
    name: 'locals',
    register: (server, _) => {
      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode
        if (
          request.response.variety === 'view' &&
          statusCode !== 404 &&
          statusCode !== 500 &&
          request.response.source.manager._context
        ) {
          for (const localVar of localVars) {
            request.response.source.manager._context[localVar.key] = localVar.value
          }
        }

        return h.continue
      })
    }
  }
}
