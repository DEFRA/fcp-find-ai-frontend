const { BaseCallbackHandler } = require('@langchain/core/callbacks/base')
// const IgLogClient = require('./client/ig-log-client')
const { sendIgLog } = require('./api')

class IgLogCallbackHandler extends BaseCallbackHandler {
  name = 'IgLogCallbackHandler'
  currThreadId = null

  constructor (config) {
    super()
    this.sessionId = config.sessionId
    this.user = config.user
    this.projectId = config.projectId
    this.session = {
      id: this.sessionId,
      user: this.user,
      project_id: this.projectId,
      threads: []
    }
    // this.igLog = new IgLogClient({
    //   baseUrl: config.baseUrl
    // })
  }

  async handleChainStart(chain, inputs, runId, parentRunId) {
    if (!parentRunId) {
      this.currThreadId = runId
      this.session.start_time = new Date().toISOString()
      this.session.threads.push({
        id: this.currThreadId,
        name: this.sessionId,
        start_time: new Date().toISOString(),
        input: JSON.stringify(inputs),
        output: '',
        steps: []
      })
    }
  }

  async handleChainEnd (outputs, runId, parentRunId) {
    if (!parentRunId) {
      const thread = this.findThreadById(this.currThreadId)
      if (thread) {
        thread.end_time = new Date().toISOString()
        thread.output = ''
      }
      console.log(this.session)
      await sendIgLog(this.session)
    }
  }

  async handleLLMStart(llm, prompts, runId, parentRunId, extraParams) {
    const thread = this.findThreadById(this.currThreadId)
    if (thread) {
      this.addStepToThread(thread, runId, prompts, extraParams)
    }
  }

  async handleLLMEnd (llm, runId, parentRunId) {
    const thread = this.findThreadById(this.currThreadId)
    if (thread) {
      const step = this.findStepById(thread, runId)
      if (step) {
        this.updateStepWithLLMData(step, llm)
      } else {
        console.error(`Step with id ${runId} not found in thread ${this.currThreadId}`)
      }
    } else {
      console.error(`Thread with id ${this.currThreadId} not found`)
    }
    this.session.end_time = new Date().toISOString()
  }

  findThreadById (threadId) {
    return this.session.threads.find(thread => thread.id === threadId)
  }

  findStepById (thread, stepId) {
    return thread.steps.find(step => step.id === stepId)
  }

  addStepToThread (thread, runId, prompts, extraParams) {
    thread.steps.push({
      id: runId,
      name: runId,
      type: 'llm-start',
      model_name: extraParams.invocation_params.model,
      model_metadata: extraParams.invocation_params,
      input: prompts.join(''),
      start_time: new Date().toISOString(),
      end_time: '',
      input_tokens: 0,
      output_tokens: 0
    })
  }

  updateStepWithLLMData (step, llm) {
    step.end_time = new Date().toISOString()
    step.input_tokens = llm.llmOutput.tokenUsage.promptTokens
    step.output_tokens = llm.llmOutput.tokenUsage.completionTokens
  }
}

module.exports = IgLogCallbackHandler
