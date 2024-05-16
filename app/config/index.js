if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config()
}

const config = {
  env: process.env.NODE_ENV,

  fundingFarmingApiUri: process.env.FARMING_FUNDING_API_URI,
  fundingFarmingApiKey: process.env.FARMING_FUNDING_API_KEY,
  appInsightsKey: process.env.APPINSIGHTS_CONNECTIONSTRING,

  version: '0.1.24',

  logLevel: process.env.LOG_LEVEL || 'error',

  auth: {
    authUser: process.env.AUTH_USER,
    authPassword: process.env.AUTH_PASSWORD,
    authVerification: process.env.AUTH_VERIFICATION
  },

  cookie: {
    cookieNameCookiePolicy: 'ffa_cookie_policy',
    cookieNameAuth: 'ffa_auth',
    cookieNameSession: 'ffa_session',
    useRedis: process.env.NODE_ENV === 'production',
    isSameSite: 'Strict',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD,
    ttl: Number(process.env.COOKIE_TTL) || 8640000
  },

  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Strict',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  },

  redis: {
    host: process.env.REDIS_HOST || '',
    password: process.env.REDIS_PASSWORD || '',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : '',
    tls: process.env.NODE_ENV === 'production' ? {} : undefined
  }
}

module.exports = config
