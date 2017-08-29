const _ = require('lodash')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const preprocess = require('./src/preprocess')
const compile = require('./src/compile')
const inline = require('./src/inline')
const utils = require('./src/utils')
const port = '3636'

// Server

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.listen(port)

// Endpoints

app.get('/', async (req, res) => {
  const files_array = await utils.readdirRecursive('data')
  const tree = await utils.pathsToTree(files_array)
  res.send(tree)
})

app.get('/*', async (req, res) => {
  const path = req.originalUrl
  await utils.sleep(3000)
  res.sendFile(`data/${path}`, {
    root: __dirname
  })
})

app.put('/*', (req, res) => {
  const path = req.originalUrl
  fs.writeFile(`data/${path}`, req.body.content, (error) => {
    error
      ? res.status(500).send('Could not save')
      : res.send('Saved successfully')
  })
})

app.post('/templates', async (req, res) => {
  try {
    const template_name = req.body.name
    const message = await utils.createTemplate(template_name)
    res.send(message)
  } catch (error) {
    console.warn(error)
    res.status(500).send(error.message)
  }
})

app.delete('/templates/:name', async (req, res) => {
  try {
    const name = req.params.name
    const message = await utils.removeTemplate(name)
    res.send(message)
  } catch (error) {
    console.warn(error)
    res.status(500).send(error.message)
  }
})

app.post('/partials', async (req, res) => {
  try {
    const name = req.body.name
    const message = await utils.createPartial(name)
    res.send(message)
  } catch (error) {
    console.warn(error)
    res.status(500).send(error.message)
  }
})

app.delete('/partials/:name', async (req, res) => {
  try {
    const name = req.params.name
    const message = await utils.removePartial(name)
    res.send(message)
  } catch (error) {
    console.warn(error)
    res.status(500).send(error.message)
  }
})

app.post('/render/:type', async (req, res) => {
  try {
    const template_html = req.body.template || ''
    const css = req.body.css || '//' // sass-node will throw error if nothing is passed

    const processed = await preprocess(css)
    const inlined = await inline(template_html, {
      extraCss: processed
    })
    const main_html = await utils.readFile('./data/partials/email/index.html')

    let partials_array = fs.readdirSync('./data/partials').filter(filename => {
      return !(/^\./.test(filename))
    })
    console.log({partials_array})
    let partials = {}

    // partials_array.map(async (name) => {
    for (let name of partials_array) {
      console.log(name)
      console.log('')
      const template = await utils.readFile(`./data/partials/${name}/index.html`)
      const scss = await utils.readFile(`./data/partials/${name}/style.scss`)
      const css = await preprocess(scss)
      const template_inlined = await inline(template, {
        extraCss: css
      })
      console.log({template_inlined})
      partials[name] = template_inlined
    }

    partials.content = inlined

    console.log({partials})

    const partial_json = require('./data/templates/bill_due_today/data.json')
    const json = require('./data/globals.json')
    const merged = _.merge({}, json, partial_json)
    let html = await compile(main_html, merged, partials)

    const data = await utils.readFile('./data/globals.scss')
    const processed_globals = await preprocess(data)

    html = `
    <style>${processed_globals}</style>
    ${html}
    `
    res.send(html)

    console.log('post request: /')
  } catch (error) {
    // console.log('caught error', error)
    res.status(500).send(error.message)
  }
})

console.log(`Listening on port ${port}`)

/*
io.on('connection', (socket) => {
  socket.on('codechange', (data) => {
    console.log(data)
    // const inlined = await inline(template_html)
    // const html = await compile(inlined, json)
    socket.emit('codecompiled', data)
  })
})
*/
