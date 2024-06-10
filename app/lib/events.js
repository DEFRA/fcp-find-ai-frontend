const { logEvent } = require('../insights')

const Event = {
  USER_MESSAGE: 'EVENT_USER_MESSAGE',
  SYSTEM_MESSAGE: 'EVENT_SYSTEM_MESSAGE',
  LANDING_PAGE_VIEW: 'EVENT_LANDING_PAGE_VIEW',
  CONVERSATION_PAGE_VIEW: 'EVENT_CONVERSATION_PAGE_VIEW'
}

/**
 * Track message
 * @param {{message: string, conversationId: string}} eventProps
 */
const trackMessage = (eventProps) => {
  logEvent(Event.USER_MESSAGE, eventProps)
}

/**
 * Track system message
 * @param {{message: string, conversationId: string}} eventProps
 */
const trackSystemMessage = (eventProps) => {
  logEvent(Event.SYSTEM_MESSAGE, eventProps)
}

const trackLandingPageView = (conversationId) => {
  logEvent(Event.LANDING_PAGE_VIEW, { time: new Date(), conversationId })
}

const trackConversationPageView = (conversationId) => {
  logEvent(Event.CONVERSATION_PAGE_VIEW, { time: new Date(), conversationId })
}

module.exports = {
  Event,
  trackMessage,
  trackSystemMessage,
  trackLandingPageView,
  trackConversationPageView
}
