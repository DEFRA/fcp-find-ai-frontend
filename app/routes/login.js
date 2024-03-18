const config = require('../config')
const cookieManager = require('../cookie-manager')

module.exports = {
  method: ['GET', 'POST'],
  path: '/login',
  options: {
    handler: async (request, h) => {
      if (!request.payload?.password || !request.payload?.username) {
        return h.view('login', {})
      }

      const username = request.payload.username
      const password = request.payload.password

      if (username !== config.auth.authUser || password !== config.auth.authPassword) {
        cookieManager.updateAuth(request, h, false)

        return h.view('login', {
          error: 'incorrect username/password'
        })
      }

      cookieManager.updateAuth(request, h, true)

      return h.redirect('/')
    }
  }
}
