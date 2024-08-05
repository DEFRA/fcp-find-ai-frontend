const { set, get } = require('./index')

const messagesKey = 'messages'

/**
 * Store messages to session using conversationId as key
 * @param {*} req
 * @param {string} conversationId
 * @param {{role: string, answer: string}[]} messages
 */
const setMessages = (req, conversationId, messages) => {
  set(req, messagesKey, conversationId, messages)
}

/**
 * Get chat messages from session by conversationId
 * @param {*} req
 * @param {string} conversationId
 * @returns {{role: string, answer: string}[]}
 */
const getMessages = (req, conversationId) => {
  const value = get(req, messagesKey, conversationId)

  return value
}

module.exports = {
  setMessages,
  getMessages
}
