const async = require('asyncawait/async')
const await = require('asyncawait/await')
const requireText = require('require-text')
const express = require('express')
// import http from 'http'
// import socketio from 'socket.io'
const cors = require('cors')
const bodyParser = require('body-parser')
const compile = require('./src/compile')
const inline = require('./src/inline')

const port = '3636'

const app = express()
app.use(cors())
app.use(bodyParser.json())
// const server = http.Server(app)
// const io = socketio(server)

app.listen(port)

app.get('/', async (req, res) => {
  const template_html = requireText('./templates/index.html', require);
  const json = require('./index.json');

  const inlined = await (inline(template_html))
  const html = await (compile(inlined, json))
  
  console.log('get request: /')

  res.send(html)
})

app.post('/', async (req, res) => {
  console.log(req.body)
  const template_html = req.body.template
  const json = require('./index.json');

  const inlined = await (inline(template_html))
  const html = await (compile(inlined, json))
  
  console.log('post request: /')

  res.send(html)
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