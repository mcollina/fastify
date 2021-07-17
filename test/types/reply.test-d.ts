import { expectType, expectError } from 'tsd'
import fastify, { RouteHandlerMethod, RouteHandler, RawRequestDefaultExpression, FastifyContext, FastifyContextConfig, FastifyRequest, FastifyReply } from '../../fastify'
import { RawServerDefault, RawReplyDefaultExpression, ContextConfigDefault } from '../../types/utils'
import { FastifyLoggerInstance } from '../../types/logger'
import { RouteGenericInterface } from '../../types/route'

const getHandler: RouteHandlerMethod = function (_request, reply) {
  expectType<RawReplyDefaultExpression>(reply.raw)
  expectType<FastifyContext<ContextConfigDefault>>(reply.context)
  expectType<FastifyContextConfig>(reply.context.config)
  expectType<FastifyLoggerInstance>(reply.log)
  expectType<FastifyRequest<RouteGenericInterface, RawServerDefault, RawRequestDefaultExpression>>(reply.request)
  expectType<(statusCode: number) => FastifyReply>(reply.code)
  expectType<(statusCode: number) => FastifyReply>(reply.status)
  expectType<number>(reply.statusCode)
  expectType<boolean>(reply.sent)
  expectType<((payload?: unknown, isError?: boolean) => FastifyReply)>(reply.send)
  expectType<(key: string, value: any) => FastifyReply>(reply.header)
  expectType<(values: {[key: string]: any}) => FastifyReply>(reply.headers)
  expectType<(key: string) => string | undefined>(reply.getHeader)
  expectType<() => { [key: string]: number | string | string[] | undefined }>(reply.getHeaders)
  expectType<(key: string) => void>(reply.removeHeader)
  expectType<(key: string) => boolean>(reply.hasHeader)
  expectType<{(statusCode: number, url: string): FastifyReply; (url: string): FastifyReply }>(reply.redirect)
  expectType<() => FastifyReply>(reply.hijack)
  expectType<() => void>(reply.callNotFound)
  expectType<() => number>(reply.getResponseTime)
  expectType<(contentType: string) => FastifyReply>(reply.type)
  expectType<(fn: (payload: any) => string) => FastifyReply>(reply.serializer)
  expectType<(payload: any) => string>(reply.serialize)
  expectType<(fulfilled: () => void, rejected: (err: Error) => void) => void>(reply.then)
}

interface ReplyPayload {
  Reply: {
    test: boolean;
  };
}

const typedHandler: RouteHandler<ReplyPayload> = async (request, reply) => {
  expectType<((payload?: ReplyPayload['Reply'], isError?: boolean) => FastifyReply<RawServerDefault, RawRequestDefaultExpression<RawServerDefault>, RawReplyDefaultExpression<RawServerDefault>, ReplyPayload>)>(reply.send)
}

const server = fastify()
server.get('/get', getHandler)
server.get('/typed', typedHandler)
server.get<ReplyPayload>('/get-generic-send', async function handler (request, reply) {
  reply.send({ test: true })
})
server.get<ReplyPayload>('/get-generic-return', async function handler (request, reply) {
  return { test: false }
})
expectError(server.get<ReplyPayload>('/get-generic-return-error', async function handler (request, reply) {
  reply.send({ foo: 'bar' })
}))
expectError(server.get<ReplyPayload>('/get-generic-return-error', async function handler (request, reply) {
  return { foo: 'bar' }
}))
