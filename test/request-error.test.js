'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('..')
const { kRequest } = require('../lib/symbols.js')

test('default 400 on request error', t => {
  t.plan(4)

  const fastify = Fastify()

  fastify.post('/', function (req, reply) {
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'POST',
    url: '/',
    simulate: {
      error: true
    },
    body: {
      text: '12345678901234567890123456789012345678901234567890'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 400)
    t.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Bad Request',
      message: 'Simulated',
      statusCode: 400
    })
  })
})

test('default 400 on request error with custom error handler', t => {
  t.plan(6)

  const fastify = Fastify()

  fastify.setErrorHandler(function (err, request, reply) {
    t.type(request, 'object')
    t.type(request, fastify[kRequest])
    reply
      .code(err.statusCode)
      .type('application/json; charset=utf-8')
      .send(err)
  })

  fastify.post('/', function (req, reply) {
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'POST',
    url: '/',
    simulate: {
      error: true
    },
    body: {
      text: '12345678901234567890123456789012345678901234567890'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 400)
    t.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Bad Request',
      message: 'Simulated',
      statusCode: 400
    })
  })
})

test('error handler binding', t => {
  t.plan(5)

  const fastify = Fastify()

  fastify.setErrorHandler(function (err, request, reply) {
    t.strictEqual(this, fastify)
    reply
      .code(err.statusCode)
      .type('application/json; charset=utf-8')
      .send(err)
  })

  fastify.post('/', function (req, reply) {
    reply.send({ hello: 'world' })
  })

  fastify.inject({
    method: 'POST',
    url: '/',
    simulate: {
      error: true
    },
    body: {
      text: '12345678901234567890123456789012345678901234567890'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 400)
    t.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    t.deepEqual(JSON.parse(res.payload), {
      error: 'Bad Request',
      message: 'Simulated',
      statusCode: 400
    })
  })
})

test('encapsulated error handler binding', t => {
  t.plan(7)

  const fastify = Fastify()

  fastify.register(function (app, opts, next) {
    app.decorate('hello', 'world')
    t.strictEqual(app.hello, 'world')
    app.post('/', function (req, reply) {
      reply.send({ hello: 'world' })
    })
    app.setErrorHandler(function (err, request, reply) {
      t.strictEqual(this.hello, 'world')
      reply
        .code(err.statusCode)
        .type('application/json; charset=utf-8')
        .send(err)
    })
    next()
  })

  fastify.inject({
    method: 'POST',
    url: '/',
    simulate: {
      error: true
    },
    body: {
      text: '12345678901234567890123456789012345678901234567890'
    }
  }, (err, res) => {
    t.error(err)
    t.strictEqual(res.statusCode, 400)
    t.strictEqual(res.headers['content-type'], 'application/json; charset=utf-8')
    t.deepEqual(res.json(), {
      error: 'Bad Request',
      message: 'Simulated',
      statusCode: 400
    })
    t.strictEqual(fastify.hello, undefined)
  })
})
