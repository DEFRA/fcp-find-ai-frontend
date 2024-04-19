const { resetMessages } = require('../cookie-manager')

module.exports = {
  method: ['POST'],
  path: '/reset',
  handler: async (request, h) => {
    resetMessages(request, h)

    return h.redirect('/')
  }
}
