module.exports = {
  method: 'GET',
  path: '/error',
  handler: (request, h) => {
    throw new Error('Thrown custom error')
  }
}
