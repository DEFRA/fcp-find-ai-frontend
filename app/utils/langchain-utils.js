// eslint-disable-next-line no-unused-vars
const { HumanMessage, AIMessage, BaseMessage } = require('@langchain/core/messages')

/**
 * Get Chat History for langchain
 * @param {{role: string, answer: string}[]} messages
 * @returns {BaseMessage[]}
 */
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
    req.logger.error(error, 'Failed to parse response message', {
      message
    })
    if (typeof message === 'string') {
      return {
        answer: message
      }
    }

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

  // Improved URL regex to match valid URLs and exclude unwanted strings
  const urlRegex = /\bhttps?:\/\/[^\s"')]+/g

  const entriesAndLinks = entries.map((entryObj) => {
    const matches = entryObj.link.match(urlRegex)
      .map((url) => url.replace('/api/content', '').replace(/["',]/g, ''))
      .filter((value, index, self) => self.indexOf(value) === index)
    return {
      matches,
      entry: entryObj.entry
    }
  })

  return entriesAndLinks
}

const validateJSONResponse = (response) => {
  try {
    if (response.answer === 'Unknown') {
      return {
        valid: false,
        response
      }
    }

    try {
      const items = JSON.parse(response.answer).items

      const invalidSummary =
        !items ||
        items.length === 0 ||
        items.some(
          (item) => !item.title || !item.scheme || !item.url || !item.summary
        )

      return {
        valid: !invalidSummary,
        response: {
          ...response,
          items: []
        }
      }
    } catch {
      if (typeof response.answer === 'string') {
        return {
          valid: false,
          response: {
            ...response,
            items: []
          }
        }
      }
    }

    return {
      valid: true,
      response
    }
  } catch {
    return {
      valid: false,
      response: {
        ...response,
        items: []
      }
    }
  }
}

/**
 * Validates and formats a JSON response.
 * @param {{ chat_history: [], context: [], answer: string }} response
 * @returns {{ chat_history: [], context: [], answer: string }}
 */
const returnValidatedResponse = (response) => {
  try {
    response = validateJSONResponse(response)

    if (!response.valid) {
      return {
        ...response,
        answer: JSON.stringify({
          answer: response.response.answer || 'Unknown',
          items: response.items || []
        })
      }
    }

    return {
      ...response.response,
      answer: response.response.answer
    }
  } catch {
    return response
  }
}

module.exports = {
  getChatHistory,
  parseMessage,
  extractLinksForValidatingResponse,
  returnValidatedResponse
}
