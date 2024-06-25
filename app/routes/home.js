const { isAuthenticated } = require('../cookie-manager')
const Uuid = require('uuid')
const { schemes } = require('../domain/schemes')
const { trackLandingPageView } = require('../lib/events')

module.exports = {
  method: ['GET', 'POST'],
  path: '/',
  handler: async (request, h) => {
    if (!isAuthenticated(request, h)) {
      request.logger.debug('Redirecting user to auth page')

      return h.redirect('/login')
    }

    let validationError = false

    const conversationId = Uuid.v4()

    trackLandingPageView(conversationId)

    const input = request.payload?.input
    const selectedSchemes = [].concat(request.payload?.scheme || [])
    const schemesList = [...schemes].map((scheme) => {
      return {
        ...scheme,
        isSelected: selectedSchemes.includes(scheme.key)
      }
    })

    if (!input || input?.trim() === '') {
      if (input?.trim() === '') {
        validationError = true
      }

      return h.view('home', {
        validationError,
        commandText: 'Ask a question...',
        showHintText: true,
        conversationId,
        schemesList
      })
    }
  }
}
