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

const parseMessage = (req, message) => {
  try {
    return JSON.parse(message)
  } catch (error) {
    req.logger.error('Failed to parse response message', {
      message
    })

    throw error
  }
}

const extractLinksForValidatingResponse = (jsonObj) => {
  const entries = []

  try {
    // Function to check URLs and gather entries with valid URLs
    const checkUrls = (obj, parent) => {
      if (typeof obj === 'object' && obj !== null) {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            checkUrls(obj[key], parent || obj)
          }
        }
      } else if (typeof obj === 'string' && obj.includes('http')) {
        entries.push({ entry: parent, link: obj })
      }
    }

    checkUrls(jsonObj, null)
  } catch {
    return []
  }

  const urlRegex = /https?:\/\/[^\s|)]+/g

  const entriesAndLinks = entries.map((entryObj) => {
    const matches = entryObj.link.match(urlRegex).filter((value, index, self) => self.indexOf(value) === index)
    return {
      matches,
      entry: entryObj.entry
    }
  })

  return entriesAndLinks
}

module.exports = {
  getChatHistory,
  parseMessage,
  extractLinksForValidatingResponse
}
