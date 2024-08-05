const { trackHallucinatedLinkInResponse } = require('../lib/events')
const { extractLinksForValidatingResponse } = require('./langchain-utils')

const validateResponseLinks = (response, query) => {
  const trackIssueAndBreak = (errorMessage) => {
    trackHallucinatedLinkInResponse({
      errorMessage,
      failedObject: response,
      requestQuery: query
    })
    return false
  }

  try {
    if (!response.answer || !response.context) {
      return trackIssueAndBreak('validateResponseLinks failed because response object does not contain answer or context fields')
    }

    if (typeof response === 'string') {
      response = JSON.parse(response)
    }

    const responseEntriesAndLinks = extractLinksForValidatingResponse(response.answer)
    const trueEntriesAndLinks = extractLinksForValidatingResponse(response.context)

    if (trueEntriesAndLinks === undefined || trueEntriesAndLinks.length === 0) {
      return trackIssueAndBreak('validateResponseLinks failed because no links detected in true context object')
    }

    if (!responseEntriesAndLinks && !trueEntriesAndLinks) {
      return trackIssueAndBreak('validateResponseLinks failed because hallucinated links detected in response objects')
    }

    if (responseEntriesAndLinks !== undefined && responseEntriesAndLinks.length !== 0 && trueEntriesAndLinks !== undefined && trueEntriesAndLinks.length === 0) {
      return trackIssueAndBreak('validateResponseLinks failed because hallucinated links detected in response objects')
    }

    const trueMatches = trueEntriesAndLinks.map(entry => entry.matches).flat()
    const responseMatches = responseEntriesAndLinks.map(entry => entry.matches).flat()

    const invalidLinks = responseMatches.filter(link => !trueMatches.some(trueLink => trueLink === link || trueLink.includes(link)))

    if (invalidLinks !== undefined && invalidLinks.length > 0) {
      return trackIssueAndBreak('validateResponseLinks failed because invalid links detected in response objects')
    }
  } catch {
    return trackIssueAndBreak('validateResponseLinks failed')
  }

  return true
}

module.exports = {
  validateResponseLinks
}
