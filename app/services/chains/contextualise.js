const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts')
const { RunnableMap } = require('@langchain/core/runnables')
const { StringOutputParser } = require('@langchain/core/output_parsers')

const prompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder('chat_history'),
  ['user', '{input}'],
  [
    'user',
    'Given the above conversation, generate a search query to look up in order to get information relevant to the conversation'
  ]
])

const buildContextHistoryChain = (model) => {
  const chain = RunnableMap.from({
    query: async (input) => {
      if (!input.chat_history.length) {
        return input.input
      }

      const chain = prompt
        .pipe(model)
        .pipe(new StringOutputParser())

      return chain.invoke({
        chat_history: input.chat_history,
        input: input.input
      })
    },
    chat_history: (input) => input.chat_history,
    input: (input) => input.input
  })
  
  return chain
}

module.exports = {
  buildContextHistoryChain
}
