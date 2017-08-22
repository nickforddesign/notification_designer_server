const inliner = require('inline-css')
const defaults = {
  url: 'http://example.com'
}

module.exports = function inline(template_html, options = defaults) {
  return inliner(template_html, options)
}
