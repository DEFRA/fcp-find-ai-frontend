require('./insights').setup()
const Hapi = require('@hapi/hapi')
async function createServer () {
  const server = Hapi.server({
    port: process.env.PORT
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/error-pages'))

  return server
}
module.exports = createServer
