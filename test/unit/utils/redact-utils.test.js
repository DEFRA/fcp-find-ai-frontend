const { redact } = require('../../../app/utils/redact-utils')

describe('redact utils', () => {
  describe('redact', () => {
    test('redacts PII', async () => {
      const queryWithPii = 'Hi david johnson, My postcode is SA1 7AE, and my phone number is 07882 018326. I live at Cronkinson Farm. jsmith@yahoo.com. My home address is 12 Wellington Road'
      const sanitisedQuery = 'Hi PERSON_NAME, My postcode is POSTCODE, and my phone number is PHONE_NUMBER. I live at PLACE_NAME. EMAIL_ADDRESS. My home address is STREET_ADDRESS'

      const result = await redact(queryWithPii)

      expect(result).toBe(sanitisedQuery)
    })

    test('redacts PII - 2', async () => {
      const queryWithPii = 'What grants are available for my property in Manchester that has lots of grassland? I am looking to improve biodiversity'
      const sanitisedQuery = 'What grants are available for my property in PERSON_NAME that has lots of grassland? I am looking to improve biodiversity'

      const result = await redact(queryWithPii)

      expect(result).toBe(sanitisedQuery)
    })
  })
})
