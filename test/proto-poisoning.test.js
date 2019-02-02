'use strict'

const Fastify = require('..')
const sget = require('simple-get').concat
const t = require('tap')
const test = t.test

test('proto-poisoning', t => {
  t.plan(3)

  const fastify = Fastify()
  t.tearDown(fastify.close.bind(fastify))

  fastify.post('/', (request, reply) => {
    t.fail('handler should not be called')
  })

  fastify.listen(0, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + fastify.server.address().port,
      headers: { 'Content-Type': 'application/json' },
      body: '{ "__proto__": { "a": 42 } }'
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 400)
    })
  })
})

test('proto-poisoning remove', t => {
  t.plan(4)

  const fastify = Fastify({ protoAction: 'remove' })
  t.tearDown(fastify.close.bind(fastify))

  fastify.post('/', (request, reply) => {
    t.equal(undefined, Object.assign({}, request.body).a)
    reply.send({ ok: true })
  })

  fastify.listen(0, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + fastify.server.address().port,
      headers: { 'Content-Type': 'application/json' },
      body: '{ "__proto__": { "a": 42 }, "b": 42 }'
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
    })
  })
})

test('proto-poisoning ignore', t => {
  t.plan(4)

  const fastify = Fastify({ protoAction: 'ignore' })
  t.tearDown(fastify.close.bind(fastify))

  fastify.post('/', (request, reply) => {
    t.equal(42, Object.assign({}, request.body).a)
    reply.send({ ok: true })
  })

  fastify.listen(0, function (err) {
    t.error(err)

    sget({
      method: 'POST',
      url: 'http://localhost:' + fastify.server.address().port,
      headers: { 'Content-Type': 'application/json' },
      body: '{ "__proto__": { "a": 42 }, "b": 42 }'
    }, (err, response, body) => {
      t.error(err)
      t.strictEqual(response.statusCode, 200)
    })
  })
})
