const _ = require('lodash')
const fs = require('fs')
const glob = require('glob')
const rimraf = require('rimraf')

exports.consoleObj = (obj) => {
  return console.log(JSON.stringify(obj, null, 4))
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

exports.Deferred = Deferred

/**
 * Wrap a node function that uses a callback
 * 
 * @async
 * @param {Function} fn  the function to wrap
 * @param {any} args     any amount of args
 * @returns {any}        returns a promise with whatever fn returns
 */
function asyncCallback(fn, ...args) {
  const deferred = new Deferred()
  fn(...args, (error, data) => {
    error
      ? deferred.reject(error)
      : deferred.resolve(data)
  })
  return deferred.promise
}

exports.asyncCallback = asyncCallback

/**
 * Append to file and return promise
 * 
 * @param {string} [path=''] 
 * @param {string} [content=''] 
 * @returns 
 */
function appendFile(path = '', content = '') {
  return asyncCallback(fs.appendFile, path, content)
}

exports.appendFile = appendFile

/**
 * Make directory and return promise
 * 
 * @param {string} [path=''] 
 * @param {number} [mask=0o775] 
 * @returns 
 */
function mkdir(path = '', mask = 0o775) {
  return asyncCallback(fs.mkdir, path, mask)
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
  return asyncCallback(fs.readFile, path, encoding)
}

/**
 * Recursively read a directory asynchronously
 * 
 * @async
 * @param {string} [path=''] 
 * @returns {Array} 
 */
exports.readdirRecursive = (path = '') => {
  return asyncCallback(glob, `${path}/**/*`)
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
    const split_path = path.split('/').join('/data/').split('/')
    _.set(output, split_path, { path, type: 'folder', data: {} })
  }

  for (let index in files) {
    const path = files[index]
    const split_path = path.split('/').join('/data/').split('/')
    _.set(output, split_path, { path, type: 'file' })
  }
  return output
}

function treeToArray (object) {
  let output = []
  for (let key in object) {
    let file = {}
    file.name = key
    file.type = object[key].type
    file.path = object[key].path
    if (file.type === 'file') {
      file.data = object[key].data
    } else {
      file.data = treeToArray(object[key].data)
    }
    output.push(file)
  }
  // console.log({output})
  return output
}

exports.treeToArray = treeToArray

/**
 * Create new template
 * 
 * @async
 * @param {String} template_name 
 * @returns {Promise}
 */
exports.createTemplate = async (template_name) => {
  const templates = fs.readdirSync('data/templates')

  if (templates.includes(template_name)) {
    throw new Error('A template with that name already exists')
  }

  const template_path = `data/templates/${template_name}`

  const folders = [
    template_path,
    `${template_path}/email`,
    `${template_path}/push`,
    `${template_path}/text`
  ]

  const files = [
    `${template_path}/data.json`,
    `${template_path}/email/index.html`,
    `${template_path}/email/subject.html`,
    `${template_path}/email/style.scss`,
    `${template_path}/push/index.html`,
    `${template_path}/text/index.html`
  ]

  try {
    for (let index in folders) {
      await mkdir(folders[index])
    }
    for (let index in files) {
      await appendFile(files[index])
    }
  } catch (error) {
    throw error
  }
}

exports.removeTemplate = async (template_name) => {
  return asyncCallback(rimraf, `data/templates/${template_name}`)
}

exports.createPartial = async (partial_name) => {
  const partials = fs.readdirSync('data/partials')
  if (partials.includes(partial_name)) {
    throw new Error('A partial with that name already exists')
  }

  const partial_path = `data/partials/${partial_name}`

  const folders = [
    partial_path
  ]

  const files = [
    `${partial_path}/index.html`,
    `${partial_path}/style.scss`
  ]

  try {
    for (let index in folders) {
      await mkdir(folders[index])
    }
    for (let index in files) {
      await appendFile(files[index])
    }
  } catch (error) {
    throw error
  }
}

exports.removePartial = async (partial_name) => {
  return asyncCallback(rimraf, `data/partials/${partial_name}`)
}
