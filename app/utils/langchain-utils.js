const { HumanMessage, AIMessage } = require('@langchain/core/messages')

const getChatHistory = (messages) => {
  if (!messages || messages.length === 0) {
    return []
  }

  const history = messages.map((message) => {
    if (message.role === 'user') {
      return new HumanMessage(message.answer)
    }

    return new AIMessage(message.answer)
  })

  return history
}

module.exports = {
  getChatHistory
}
