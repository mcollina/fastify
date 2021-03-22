import { Chain as LightMyRequestChain, InjectOptions, Response as LightMyRequestResponse, CallbackFunc as LightMyRequestCallback } from 'light-my-request'
import { RouteOptions, RouteShorthandMethod, RouteGenericInterface, DefaultRoute } from './route'
import { FastifySchema, FastifySchemaCompiler, FastifySchemaValidationError, FastifySerializerCompiler } from './schema'
import { RawServerBase, RawRequestDefaultExpression, RawServerDefault, RawReplyDefaultExpression, ContextConfigDefault } from './utils'
import { FastifyLoggerInstance } from './logger'
import { FastifyRegister } from './register'
import { onRequestHookHandler, preParsingHookHandler, onSendHookHandler, preValidationHookHandler, preHandlerHookHandler, preSerializationHookHandler, onResponseHookHandler, onErrorHookHandler, onRouteHookHandler, onRegisterHookHandler, onCloseHookHandler, onReadyHookHandler, onTimeoutHookHandler, preParsingAsyncHookHandler, preValidationAsyncHookHandler, preHandlerAsyncHookHandler, preSerializationAsyncHookHandler, onSendAsyncHookHandler, onResponseAsyncHookHandler, onTimeoutAsyncHookHandler, onErrorAsyncHookHandler, onReadyAsyncHookHandler, onRequestAsyncHookHandler } from './hooks'
import { FastifyRequest } from './request'
import { FastifyReply } from './reply'
import { FastifyError } from 'fastify-error'
import { AddContentTypeParser, hasContentTypeParser } from './content-type-parser'

/**
 * Fastify server instance. Returned by the core `fastify()` method.
 */
export interface FastifyInstance<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  Logger = FastifyLoggerInstance
> {
  server: RawServer
  prefix: string
  version: string | undefined
  log: Logger

  addSchema: (schema: unknown) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>
  getSchema: (schemaId: string) => unknown
  getSchemas: () => Record<string, unknown>

  after: (() => FastifyInstance<RawServer, RawRequest, RawReply, Logger> & PromiseLike<undefined>) & ((afterListener: (err: Error) => void) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>)

  close: (() => FastifyInstance<RawServer, RawRequest, RawReply, Logger> & PromiseLike<undefined>) & ((closeListener: () => void) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>)

  // should be able to define something useful with the decorator getter/setter pattern using Generics to enfore the users function returns what they expect it to
  decorate: (property: string | symbol, value: any, dependencies?: string[]) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>
  decorateRequest: (property: string | symbol, value: any, dependencies?: string[]) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>
  decorateReply: (property: string | symbol, value: any, dependencies?: string[]) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  hasDecorator: (decorator: string | symbol) => boolean
  hasRequestDecorator: (decorator: string | symbol) => boolean
  hasReplyDecorator: (decorator: string | symbol) => boolean

  inject: ((opts: InjectOptions | string, cb: LightMyRequestCallback) => void) & ((opts: InjectOptions | string) => Promise<LightMyRequestResponse>) & (() => LightMyRequestChain)

  listen: ((port: number | string, address: string, backlog: number, callback: (err: Error, address: string) => void) => void) & ((port: number | string, address: string, callback: (err: Error, address: string) => void) => void) & ((port: number | string, callback: (err: Error, address: string) => void) => void) & ((port: number | string, address?: string, backlog?: number) => Promise<string>) & ((opts: { port: number, host?: string, backlog?: number }, callback: (err: Error, address: string) => void) => void) & ((opts: { port: number, host?: string, backlog?: number }) => Promise<string>)

  ready: (() => FastifyInstance<RawServer, RawRequest, RawReply> & PromiseLike<undefined>) & ((readyListener: (err: Error) => void) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>)

  register: FastifyRegister<FastifyInstance<RawServer, RawRequest, RawReply, Logger> & PromiseLike<undefined>>

  getDefaultRoute: DefaultRoute<RawRequest, RawReply>
  setDefaultRoute: (defaultRoute: DefaultRoute<RawRequest, RawReply>) => void

  route: <
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault,
    SchemaCompiler = FastifySchema,
  >(opts: RouteOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler>) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  get: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  head: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  post: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  put: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  delete: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  options: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  patch: RouteShorthandMethod<RawServer, RawRequest, RawReply>
  all: RouteShorthandMethod<RawServer, RawRequest, RawReply>

  // addHook: overloads

  // Lifecycle addHooks

  /**
   * `onRequest` is the first hook to be executed in the request lifecycle. There was no previous hook, the next hook will be `preParsing`.
   *  Notice: in the `onRequest` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
   */
  addHook: (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onRequest',
    hook: onRequestHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onRequest',
    hook: onRequestAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preParsing',
    hook: preParsingHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preParsing',
    hook: preParsingAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preValidation',
    hook: preValidationHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preValidation',
    hook: preValidationAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preHandler',
    hook: preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preHandler',
    hook: preHandlerAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    PreSerializationPayload = unknown,
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preSerialization',
    hook: preSerializationHookHandler<PreSerializationPayload, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    PreSerializationPayload = unknown,
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'preSerialization',
    hook: preSerializationAsyncHookHandler<PreSerializationPayload, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    OnSendPayload = unknown,
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onSend',
    hook: onSendHookHandler<OnSendPayload, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    OnSendPayload = unknown,
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onSend',
    hook: onSendAsyncHookHandler<OnSendPayload, RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onResponse',
    hook: onResponseHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onResponse',
    hook: onResponseAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onTimeout',
    hook: onTimeoutHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onTimeout',
    hook: onTimeoutAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onError',
    hook: onErrorHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onError',
    hook: onErrorAsyncHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<
    RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
    ContextConfig = ContextConfigDefault
  >(
    name: 'onRoute',
    hook: onRouteHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & ((
    name: 'onRegister',
    hook: onRegisterHookHandler<RawServer, RawRequest, RawReply, Logger>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & ((
    name: 'onReady',
    hook: onReadyHookHandler
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & ((
    name: 'onReady',
    hook: onReadyAsyncHookHandler,
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & ((
    name: 'onClose',
    hook: onCloseHookHandler<RawServer, RawRequest, RawReply, Logger>
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>)

  /**
   * Set the 404 handler
   */
  setNotFoundHandler: (<RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    handler: (request: FastifyRequest<RouteGeneric, RawServer, RawRequest>, reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric>) => void
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>) & (<RouteGeneric extends RouteGenericInterface = RouteGenericInterface, ContextConfig extends ContextConfigDefault = ContextConfigDefault>(
    opts: {
      preValidation?: preValidationHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preValidationHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
      preHandler?: preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> | Array<preHandlerHookHandler<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>>
    },
    handler: (request: FastifyRequest<RouteGeneric, RawServer, RawRequest>, reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric>) => void
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>)

  /**
   * Fastify default error handler
   */
  errorHandler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void

  /**
   * Set a function that will be called whenever an error happens
   */
  setErrorHandler: <TError extends Error = FastifyError, RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    handler: (this: FastifyInstance<RawServer, RawRequest, RawReply, Logger>, error: TError, request: FastifyRequest<RouteGeneric, RawServer, RawRequest>, reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric>) => void
  ) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  /**
   * Set the schema validator for all routes.
   */
  setValidatorCompiler: <T = FastifySchema>(schemaCompiler: FastifySchemaCompiler<T>) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  /**
   * Set the schema serializer for all routes.
   */
  setSerializerCompiler: <T = FastifySchema>(schemaCompiler: FastifySerializerCompiler<T>) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  /**
  * Set the reply serializer for all routes.
  */
  setReplySerializer: (replySerializer: (payload: unknown, statusCode: number) => string) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>

  /*
  * Set the schema error formatter for all routes.
  */
  setSchemaErrorFormatter: (errorFormatter: (errors: FastifySchemaValidationError[], dataVar: string) => Error) => FastifyInstance<RawServer, RawRequest, RawReply, Logger>
  /**
   * Add a content type parser
   */
  addContentTypeParser: AddContentTypeParser<RawServer, RawRequest>
  hasContentTypeParser: hasContentTypeParser

  /**
   * Prints the representation of the internal radix tree used by the router
   */
  printRoutes: () => string

  /**
   * Prints the representation of the plugin tree used by avvio, the plugin registration system
   */
  printPlugins: () => string

  /**
   *  Frozen read-only object registering the initial options passed down by the user to the fastify instance
   */
  initialConfig: Readonly<{
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
}
