const appInsights = require('applicationinsights')
const config = require('./config')

const setup = () => {
  if (process.env.APPINSIGHTS_CONNECTIONSTRING) {
    appInsights
      .setup(process.env.APPINSIGHTS_CONNECTIONSTRING)
      .start()

    const cloudRoleTag = appInsights.defaultClient.context.keys.cloudRole
    const appName = process.env.APPINSIGHTS_CLOUDROLE
    appInsights.defaultClient.context.tags[cloudRoleTag] = appName

    appInsights.defaultClient.addTelemetryProcessor((envelope, contextObject) => {
      if (envelope?.data?.baseType === 'RequestData' &&
        (envelope?.data?.baseData?.name === 'GET /healthy' || envelope?.data?.baseData?.name === 'GET /healthz') &&
        envelope?.data?.baseData?.responseCode === '200') {
        return false
      }

      return true
    })

    return appInsights
  } else {
    console.log('App Insights not running')
  }
}

process.on('unhandledRejection', (err) => {
  console.error(err)
  logException(err, null)
  process.exit(1)
})

const logException = (error, request) => {
  try {
    const client = appInsights.defaultClient

    if (client) {
      // Remove PII
      delete request.headers.cookie

      client?.trackException({
        exception: error,
        properties: {
          statusCode: request ? request.statusCode : '',
          sessionId: request ? request.yar?.id : '',
          payload: request ? request.payload : '',
          request: request ?? 'Server Error'
        }
      })
    }
  } catch (err) {
    console.error(err, 'App Insights')
  }
}

const logTrace = ({ message, severity }, request) => {
  try {
    const client = appInsights.defaultClient

    if (client) {
      client.trackTrace({
        message,
        severity
      })
    }
  } catch (error) {
    console.error(error, 'App Insights logTrace failed')
  }
}

const logEvent = (eventName, props) => {
  try {
    if (config.logLevel === 'debug') {
      console.debug({ name: eventName, properties: props })
    }

    const client = appInsights.defaultClient

    if (client) {
      client.trackEvent({ name: eventName, properties: props })
    }
  } catch (error) {
    console.error(error, 'App Insights logEvent failed')
  }
}

module.exports = { setup, logTrace, logException, logEvent, getCorrelationContext: appInsights.getCorrelationContext }
