const { post } = require('./base')
const { igLogApi } = require('../../config')

const baseUrl = igLogApi.baseUrl

const sendIgLog = async (session) => {
  return post(`${baseUrl}/sessions`, session)
}

module.exports = {
  sendIgLog
}
