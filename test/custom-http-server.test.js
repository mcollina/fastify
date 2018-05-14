'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('..')
const http = require('http')
const uws = require('uws')
const sget = require('simple-get').concat

test('Should support a custom http server', t => {
  t.plan(5)

  const httpServer = handler => {
    const server = http.createServer((req, res) => {
      req.custom = true
      handler(req, res)
    })

    return server
  }

  const fastify = Fastify({ httpServer })

  t.teardown(fastify.close.bind(fastify))

  fastify.get('/', (req, reply) => {
    t.ok(req.raw.custom)
    reply.send({ hello: 'world' })
  })

  fastify.listen(0, err => {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), { hello: 'world' })
    })
  })
})

test('Should support uws', t => {
  t.plan(5)

  const httpServer = handler => {
    const server = uws.http.createServer((req, res) => {
      req.custom = true
      handler(req, res)
    })

    return server
  }

  const fastify = Fastify({ httpServer })

  t.teardown(fastify.close.bind(fastify))

  fastify.get('/', (req, reply) => {
    t.ok(req.raw.custom)
    reply.send({ hello: 'world' })
  })

  fastify.listen(0, err => {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
      t.deepEqual(JSON.parse(body), { hello: 'world' })
    })
  })
})
