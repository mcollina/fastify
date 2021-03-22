/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { Readable } from 'stream'
import { FastifyInstance } from './instance'
import { RouteOptions, RouteGenericInterface } from './route'
import { RawServerBase, RawServerDefault, RawRequestDefaultExpression, RawReplyDefaultExpression, ContextConfigDefault } from './utils'
import { FastifyRequest } from './request'
import { FastifyReply } from './reply'
import { FastifyError } from 'fastify-error'
import { FastifyLoggerInstance } from './logger'

type HookHandlerDoneFunction = <TError extends Error = FastifyError>(err?: TError) => void

interface RequestPayload extends Readable {
  receivedEncodedLength?: number
}

// Lifecycle Hooks

/**
 * `onRequest` is the first hook to be executed in the request lifecycle. There was no previous hook, the next hook will be `preParsing`.
 *  Notice: in the `onRequest` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
 */
export type onRequestHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  done: HookHandlerDoneFunction
) => void

export type onRequestAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
) => Promise<unknown>

/**
 * `preParsing` is the second hook to be executed in the request lifecycle. The previous hook was `onRequest`, the next hook will be `preValidation`.
 * Notice: in the `preParsing` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
 */
export type preParsingHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: RequestPayload,
  done: <TError extends Error = FastifyError>(err?: TError | null, res?: RequestPayload) => void
) => void

export type preParsingAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: RequestPayload,
) => Promise<RequestPayload | unknown>

/**
 * `preValidation` is the third hook to be executed in the request lifecycle. The previous hook was `preParsing`, the next hook will be `preHandler`.
 */
export type preValidationHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  done: HookHandlerDoneFunction
) => void

export type preValidationAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
) => Promise<unknown>

/**
 * `preHandler` is the fourth hook to be executed in the request lifecycle. The previous hook was `preValidation`, the next hook will be `preSerialization`.
 */
export type preHandlerHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  done: HookHandlerDoneFunction
) => void

export type preHandlerAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
) => Promise<unknown>

// This is used within the `preSerialization` and `onSend` hook handlers
interface DoneFuncWithErrOrRes {
  (): void
  <TError extends Error = FastifyError>(err: TError): void
  (err: null, res: unknown): void
}

/**
 * `preSerialization` is the fifth hook to be executed in the request lifecycle. The previous hook was `preHandler`, the next hook will be `onSend`.
 *  Note: the hook is NOT called if the payload is a string, a Buffer, a stream or null.
 */
export type preSerializationHookHandler<
  PreSerializationPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: PreSerializationPayload,
  done: DoneFuncWithErrOrRes
) => void

export type preSerializationAsyncHookHandler<
  PreSerializationPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: PreSerializationPayload
) => Promise<unknown>

/**
 * You can change the payload with the `onSend` hook. It is the sixth hook to be executed in the request lifecycle. The previous hook was `preSerialization`, the next hook will be `onResponse`.
 * Note: If you change the payload, you may only change it to a string, a Buffer, a stream, or null.
 */
export type onSendHookHandler<
  OnSendPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: OnSendPayload,
  done: DoneFuncWithErrOrRes
) => void

export type onSendAsyncHookHandler<
  OnSendPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  payload: OnSendPayload,
) => Promise<unknown>

/**
 * `onResponse` is the seventh and last hook in the request hook lifecycle. The previous hook was `onSend`, there is no next hook.
 * The onResponse hook is executed when a response has been sent, so you will not be able to send more data to the client. It can however be useful for sending data to external services, for example to gather statistics.
 */
export type onResponseHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  done: HookHandlerDoneFunction
) => void

export type onResponseAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
) => Promise<unknown>

/**
 * `onTimeout` is useful if you need to monitor the request timed out in your service. (if the `connectionTimeout` property is set on the fastify instance)
 * The onTimeout hook is executed when a request is timed out and the http socket has been hanged up. Therefore you will not be able to send data to the client.
 */
export type onTimeoutHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  done: HookHandlerDoneFunction
) => void

export type onTimeoutAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>
) => Promise<unknown>

/**
 * This hook is useful if you need to do some custom error logging or add some specific header in case of error.
 * It is not intended for changing the error, and calling reply.send will throw an exception.
 * This hook will be executed only after the customErrorHandler has been executed, and only if the customErrorHandler sends an error back to the user (Note that the default customErrorHandler always sends the error back to the user).
 * Notice: unlike the other hooks, pass an error to the done function is not supported.
 */
export type onErrorHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  TError extends Error = FastifyError
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  error: TError,
  done: () => void
) => void

export type onErrorAsyncHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  TError extends Error = FastifyError
> = (
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>,
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>,
  error: TError
) => Promise<unknown>

// Application Hooks

/**
 * Triggered when a new route is registered. Listeners are passed a routeOptions object as the sole parameter. The interface is synchronous, and, as such, the listener does not get passed a callback
 */
export type onRouteHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault
> = (
  opts: RouteOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig> & { routePath: string, path: string, prefix: string }
) => Promise<unknown> | void

/**
 * Triggered when a new plugin is registered and a new encapsulation context is created. The hook will be executed before the registered code.
 * This hook can be useful if you are developing a plugin that needs to know when a plugin context is formed, and you want to operate in that specific context.
 * Note: This hook will not be called if a plugin is wrapped inside fastify-plugin.
 */
// documentation is missing the `done` method
export type onRegisterHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  Logger = FastifyLoggerInstance
> = (
  instance: FastifyInstance<RawServer, RawRequest, RawReply, Logger>,
  done: HookHandlerDoneFunction
) => Promise<unknown> | void

/**
 * Triggered when fastify.listen() or fastify.ready() is invoked to start the server. It is useful when plugins need a "ready" event, for example to load data before the server start listening for requests.
 */
export type onReadyHookHandler = (
  done: HookHandlerDoneFunction
) => void

export type onReadyAsyncHookHandler = () => Promise<unknown>
/**
 * Triggered when fastify.close() is invoked to stop the server. It is useful when plugins need a "shutdown" event, for example to close an open connection to a database.
 */
export type onCloseHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  Logger = FastifyLoggerInstance
> = (
  instance: FastifyInstance<RawServer, RawRequest, RawReply, Logger>,
  done: HookHandlerDoneFunction
) => Promise<unknown> | void
