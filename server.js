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

app.get('/*', (req, res) => {
  const path = req.originalUrl
  res.sendFile(`data/${path}`, {
    root: __dirname
  })
})

// app.put('/:file', (req, res) => {
//   const path = req.originalUrl
//   fs.writeFile(`data/${path}`, req.body.content, (error) => {
//     error
//       ? res.status(500).send('Could not save')
//       : res.send('Saved successfully')
//   })
// })

// app.get('/templates/:name/:file', (req, res) => {
//   const path = req.originalUrl
//   res.sendFile(`data/${path}`, {
//     root: __dirname
//   })
// })

app.put('/*', (req, res) => {
  const path = req.originalUrl
  fs.writeFile(`data/${path}`, req.body.content, (error) => {
    error
      ? res.status(500).send('Could not save')
      : res.send('Saved successfully')
  })
})

app.post('/', async (req, res) => {
  try {
    const template_html = req.body.template
    const css = req.body.css

    const json = require('./data/globals.json');
    const processed = await (preprocess(css))
    const concatted = `
    <style>${processed}</style>
    ${template_html}
    `
    const inlined = await inline(concatted)
    let html = await compile(inlined, json)

    const data = await utils.readFile('./data/globals.scss')
    const processed_globals = await preprocess(data)

    html = `
    <style>${processed_globals}</style>
    ${html}
    `
    res.send(html)
    
    console.log('post request: /')

  } catch(error) {
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