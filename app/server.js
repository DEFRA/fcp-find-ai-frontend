const Hapi = require('@hapi/hapi')

async function createServer () {
  const server = Hapi.server({
    port: process.env.PORT
  })

  // Register the plugins
  await server.register(require('@hapi/inert'))
  await server.register(require('@hapi/cookie'))
  await server.register(require('./plugins/logging'))
  await server.register(require('./plugins/views'))
  await server.register(require('./plugins/router'))
  await server.register(require('./plugins/cookies'))
  await server.register(require('./plugins/error-pages'))
  await server.register(require('./plugins/locals'))
  await server.register({
    plugin: require('./plugins/header'),
    options: {
      keys: [
        { key: 'X-Frame-Options', value: 'deny' },
        // { key: 'Access-Control-Allow-Origin', value: config.serviceUri },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000;' },
        { key: 'Cache-Control', value: 'private' },
        { key: 'Referrer-Policy', value: 'no-referrer' }
        // {
        //   key: 'Content-Security-Policy',
        //   value: getSecurityPolicy()
        // }
      ]
    }
  })

  return server
}

module.exports = createServer
