const nlp = require('compromise/three')
const { AsyncRedactor } = require('cognosys-redact-pii')

const redactor = new AsyncRedactor({
  customRedactors: {
    before: [
      {
        regexpPattern: /\b([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})\b/gmi,
        replaceWith: 'POSTCODE'
      },
      {
        regexpPattern: /\b[0-9]{5}\s?[0-9]{5,6}\b/gmi,
        replaceWith: 'PHONE_NUMBER'
      }
    ]
  }
})

const firstPassRedaction = async (query) => {
  return await redactor.redactAsync(query)
}

const redactPlaceNames = (queryString) => {
  let processedString = queryString
  // Parse the text
  const doc = nlp(processedString)

  // Find places
  let places = doc.places().out('array')

  // Remove trailing periods from place names
  places = places.map(place => place.replace(/\.$/, ''))

  // Replace each place with "PLACE_NAME" in the original text
  places.forEach(place => {
    const placeRegex = new RegExp(`\\b${place}\\b`, 'g')
    processedString = processedString.replace(placeRegex, 'PLACE_NAME')
  })

  return processedString
}

/**
 * Removes PII from a string
 * @param {string} textString
 * @returns {Promise<string>}
 */
const redact = async (textString) => {
  const redactedText = await firstPassRedaction(textString)
  const fullyRedactedQuery = redactPlaceNames(redactedText)

  return fullyRedactedQuery
}

module.exports = {
  redact
}
