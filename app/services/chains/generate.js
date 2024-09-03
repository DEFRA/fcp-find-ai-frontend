const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables')
const { formatDocumentsAsString } = require('langchain/util/document')
const { StringOutputParser } = require('@langchain/core/output_parsers')

const { getPrompt } = require('../../domain/prompt')

const prompt = ChatPromptTemplate.fromMessages([
  ['system', getPrompt(false)],
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}']
])

const buildGenerateChain = (model, contextChain, retreiver) => {
  const retrieveChain = RunnableSequence.from([
    contextChain,
    {
      context: async (input) => {
        const documents = await retreiver.invoke(input.query)

        return documents
      },
      chat_history: (input) => input.chat_history,
      input: (input) => input.input
    }
  ])

  const generateChain = RunnableSequence.from([
    RunnablePassthrough.assign({
      context: (input) => formatDocumentsAsString(input.context)
    }),
    prompt,
    model,
    new StringOutputParser()
  ])

  const full = retrieveChain.assign( { generated: generateChain })

  return full.pick(['context', 'generated'])
}

module.exports = {
  buildGenerateChain
}
