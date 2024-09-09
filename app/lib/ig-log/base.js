const Wreck = require('@hapi/wreck')

const getOptions = (headers) => ({
  headers: {
    ...headers
  },
  json: true
})

const get = async (url, json = true) => {
  const options = {
    ...getOptions(),
    json
  }

  const { payload } = await Wreck.get(url, options)

  return payload
}

const post = async (url, data, headers) => {
  const options = {
    ...getOptions(headers),
    payload: data
  }

  const { payload } = await Wreck.post(url, options)

  return payload
}

const put = async (url, data) => {
  const options = {
    ...getOptions(),
    payload: data
  }

  const { payload } = await Wreck.put(url, options)

  return payload
}

module.exports = {
  get,
  post,
  put
}
