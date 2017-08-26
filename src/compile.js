const hogan = require('hogan.js')

module.exports = function compile(template, data) {
  try {
    const compiled = hogan.compile(template)
    const html = compiled.render(data)
    return Promise.resolve(html)
  } catch(error) {
    return Promise.reject(error)
  }
}
