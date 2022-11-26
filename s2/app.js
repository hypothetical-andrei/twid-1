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

const Author = sequelize.define('author', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      len: [3, 10]
    }
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  }
})

Message.hasMany(Author)

const app = express()

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

app.get('/messages/:mid/authors', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.mid, { include: [Author] })
    if (message) {
      const authors = message.authors
      res.status(200).json(authors)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.post('/messages/:mid/authors', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.mid)
    if (message) {
      const author = new Author()
      author.name = req.body.name
      author.email = req.body.email
      author.messageId = message.id
      await author.save()
      res.status(201).json(author)
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.get('/messages/:mid/authors/:aid', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.mid)
    if (message) {
      const authors = await message.getAuthors({ id: req.params.aid })
      const author = authors.shift()
      if (author) {
        res.status(200).json(author)
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.put('/messages/:mid/authors/:aid', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.mid)
    if (message) {
      const authors = await message.getAuthors({ id: req.params.aid })
      const author = authors.shift()
      if (author) {
        await author.update(req.body, { fields: ['name', 'email' ]})
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
    } else {
      res.status(404).json({ message: 'not found' })
    }
  } catch (error) {
    next(error)
  }
})

app.delete('/messages/:mid/authors/:aid', async (req, res, next) => {
  try {
    const message = await Message.findByPk(req.params.mid)
    if (message) {
      const authors = await message.getAuthors({ id: req.params.aid })
      const author = authors.shift()
      if (author) {
        await author.destroy()
        res.status(202).json({ message: 'accepted' })
      } else {
        res.status(404).json({ message: 'not found' })
      }
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