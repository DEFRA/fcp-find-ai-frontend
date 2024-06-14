const Hapi = require('@hapi/hapi')
const config = require('./config')
const crumb = require('@hapi/crumb')
const Uuid = require('uuid')
const { getCatbox } = require('./lib/catbox')

const getSecurityPolicy = () =>
  "default-src 'self';" +
  "object-src 'none';" +
  "script-src 'self' www.google-analytics.com *.googletagmanager.com ajax.googleapis.com *.googletagmanager.com/gtm.js 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes';" +
  "form-action 'self' *.gov.uk;" +
  "base-uri 'self';" +
  "connect-src 'self' *.google-analytics.com *.analytics.google.com *.googletagmanager.com" +
  "style-src 'self' 'unsafe-inline' tagmanager.google.com *.googleapis.com;" +
  "img-src 'self' *.google-analytics.com *.googletagmanager.com;" +
  "font-src 'self' fonts.gstatic.com;" +
  "style-src 'self' fonts.googleapis.com"

async function createServer () {
  const catbox = getCatbox()

  const server = Hapi.server({
    port: process.env.PORT,
    cache: [{
      name: 'session',
      provider: {
        constructor: catbox,
        options: config.cookie.useRedis === false || config.NODE_ENV === 'test'
          ? {}
          : {
              host: config.redis.host,
              port: config.redis.port,
              password: config.redis.password,
              partition: 'ffc-find',
              tls: config.redis.tls
            }
      }
    }]
  })

  // Session cache redis with yar
  await server.register([
    {
      plugin: require('@hapi/yar'),
      options: {
        maxCookieSize: config.useRedis ? 0 : 1024,
        storeBlank: true,
        cache: {
          cache: 'session',
          expiresIn: config.cookie.ttl
        },
        cookieOptions: {
          password: config.cookie.password,
          isSecure: config.cookie.isSecure,
          ttl: config.cookie.ttl
        },
        customSessionIDGenerator: function (request) {
          const sessionID = Uuid.v4()

          return sessionID
        }
      }
    },
    {
      plugin: crumb,
      options: {
        cookieOptions: {
          isSecure: config.cookie.isSecure
        }
      }
    }]
  )

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
        { key: 'Referrer-Policy', value: 'no-referrer' },
        {
          key: 'Content-Security-Policy',
          value: getSecurityPolicy()
        }
      ]
    }
  })

  return server
}

module.exports = createServer
