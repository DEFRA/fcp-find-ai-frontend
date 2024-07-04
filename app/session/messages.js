const { set, get } = require('./index')

const messagesKey = 'messages'

const setMessages = (req, conversationId, messages) => {
  set(req, messagesKey, conversationId, messages)
}

const getMessages = (req, conversationId) => {
  const value = get(req, messagesKey, conversationId)

  return value
}

module.exports = {
  setMessages,
  getMessages
}
