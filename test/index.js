const test = require('tape')
const axios = require('axios')

const createServer = require('../server')

test('check npm repo', async t => {
  t.plan(1);

  const server = createServer().start()
  const result = await axios('http://localhost:8001/v1/npm/mongo-sql')
  await server.stop()

  t.equal(result.data, 1)
})
