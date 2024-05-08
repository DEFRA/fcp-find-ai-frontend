module.exports = {
  plugin: {
    name: 'error-pages',
    register: (server, _) => {
      server.ext('onPreResponse', (request, h) => {
        const response = request.response

        if (response.isBoom) {
          const { payload } = response.output

          if (payload.statusCode >= 400 && payload.statusCode < 500) {
            return h.view('errors/4xx', { payload }).code(payload.statusCode)
          }

          console.error(response)
          request.logger.error(response)

          return h.view('errors/500').code(payload.statusCode)
        }

        return h.continue
      })
    }
  }
}
