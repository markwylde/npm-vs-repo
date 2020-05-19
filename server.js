const packageJson = require('./package.json')

const http = require('http');
const defaultConfig = require('./config');

const createRouter = require('find-my-way');

function createServer (configOverrides = {}) {
  const config = {
    ...defaultConfig,
    ...configOverrides
  };

  const router = createRouter();
  router.on('GET', '/v1/npm/:repo', require('./controllers/analyse.js')(config));

  let server;
  function start () {
    server = http.createServer((req, res) => {
      router.lookup(req, res);
    }).listen(config.port);

    console.log(`[${packageJson.name}] Listening on port ${config.port}`);

    return { start, stop };
  }

  function stop () {
    console.log(`[${packageJson.name}] Shutting down`);
    server && server.close();
  }

  return { start, stop };
}

module.exports = createServer;