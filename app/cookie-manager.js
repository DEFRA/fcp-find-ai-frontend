const {
  cookie: { cookieNameCookiePolicy },
  auth
} = require('./config')

const cookieOptions = {
  isSecure: true,
  isHttpOnly: true,
  strictHeader: true,
  sameSite: 'strict'
}
function getCurrentPolicy (request, h) {
  let cookiesPolicy = request.state[cookieNameCookiePolicy]

  if (!cookiesPolicy) {
    cookiesPolicy = createDefaultPolicy(h)
  }

  return cookiesPolicy
}

function createDefaultPolicy (h) {
  const cookiesPolicy = { confirmed: false, essential: true, analytics: false }
  h.state(cookieNameCookiePolicy, cookiesPolicy, cookieOptions)

  return cookiesPolicy
}

function updatePolicy (request, h, analytics) {
  const cookiesPolicy = getCurrentPolicy(request, h)

  cookiesPolicy.analytics = analytics
  cookiesPolicy.confirmed = true

  h.state(cookieNameCookiePolicy, cookiesPolicy, cookieOptions)

  if (!analytics) {
    removeAnalytics(request, h)
  }
}

function updateAuth (request, h, authenticated) {
  const cookiesPolicy = getCurrentPolicy(request, h)

  cookiesPolicy.auth = authenticated ? auth.authVerification : ''

  h.state(cookieNameCookiePolicy, cookiesPolicy, cookieOptions)
}

function isAuthenticated (request, h) {
  const cookiesPolicy = getCurrentPolicy(request, h)

  if (cookiesPolicy.auth === auth.authVerification) {
    return true
  }

  return false
}

function removeAnalytics (request, h) {
  const googleCookiesRegex = /^_ga$|^_gid$|^_ga_.*$|^_gat_.*$/g
  Object.keys(request.state).forEach((cookieName) => {
    if (cookieName.search(googleCookiesRegex) === 0) {
      h.unstate(cookieName)
    }
  })
}

module.exports = {
  getCurrentPolicy,
  updatePolicy,
  updateAuth,
  isAuthenticated
}
