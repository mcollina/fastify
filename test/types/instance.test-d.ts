/* eslint-disable handle-callback-err */
/* eslint-disable @typescript-eslint/no-invalid-void-type */
import fastify, { FastifyError, FastifyInstance, ValidationResult } from '../../fastify'
import { expectAssignable, expectError, expectType } from 'tsd'
import { FastifyRequest } from '../../types/request'
import { FastifyReply } from '../../types/reply'
import { HookHandlerDoneFunction } from '../../types/hooks'

const server = fastify()

expectAssignable<FastifyInstance>(server.addSchema({
  type: 'null'
}))
expectAssignable<FastifyInstance>(server.addSchema({
  schemaId: 'id'
}))
expectAssignable<FastifyInstance>(server.addSchema({
  schemas: []
}))

expectType<Record<string, unknown>>(server.getSchemas())
expectType<unknown>(server.getSchema('SchemaId'))
expectType<string>(server.printRoutes())
expectType<string>(server.printPlugins())

expectAssignable<FastifyInstance>(
  // eslint-disable-next-line handle-callback-err
  server.setErrorHandler(function (error, request, reply): void {
    expectAssignable<FastifyInstance>(this)
  })
)

expectAssignable<FastifyInstance>(
  // eslint-disable-next-line handle-callback-err
  server.setErrorHandler<FastifyError>(function (error, request, reply): void {
    expectType<FastifyError>(error)
  })
)

expectType<ValidationResult[] | undefined>(FastifyError().validation)

function fastifyErrorHandler (this: FastifyInstance, error: FastifyError): void {}
server.setErrorHandler(fastifyErrorHandler)

function nodeJSErrorHandler (error: NodeJS.ErrnoException): void {}
server.setErrorHandler(nodeJSErrorHandler)

function notFoundHandler (request: FastifyRequest, reply: FastifyReply): void {}
function notFoundpreHandlerHandler (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void { done() }
async function notFoundpreHandlerAsyncHandler (request: FastifyRequest, reply: FastifyReply): Promise<void> {}
function notFoundpreValidationHandler (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction): void { done() }
async function notFoundpreValidationAsyncHandler (request: FastifyRequest, reply: FastifyReply): Promise<void> {}

server.setNotFoundHandler(notFoundHandler)
server.setNotFoundHandler({ preHandler: notFoundpreHandlerHandler }, notFoundHandler)
server.setNotFoundHandler({ preHandler: notFoundpreHandlerAsyncHandler }, notFoundHandler)
server.setNotFoundHandler({ preValidation: notFoundpreValidationHandler }, notFoundHandler)
server.setNotFoundHandler({ preValidation: notFoundpreValidationAsyncHandler }, notFoundHandler)
server.setNotFoundHandler({ preHandler: notFoundpreHandlerHandler, preValidation: notFoundpreValidationHandler }, notFoundHandler)

function invalidErrorHandler (error: number): void {}
expectError(server.setErrorHandler(invalidErrorHandler))

server.setReplySerializer(function (payload, statusCode) {
  expectType<unknown>(payload)
  expectType<number>(statusCode)
  return 'serialized'
})

function invalidReplySerializer (payload: number, statusCode: string): void {}
expectError(server.setReplySerializer(invalidReplySerializer))

function serializerWithInvalidReturn (payload: unknown, statusCode: number): void {}
expectError(server.setReplySerializer(serializerWithInvalidReturn))

function invalidSchemaErrorFormatter (): void {}
expectError(server.setSchemaErrorFormatter(invalidSchemaErrorFormatter))

// test listen method callback
expectAssignable<void>(server.listen(3000, '', 0, (err, address) => {}))
expectAssignable<void>(server.listen('3000', '', 0, (err, address) => {}))
expectAssignable<void>(server.listen(3000, '', (err, address) => {}))
expectAssignable<void>(server.listen('3000', '', (err, address) => {}))
expectAssignable<void>(server.listen(3000, (err, address) => {}))
expectAssignable<void>(server.listen('3000', (err, address) => {}))

// test listen method promise
expectAssignable<PromiseLike<string>>(server.listen(3000))
expectAssignable<PromiseLike<string>>(server.listen('3000'))
expectAssignable<PromiseLike<string>>(server.listen(3000, '', 0))
expectAssignable<PromiseLike<string>>(server.listen('3000', '', 0))
expectAssignable<PromiseLike<string>>(server.listen(3000, ''))
expectAssignable<PromiseLike<string>>(server.listen('3000', ''))

// test listen opts objects
expectAssignable<PromiseLike<string>>(server.listen({ port: 3000 }))
expectAssignable<PromiseLike<string>>(server.listen({ port: 3000, host: '0.0.0.0' }))
expectAssignable<PromiseLike<string>>(server.listen({ port: 3000, host: '0.0.0.0', backlog: 42 }))
expectAssignable<void>(server.listen({ port: 3000 }, () => {}))
expectAssignable<void>(server.listen({ port: 3000, host: '0.0.0.0' }, () => {}))
expectAssignable<void>(server.listen({ port: 3000, host: '0.0.0.0', backlog: 42 }, () => {}))

expectType<FastifyInstance>(fastify().get('/', {
  handler: () => {},
  errorHandler: (error, request, reply) => {
    expectAssignable<void>(server.errorHandler(error, request, reply))
  }
}))

type InitialConfig = Readonly<{
  connectionTimeout?: number
  keepAliveTimeout?: number
  bodyLimit?: number
  caseSensitive?: boolean
  http2?: boolean
  https?: boolean | Readonly<{ allowHTTP1: boolean }>
  ignoreTrailingSlash?: boolean
  disableRequestLogging?: boolean
  maxParamLength?: number
  onProtoPoisoning?: 'error' | 'remove' | 'ignore'
  onConstructorPoisoning?: 'error' | 'remove' | 'ignore'
  pluginTimeout?: number
  requestIdHeader?: string
  requestIdLogLabel?: string
  http2SessionTimeout?: number
}>

expectType<InitialConfig>(fastify().initialConfig)
