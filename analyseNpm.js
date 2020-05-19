const { spawn } = require('child_process');

const fs = require('fs');
const {uuid} = require('uuidv4');

const righto = require('righto');

function execute (command, args, options, callback) {
  if (arguments.length === 3) {
    callback = options
    options = {}
  }

  let stdout = Buffer.from([]);
  let stderr = Buffer.from([]);

  const runner = spawn(command, args, options);

  runner.stdout.on('data', (data) => {
    stdout = Buffer.concat([stdout, data]);
  });

  runner.stderr.on('data', (data) => {
    stderr = Buffer.concat([stderr, data]);
  });

  runner.on('exit', (errorCode) => {
    const response = {
      errorCode,
      stdout: stdout.toString(),
      stderr: stderr.toString()
    }

    if (errorCode !== 0) {
      return callback(response);
    }

    callback(null, response);
  });
}

function analyseNpm (npmRepo, callback) {
  const tarballUrl = righto(
    execute,
    'npm', ['view', npmRepo, 'dist.tarball']
  ).get(result => result.stdout.trim())

  const uniq = uuid();

  const downloadedTarball = righto(execute,
    'wget', righto.resolve(['-O', `/tmp/${uniq}.tgz`, tarballUrl]))

  const madeUntarDirectory = righto(fs.mkdir, `/tmp/${uniq}`)

  const expandedTarball = righto(execute,
    'tar', righto.resolve(['xvf', `/tmp/${uniq}.tgz`, '-C', `/tmp/${uniq}`]), righto.after(madeUntarDirectory, downloadedTarball))

  const readPackageJson = righto(fs.readFile, `/tmp/${uniq}/package/package.json`, 'utf8', righto.after(expandedTarball))
    .get(packageJson => JSON.parse(packageJson))

  const packageRepository = readPackageJson
    .get(packageJson => {
      if (!packageJson.repository) {
        console.log('Trying to guess repository as none exists in package.json')
        return `https://github.com/${packageJson.author}/${packageJson.name}`
      }

      if (typeof packageJson.repository === 'string') {
        return `https://github.com/${packageJson.repository}`
      }

      const currentRepo = packageJson.repository && packageJson.repository.url && packageJson.repository.url

      if (currentRepo.startsWith('git@')) {
        return currentRepo.replace(':', '/').replace('git@', 'https://')
      } else {
        return currentRepo
      }
    })

  const clonedRepo = righto(execute,
    'git', righto.resolve(['clone', packageRepository, `/tmp/${uniq}/repository`]))

  const packedPackage = righto(execute, 'npm', ['pack', '--ignore-scripts'], {cwd: `/tmp/${uniq}/repository`}, righto.after(clonedRepo))

  const packedPackagePath = packedPackage
    .get(packed => `/tmp/${uniq}/repository/${packed.stdout.trim()}`)

  const createdPackedDirectory = righto(fs.mkdir, `/tmp/${uniq}/packed`)

  const packedExtracted = righto(execute, 'tar', righto.resolve([
    'xzf', packedPackagePath, '-C', `/tmp/${uniq}/packed`
  ]), righto.after(createdPackedDirectory))

  const diffed = righto(execute, 'diff', [`/tmp/${uniq}/packed/package`, `/tmp/${uniq}/package`],
    righto.after(packedExtracted, expandedTarball))

  const outputEverything = righto.mate(
    readPackageJson,
    downloadedTarball,
    madeUntarDirectory,
    expandedTarball,
    clonedRepo,
    packedPackage,
    packedExtracted,
    righto.handle(diffed, (error, callback) => callback(null, error.stdout))
  )

  outputEverything(callback)
}

module.exports = analyseNpm
