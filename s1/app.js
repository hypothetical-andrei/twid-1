const express = require('express')
const Sequelize = require('sequelize')

const sequelize  = new Sequelize({
  dialect: 'sqlite',
  storage: './my.db'
})

const Message = sequelize.define('message', {
  title: Sequelize.STRING,
  content: Sequelize.STRING
})

const app = express()

// app.locals.messages = [{
//   title: 'sometitle',
//   content: 'somecontent'
// }]

app.use((req, res, next) => {
  console.log(req.url)
  next()
})

app.use(express.static('public'))

app.use(express.json())

app.get('/ping', (req, res) => {
  res.status(200).json({ message: 'pong' })
})

app.get('/create', async (req, res, next) => {
  try {
    await sequelize.sync()
    res.status(200).json({ message: 'tables created' })    
  } catch (error) {
    next()
  }
})

app.get('/messages', async (req, res, next) => {
  try {
    const query = {}
    if (req.query.filter) {
      query.where = {}
      query.where.title = {
        [Sequelize.Op.like]: `%${req.query.filter}%`
      }
    }
    const messages = await Message.findAll(query)
    res.status(200).json(messages)
  } catch (error) {
    next(error)
  }
})

app.post('/messages', async (req, res) => {
  try {
    const message = await Message.create(req.body)
    res.status(201).json(message)
  } catch (error) {
    next(error)
  }
})

app.get('/messages/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const message = await Message.findByPk(id)
    if (message) {
      res.status(200).json(message)
    } else {
      res.status(404).json({ message: 'your message is in another castle' })
    }
  } catch (error) {
    next(error)
  }
})

app.put('/messages/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const message = await Message.findByPk(id)
    if (message) {
      await message.update(req.body)
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.delete('/messages/:id', async (req, res, next) => {
  try {
    const id = req.params.id
    const message = await Message.findByPk(id)
    if (message) {
      await message.destroy()
      res.status(202).json({ message: 'accepted' })
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.use((error, req, res, next) => {
  console.log(error)
  res.status(500).json({ message: 'some error' })
})

app.listen(8080)