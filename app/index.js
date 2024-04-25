require('./insights').setup()
const createServer = require('./server')

const init = async () => {
  const server = await createServer()
  await server.start()
  console.log('Server running on %s', server.info.uri)
}

init().catch((err) => {
  console.error(err)
  process.exit(1)
})
