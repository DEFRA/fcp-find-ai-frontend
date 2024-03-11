module.exports = {
  plugin: {
    name: 'header',
    register: (server, options) => {
      server.ext('onPreResponse', (request, h) => {
        const statusCode = request.response.statusCode

        if (statusCode !== 404 && statusCode !== 500 && statusCode !== 403) {
          try {
            const response = request.response

            options?.keys?.forEach((x) => {
              response.header(x.key, x.value)
            })
          } catch (error) {
            console.error(error)
          }
        }

        return h.continue
      })
    }
  }
}
