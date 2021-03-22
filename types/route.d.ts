/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { FastifyInstance } from './instance'
import { FastifyRequest, RequestGenericInterface } from './request'
import { FastifyReply, ReplyGenericInterface } from './reply'
import { FastifySchema, FastifySchemaCompiler, FastifySchemaValidationError, FastifySerializerCompiler } from './schema'
import { HTTPMethods, RawServerBase, RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, ContextConfigDefault } from './utils'
import { LogLevel } from './logger'
import { preValidationHookHandler, preHandlerHookHandler, preSerializationHookHandler, onRequestHookHandler, preParsingHookHandler, onResponseHookHandler, onSendHookHandler, onErrorHookHandler, onTimeoutHookHandler } from './hooks'
import { FastifyError } from 'fastify-error'

export interface RouteGenericInterface extends RequestGenericInterface, ReplyGenericInterface {}

/**
 * Route shorthand options for the various shorthand methods
 */
export interface RouteShorthandOptions<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  SchemaCompiler = FastifySchema,
> {
  schema?: FastifySchema
  attachValidation?: boolean
  exposeHeadRoute?: boolean
  validatorCompiler?: FastifySchemaCompiler<SchemaCompiler>
  serializerCompiler?: FastifySerializerCompiler<SchemaCompiler>
  bodyLimit?: number
  logLevel?: LogLevel
  config?: ContextConfig
  version?: string
  constraints?: { [name: string]: any }
  prefixTrailingSlash?: 'slash'|'no-slash'|'both'
  errorHandler?: (this: FastifyInstance, error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void
  // TODO: Change to actual type.
  schemaErrorFormatter?: (errors: FastifySchemaValidationError[], dataVar: string) => Error

  // hooks
  onRequest?: onRequestHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<onRequestHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  preParsing?: preParsingHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preParsingHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  preValidation?: preValidationHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preValidationHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  preHandler?: preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  preSerialization?: preSerializationHookHandler<unknown, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preSerializationHookHandler<unknown, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  onSend?: onSendHookHandler<unknown, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<onSendHookHandler<unknown, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  onResponse?: onResponseHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<onResponseHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  onTimeout?: onTimeoutHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<onTimeoutHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
  onError?: onErrorHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<onErrorHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
}

/**
 * Route handler method declaration.
 */
export type RouteHandlerMethod<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  this: FastifyInstance<RawServer, RawRequest, RawReply>,
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
) => void | Promise<RouteGeneric['Reply'] | void>

/**
 * Shorthand options including the handler function property
 */
export interface RouteShorthandOptionsWithHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  SchemaCompiler = FastifySchema,
> extends RouteShorthandOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler> {
  handler: RouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
}

/**
 * Fastify Router Shorthand method type that is similar to the Express/Restify approach
 */
export interface RouteShorthandMethod<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
> {
  <RouteGeneric extends RouteGenericInterface = RouteGenericInterface, ContextConfig = ContextConfigDefault, SchemaCompiler = FastifySchema>(
    path: string,
    opts: RouteShorthandOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler>,
    handler: RouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ): FastifyInstance<RawServer, RawRequest, RawReply>
  <RouteGeneric extends RouteGenericInterface = RouteGenericInterface, ContextConfig = ContextConfigDefault>(
    path: string,
    handler: RouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ): FastifyInstance<RawServer, RawRequest, RawReply>
  <RouteGeneric extends RouteGenericInterface = RouteGenericInterface, ContextConfig = ContextConfigDefault, SchemaCompiler = FastifySchema>(
    path: string,
    opts: RouteShorthandOptionsWithHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler>
  ): FastifyInstance<RawServer, RawRequest, RawReply>
}

/**
 * Fastify route method options.
 */
export interface RouteOptions<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  SchemaCompiler = FastifySchema,
> extends RouteShorthandOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler> {
  method: HTTPMethods | HTTPMethods[]
  url: string
  handler: RouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
}

export type RouteHandler<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  ContextConfig = ContextConfigDefault
> = (
  this: FastifyInstance<RawServer, RawRequest, RawReply>,
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
) => void | Promise<RouteGeneric['Reply'] | void>

export type DefaultRoute<Request, Reply> = (
  req: Request,
  res: Reply,
) => void
