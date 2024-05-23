const { setMessages } = require('../session/messages')

module.exports = {
  method: ['POST'],
  path: '/reset/{conversationId}',
  handler: async (request, h) => {
    const conversationId = request.params.conversationId
    setMessages(request, conversationId, [])

    return h.redirect('/')
  }
}
