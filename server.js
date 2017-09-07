const fs = require('fs')
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const utils = require('./src/utils')
const port = '3636'

// Server

const app = express()
app.use(cors())
app.use(bodyParser.json())
app.listen(port)

// Endpoints

app.get('/data', async (req, res) => {
  let output = {}
  const dirs = {
    templates: 'data/templates/',
    partials: 'data/partials/',
    styles: 'data/styles/',
    globals: 'data/globals/'
  }

  for (let key in dirs) {
    const paths_array = await utils.readdirRecursive(dirs[key])
    const short_paths_array = utils.shortenPaths(dirs[key], paths_array)
    const tree = utils.pathsToTree(short_paths_array, dirs[key])
    const files = utils.treeToArray(tree)
    output[key] = files
  }
  res.send(output)
})

app.get('/*', async (req, res) => {
  const path = req.originalUrl
  res.sendFile(`data/${path}`, {
    root: __dirname
  })
})

app.put('/*', (req, res) => {
  const path = req.originalUrl.slice(1)
  fs.writeFile(`data/${path}`, req.body.content, (error) => {
    console.warn(error)
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

app.post('/render/email', async (req, res) => {
  try {
    const path = req.body.path
    // need to remove /email from end of path
    const template_path = path.split('/').slice(0, -1).join('/')
    const html = await utils.renderEmail(template_path)

    res.send(html)
  } catch (error) {
    return res.status(500).send(error.message)
  }
})

app.post('/render/push', async (req, res) => {
  try {
    const path = req.body.path
    // need to remove /email from end of path
    const template_path = path.split('/').slice(0, -1).join('/')
    const html = await utils.renderPush(template_path)

    res.send(html)
  } catch (error) {
    return res.status(500).send(error.message)
  }
})

app.post('/render/text', async (req, res) => {
  try {
    const path = req.body.path
    // need to remove /email from end of path
    const template_path = path.split('/').slice(0, -1).join('/')
    const html = await utils.renderText(template_path)

    res.send(html)
  } catch (error) {
    return res.status(500).send(error.message)
  }
})

console.log(`Listening on port ${port}`)
