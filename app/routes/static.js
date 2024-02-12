module.exports = [{
  method: 'GET',
  path: '/assets/{path*}',
  options: {
    auth: false,
    handler: {
      directory: {
        path: [
          'node_modules/govuk-frontend/govuk/assets'
        ]
      }
    },
    cache: {
      privacy: 'private'
    }
  }
}, {
  method: 'GET',
  path: '/static/{path*}',
  options: {
    auth: false,
    handler: {
      directory: {
        path: [
          'app/dist',
          'node_modules/govuk-frontend/govuk/assets'
        ]
      }
    },
    cache: {
      privacy: 'private'
    }
  }
}]
