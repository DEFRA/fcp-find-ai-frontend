const { fetchAnswer } = require('../services/query-service')
const { parseMessage } = require('../utils/langchain-utils')
const { logger } = require('../lib/logger')
const config = require('../config')

module.exports = [
  {
    method: 'GET',
    path: '/test_prompts',
    handler: async (request, h) => {
      if (config.endpointTestingEnabled !== true) {
        return h.response().code(404)
      }

      logger.info('Testing prompts')

      const inputs = [
        'Give me grants for deer fencing',
        'Give me grants to increase biodiversity',
        'Give me grants for planting flowers',
        "What's the price for FG10",
        'what land types does AB1 apply to',
        'funding for slurry'
      ]

      const processInput = async (input, index) => {
        let response, parseResponse
        let passedValidation = false
        const startTime = new Date()

        try {
          try {
            response = await fetchAnswer(request, input, [])
            parseResponse = parseMessage(request, response)
            passedValidation = parseResponse !== undefined
          } catch (error) {
            logger.info(`Response ${index + 1} out of ${inputs.length} failed validation or fetch with error:`, error)
          }

          const endTime = new Date()
          const responseDuration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)
          const responseLength = response && passedValidation ? parseResponse.answer.split(' ').length : response.split(' ').length

          logger.info(`Response ${index + 1} out of ${inputs.length} generated in ${responseDuration} seconds`)

          return {
            question: input,
            answer: passedValidation ? JSON.parse(response) : response,
            responseDuration,
            responseLength,
            passedValidation
          }
        } catch (error) {
          const endTime = new Date()
          const responseDuration = ((endTime.getTime() - startTime.getTime()) / 1000).toFixed(2)
          const responseLength = response ? response.split(' ').length : 0
          return {
            question: input,
            answer: response,
            responseDuration,
            responseLength,
            passedValidation: false
          }
        }
      }

      const responses = await Promise.all(inputs.map(async (input, index) =>
        await processInput(input, index)
      ))

      return h.view('test_prompts_response', {
        responses
      })
    }
  }
]
