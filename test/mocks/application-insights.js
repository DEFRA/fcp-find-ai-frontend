const mockDefaultClient = {
  context: {
    keys: {
      cloudRole: ''
    },
    tags: {}
  },
  addTelemetryProcessor: jest.fn()
}

const mockStart = jest.fn()
const mockSetup = jest.fn(() => {
  return {
    start: mockStart
  }
})

const mockApplicationInsights = {
  defaultClient: mockDefaultClient,
  setup: mockSetup
}

jest.mock('applicationinsights', () => {
  return mockApplicationInsights
})

module.exports = mockApplicationInsights
