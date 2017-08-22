const requireText = require('require-text')
const async = require('asyncawait/async')
const await = require('asyncawait/await')
const compile = require('./src/compile')
const inline = require('./src/inline')

const template_html = requireText('./templates/index.html', require)
const json = requireText('./index.json', require)

async (() => {
  const inlined = await (inline(template_html))
  const html = await (compile(inlined, json))
  console.log({html});
})()
