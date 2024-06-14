const { fetchAnswer } = require('../../../app/services/query-service')
const { createRetrievalChain } = require('langchain/chains/retrieval')
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents')
const { ChatPromptTemplate } = require('@langchain/core/prompts')

jest.mock('@langchain/openai')
jest.mock('@langchain/core/prompts')
jest.mock('langchain/chains/combine_documents')
jest.mock('langchain/chains/retrieval')
jest.mock('langchain/chains/history_aware_retriever')
jest.mock('../../../app/lib/azure-vector-store')

describe('query-service', () => {
  describe('fetchAnswer', () => {
    test('perform langchain call', async () => {
      createRetrievalChain.mockResolvedValue(({
        invoke: jest.fn().mockResolvedValue({
          answer: JSON.stringify({ answer: 'generated response', items: [] })
        })
      }))

      const prompt = jest.fn()
      const input = 'deer fencing'
      ChatPromptTemplate.fromMessages.mockReturnValue(prompt)

      const response = await fetchAnswer({}, input)

      expect(JSON.parse(response).answer).toStrictEqual('generated response')
      expect(createStuffDocumentsChain)
        .toHaveBeenCalledWith(expect.objectContaining({ prompt }))
    })
  })
})
