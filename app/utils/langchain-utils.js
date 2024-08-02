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
 *
 * @param {Object} response - The response object to validate and format.
 * @param {Object} response.response - The actual response data.
 * @param {Boolean} response.valid - A flag indicating whether the response is valid.
 * @param {Array} [response.items] - An array of items related to the response.
 * @returns {Object} - The formatted response object.
 *   - If valid, returns the response with an added [`answer`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22external%22%3A%22file%3A%2F%2F%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22path%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A133%2C%22character%22%3A8%7D%5D "app/utils/langchain-utils.js") property.
 *   - If not valid, returns an object with [`answer`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22external%22%3A%22file%3A%2F%2F%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22path%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A133%2C%22character%22%3A8%7D%5D "app/utils/langchain-utils.js") and [`items`](command:_github.copilot.openSymbolFromReferences?%5B%7B%22%24mid%22%3A1%2C%22fsPath%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22external%22%3A%22file%3A%2F%2F%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22path%22%3A%22%2FUsers%2Fstanislavhuseletov%2FDocuments%2Fwork%2Ffcp-find-ai-frontend%2Fapp%2Futils%2Flangchain-utils.js%22%2C%22scheme%22%3A%22file%22%7D%2C%7B%22line%22%3A135%2C%22character%22%3A10%7D%5D "app/utils/langchain-utils.js") properties.
 *   - If an error occurs, returns the original response.
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
