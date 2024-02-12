const staticRoute = require('../../../app/routes/static')

describe('Routes tests', () => {
  test('GET assets', async () => {
    expect(staticRoute).toBeDefined()
  })
})
