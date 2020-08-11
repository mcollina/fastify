'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('..')
const { Client } = require('undici')

test('Should return 503 while closing - pipelining', t => {
  const fastify = Fastify({
    return503OnClosing: true
  })

  fastify.get('/', (req, reply) => {
    fastify.close()
    reply.send({ hello: 'world' })
  })

  fastify.listen(0, async err => {
    t.error(err)

    const instance = new Client('http://localhost:' + fastify.server.address().port, {
      pipelining: 1
    })

    const codes = [200, 503]
    // eslint-disable-next-line no-unused-vars
    for (const _ of Array(codes.length)) {
      instance.request(
        { path: '/', method: 'GET' }
      ).then(data => {
        t.strictEqual(data.statusCode, codes.shift())
      }).catch((e) => {
        t.fail(e)
      })
    }
    instance.close(() => {
      t.strictEqual(codes.length, 0)
      t.end('Done')
    })
  })
})

test('Should not return 503 while closing - pipelining - return503OnClosing', t => {
  const fastify = Fastify({
    return503OnClosing: false
  })

  fastify.get('/', (req, reply) => {
    fastify.close()
    reply.send({ hello: 'world' })
  })

  fastify.listen(0, err => {
    t.error(err)

    const instance = new Client('http://localhost:' + fastify.server.address().port, {
      pipelining: 1
    })

    const codes = [200, 200]
    // eslint-disable-next-line no-unused-vars
    for (const _ of Array(codes.length)) {
      instance.request(
        { path: '/', method: 'GET' }
      ).then(data => {
        t.strictEqual(data.statusCode, codes.shift())
      }).catch((e) => {
        t.fail(e)
      })
    }
    instance.close(() => {
      t.strictEqual(codes.length, 0)
      t.end('Done')
    })
  })
})
