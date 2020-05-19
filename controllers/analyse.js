const writeResponse = require('write-response');
const analyseNpm = require('../analyseNpm')

module.exports = appConfig => function (request, response, params) {
  analyseNpm('mongo-sql', function (error, ...args) {
    args.forEach(arg => {
      if (!arg) {
        return;
      }
      console.log('--------------------------------------')
      console.log(arg.stdout)

      if (arg.stderr) {
        console.log('\nError:')
        console.log(arg.stderr)
      }
      console.log('--------------------------------------')
    })
    writeResponse(200, args, response)
  })
}
