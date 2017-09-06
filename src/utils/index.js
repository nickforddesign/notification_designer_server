const _ = require('lodash')
const fs = require('fs')
const glob = require('glob')
const rimraf = require('rimraf')
const preprocess = require('../preprocess')
const compile = require('../compile')
const inline = require('../inline')

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
const readFile = (path = '', encoding = 'utf8') => {
  return asyncCallback(fs.readFile, path, encoding)
}

exports.readFile = readFile

/**
 * Recursively read a directory asynchronously
 * 
 * @async
 * @param {string} [path=''] 
 * @returns {Array} 
 */
const readdirRecursive = (path = '') => {
  return asyncCallback(glob, `${path}/**/*`)
}

exports.readdirRecursive = readdirRecursive

function isFile (path) {
  return fs.lstatSync(path).isFile()
}

/**
 * Convert array of file paths to an object
 * 
 * @param {Array} paths            array of paths
 * @param {String} relative_path   optional relative path to start
 * @returns {Object}               the file system as a tree
 */
exports.pathsToTree = (paths = [], relative_path = '') => {
  let output = {}
  let directories = []
  let files = []

  const short_relative_path_array = relative_path.split('/')
  short_relative_path_array.shift()
  const short_relative_path = short_relative_path_array.join('/')

  console.log(short_relative_path)

  for (let index in paths) {
    const path = paths[index]
    const is_file = isFile(`${relative_path}${path}`)
    is_file
      ? files.push(path)
      : directories.push(path)
  }

  for (let index in directories) {
    const path = directories[index]
    const split_path = path.split('/').join('/data/').split('/')
    _.set(output, split_path, { path: `${short_relative_path}${path}`, type: 'folder', data: {} })
  }

  for (let index in files) {
    const path = files[index]
    const split_path = path.split('/').join('/data/').split('/')
    _.set(output, split_path, { path: `${short_relative_path}${path}`, type: 'file' })
  }
  return output
}

const treeToArray = (object) => {
  let output = []
  for (let key in object) {
    let file = {}
    file.name = key
    file.type = object[key].type
    file.path = object[key].path
    if (file.type === 'file') {
      file.data = object[key].data
      file.ext = file.name.split('.').slice(-1)[0]
    } else {
      file.data = treeToArray(object[key].data)
    }
    output.push(file)
  }
  return output
}

exports.treeToArray = treeToArray

/**
 * shorten an array of paths
 * 
 * @param {String} path_to_remove   beginning of path to remove
 * @param {Array} paths_array      paths array to process
 * @returns {Array}
 */
function shortenPaths(path_to_remove, paths_array) {
  return paths_array.map(path => {
    return path.replace(path_to_remove, '')
  })
}

exports.shortenPaths = shortenPaths

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

/**
 * remove template
 * 
 * @param {String} template_name 
 * @returns 
 */
exports.removeTemplate = async (template_name) => {
  return asyncCallback(rimraf, `data/templates/${template_name}`)
}

/**
* Create new partial
* 
* @async
* @param {String} partial_name 
* @returns {Promise}
*/
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

/**
 * remove a partial
 * 
 * @async
 * @param {String} partial_name 
 * @returns {Promise}
 */
exports.removePartial = async (partial_name) => {
  return asyncCallback(rimraf, `data/partials/${partial_name}`)
}

/**
 * render an email template
 * 
 * @param {String} template_path   path of template to render
 * @returns {String}               rendered html
 */
exports.renderEmail = async (template_path) => {
  const path = `./data/${template_path}/email`

  const template = await readFile(`${path}/index.html`)
  const template_scss = await readFile(`${path}/style.scss`) || '//'
  const template_data = JSON.parse(await readFile(`./data/${template_path}/data.json`) || '{}')

  const template_css = await preprocess(template_scss)
  const template_inlined = await inline(template, {
    extraCss: template_css
  })

  const global_template = await readFile('./data/globals/index.html')
  const global_scss = await readFile('./data/globals/globals.scss') || '//'
  const global_data = JSON.parse(await readFile('./data/globals/globals.json') || '{}')

  const global_css = await preprocess(global_scss)

  let partial_paths_array = fs.readdirSync('./data/partials').filter(filename => {
    return !(/^\./.test(filename))
  })

  let partials = {}

  for (let name of partial_paths_array) {
    const partial_template = await readFile(`./data/partials/${name}/index.html`)
    const partial_scss = await readFile(`./data/partials/${name}/style.scss`)
    const partial_css = await preprocess(partial_scss)
    const partial_template_inlined = await inline(partial_template, {
      extraCss: partial_css
    })
    partials[name] = partial_template_inlined
  }

  partials.content = template_inlined

  const merged_data = _.merge({}, global_data, template_data)
  let html = await compile(global_template, merged_data, partials)

  const subject_template = await readFile(`${path}/subject.html`)
  let subject = await compile(subject_template, merged_data)

  html = `
  <style>${global_css}</style>
  ${html}
  `
  return {
    html,
    subject
  }
}

/**
 * render a text message
 * 
 * @param {String} template_path   path of template to render
 * @returns {String}               rendered html
 */
exports.renderText = async (template_path) => {
  const path = `./data/${template_path}/text`

  const template = await readFile(`${path}/index.html`)
  const template_data = JSON.parse(await readFile(`./data/${template_path}/data.json`) || '{}')

  const global_data = JSON.parse(await readFile('./data/globals/globals.json') || '{}')

  const merged_data = _.merge({}, global_data, template_data)
  let html = await compile(template, merged_data)

  return {
    html
  }
}

/**
 * render push notification
 * 
 * @param {String} template_path   path of template to render
 * @returns {String}               rendered html
 */
exports.renderPush = async (template_path) => {
  const path = `./data/${template_path}/push`

  const template = await readFile(`${path}/index.html`)
  const template_data = JSON.parse(await readFile(`./data/${template_path}/data.json`) || '{}')

  const global_data = JSON.parse(await readFile('./data/globals/globals.json') || '{}')

  const merged_data = _.merge({}, global_data, template_data)
  let html = await compile(template, merged_data)

  return {
    html
  }
}


// module.exports = exports
