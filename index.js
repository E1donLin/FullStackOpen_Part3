const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const Person = require('./models/person')

var morgan = require('morgan')
morgan.token('data', (req) => {
  console.log(req.body)
  return JSON.stringify(req.body)
})

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :data')
)

app.get('/api/persons', (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons)
  })
})

app.get('/info', (req, res) => {
  const date = new Date()
  Person.find({}).then((persons) => {
    res.send(
      `<p>Phonebook has info for ${persons.length} people</p>` +
        `<p>${date}</p>`
    )
  })
})

app.get('/api/persons/:id', (req, res, next) => {
  Person.findById(req.params.id)
    .then((person) => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

app.post('/api/persons', (req, res, next) => {
  const body = req.body
  if (body.name === undefined) {
    return res.status(400).json({
      error: 'name is missing',
    })
  } else if (body.number === undefined) {
    return res.status(400).json({
      error: 'number is missing',
    })
  }

  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person
    .save()
    .then((savedPerson) => {
      res.json(savedPerson)
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const body = req.body
  const person = {
    name: body.name,
    number: body.number,
  }
  Person.findByIdAndUpdate(req.params.id, person, { new: true })
    .then((updatedPerson) => {
      res.json(updatedPerson)
    })
    .catch((error) => next(error))
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  // console.error(error.message)
  console.log('errorHandler called')

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
