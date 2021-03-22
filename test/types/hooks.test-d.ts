/* eslint-disable @typescript-eslint/no-invalid-void-type */
import fastify, { RouteOptions, FastifyReply, FastifyRequest } from '../../fastify'
import { expectType, expectError, expectAssignable } from 'tsd'
import { FastifyInstance } from '../../types/instance'
import { FastifyError } from 'fastify-error'
import { RequestPayload } from '../../types/hooks'

const server = fastify()

// Test payload generic pass through for preSerialization and onSend

interface TestPayloadType {
  foo: string
  bar: number
}

// Synchronous Tests

server.addHook('onRequest', (request, reply, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('preParsing', (request, reply, payload, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<RequestPayload>(payload)
  expectAssignable<(err?: FastifyError | null, res?: RequestPayload) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('preValidation', (request, reply, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('preHandler', (request, reply, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook<TestPayloadType>('preSerialization', function (request, reply, payload, done) {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<TestPayloadType>(payload) // we expect this to be unknown when not specified like in the previous test
  expectType<void>(done(new Error()))
  expectType<void>(done(null, 'foobar'))
  expectType<void>(done())
  expectError<void>(done(new Error(), 'foobar'))
})

server.addHook<TestPayloadType>('onSend', (request, reply, payload, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<TestPayloadType>(payload)
  expectType<void>(done(new Error()))
  expectType<void>(done(null, 'foobar'))
  expectType<void>(done())
  expectError<void>(done(new Error(), 'foobar'))
})

server.addHook('onResponse', (request, reply, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('onTimeout', (request, reply, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('onError', (request, reply, error, done) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<FastifyError>(error)
  expectType<() => void>(done)
  expectType<void>(done())
})

server.addHook('onRoute', (opts) => {
  expectType<RouteOptions & { routePath: string, path: string, prefix: string}>(opts)
})

server.addHook('onRegister', (instance, done) => {
  expectType<FastifyInstance>(instance)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('onReady', function (done) {
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

server.addHook('onClose', (instance, done) => {
  expectType<FastifyInstance>(instance)
  expectAssignable<(err?: FastifyError) => void>(done)
  expectAssignable<(err?: NodeJS.ErrnoException) => void>(done)
  expectType<void>(done(new Error()))
})

// Asynchronous

server.addHook('onRequest', async (request, reply) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
})

server.addHook('preParsing', async (request, reply, payload) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<RequestPayload>(payload)
})

server.addHook('preValidation', async (request, reply) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
})

server.addHook('preHandler', (request, reply) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
})

server.addHook<TestPayloadType>('preSerialization', async function (request, reply, payload) {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<TestPayloadType>(payload) // we expect this to be unknown when not specified like in the previous test
})

server.addHook<TestPayloadType>('onSend', async (request, reply, payload) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<TestPayloadType>(payload)
})

server.addHook('onResponse', async (request, reply) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
})

server.addHook('onTimeout', async (request, reply) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
})

server.addHook('onError', async (request, reply, error) => {
  expectType<FastifyRequest>(request)
  expectType<FastifyReply>(reply)
  expectType<FastifyError>(error)
})

server.addHook('onRegister', async (instance) => {
  expectType<FastifyInstance>(instance)
})

server.addHook('onClose', async (instance) => {
  expectType<FastifyInstance>(instance)
})
