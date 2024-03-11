require('dotenv').config()

const config = {
  fundingFarmingApiUri: process.env.FARMING_FUNDING_API_URI,
  fundingFarmingApiKey: process.env.FARMING_FUNDING_API_KEY,
  appInsightsKey: process.env.APPINSIGHTS_CONNECTIONSTRING,

  auth: {
    authUser: process.env.AUTH_USER,
    authPassword: process.env.AUTH_PASSWORD,
    authVerification: process.env.AUTH_VERIFICATION
  },

  cookie: {
    cookieNameCookiePolicy: 'ffa_cookie_policy',
    cookieNameAuth: 'ffa_auth',
    cookieNameSession: 'ffa_session',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  },
  cookiePolicy: {
    clearInvalid: false,
    encoding: 'base64json',
    isSameSite: 'Lax',
    isSecure: process.env.NODE_ENV === 'production',
    password: process.env.COOKIE_PASSWORD
  }
}

module.exports = config
