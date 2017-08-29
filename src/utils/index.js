const fs = require('fs')
const _ = require('lodash')
const glob = require('glob')

exports.consoleObj = (obj) => {
  return console.log(JSON.stringify(obj, null, 4));
}

exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}


/**
 * Deferred promises
 * 
 * @async
 * @returns {Deferred}
 */
function Deferred () {
  this.resolve = null
  this.reject = null
  this.promise = new Promise((resolve, reject) => {
    this.resolve = resolve
    this.reject = reject
  })
  Object.freeze(this)
}

module.Deferred = Deferred

function handleDeferred(error, data, deferred) {
  error
    ? deferred.reject(error)
    : deferred.resolve(data)
}

/**
 * Read a file and return contents asynchronously
 * 
 * @async
 * @param {string} [path=''] 
 * @param {string} [encoding='utf8'] 
 * @returns {String}
 */
exports.readFile = (path = '', encoding = 'utf8') => {
  const deferred = new Deferred()
  fs.readFile(path, encoding, handleDeferred(error, data, deferred))
  return deferred.promise
}

/**
 * Recursively read a directory asynchronously
 * 
 * @async
 * @param {string} [path=''] 
 * @returns {Array} 
 */
exports.readdirRecursive = (path = '') => {
  const deferred = new Deferred()
  glob(`${path}/**/*`, (err, res) => {
    err
      ? deferred.reject(err)
      : deferred.resolve(res)
  })
  return deferred.promise
}

function isFile (path) {
  return fs.lstatSync(path).isFile()
}

/**
 * Convert array of file paths to an object
 * 
 * @param {Array} paths
 * @returns {Object} the file system as a tree
 */
exports.pathsToTree = (paths) => {
  let output = {}
  let directories = []
  let files = []

  for (let index in paths) {
    const path = paths[index]
    const is_file = isFile(path)
    is_file
      ? files.push(path)
      : directories.push(path)
  }
  
  for (let index in directories) {
    const path = directories[index]
    const split_path = path.split('/')
    const filename = split_path[split_path.length - 1]
    _.set(output, split_path, {})
  }

  for (let index in files) {
    const path = files[index]
    const split_path = path.split('/')
    const filename = split_path[split_path.length - 1]
    _.set(output, split_path, path)
  }
  return output
}



