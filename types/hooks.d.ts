/* eslint-disable @typescript-eslint/class-name-casing */

import { FastifyError } from './error'
import { FastifyInstance } from './instance'
import { FastifyLoggerOptions } from './logger'
import { FastifyReply } from './reply'
import { FastifyRequest, RequestGenericInterface } from './request'
import { RouteOptions } from './route'
import { ContextConfigDefault, RawReplyDefaultExpression, RawRequestDefaultExpression, RawServerBase, RawServerDefault } from './utils'
import { Readable } from 'stream'

type HookHandlerDoneFunction = (err?: FastifyError) => void

// This is used within the `preSerialization` and `onSend` hook handlers
interface DoneFuncWithErrOrRes {
  (err: FastifyError): void;
  (err: null, res: unknown): void;
}

// This is used within the `preDecoding` hook handlers
interface DoneFuncWithErrOrReadable {
  (err: FastifyError): void;
  (err: null, res: Readable): void;
}

// Lifecycle Hooks

/**
 * `onRequest` is the first hook to be executed in the request lifecycle. There was no previous hook, the next hook will be `preDecoding`.
 *  Notice: in the `onRequest` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
 */
export interface onRequestHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * You can transform the request payload stream before it is parsed with the `preDecoding` hook. It is the second hook to be executed in the request lifecycle.
 * The previous hook was `onRequest`, the next hook will be `preParsing`.
 */
export interface preDecodingHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    payload: Readable,
    done: DoneFuncWithErrOrReadable
  ): Promise<Readable> | void;
}

/**
 * `preParsing` is the third hook to be executed in the request lifecycle. The previous hook was `preDecoding`, the next hook will be `preValidation`.
 * Notice: in the `preParsing` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
 */
export interface preParsingHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * `preValidation` is the fourth hook to be executed in the request lifecycle. The previous hook was `preParsing`, the next hook will be `preHandler`.
 * Notice: in the `preValidation` hook, request.body will always be null, because the body parsing happens before the `preHandler` hook.
 */
export interface preValidationHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * `preHandler` is the fifth hook to be executed in the request lifecycle. The previous hook was `preValidation`, the next hook will be `preSerialization`.
 */
export interface preHandlerHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * `preSerialization` is the sixth hook to be executed in the request lifecycle. The previous hook was `preHandler`, the next hook will be `onSend`.
 *  Note: the hook is NOT called if the payload is a string, a Buffer, a stream or null.
 */
export interface preSerializationHookHandler<
  PreSerializationPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    payload: PreSerializationPayload,
    done: DoneFuncWithErrOrRes
  ): Promise<unknown> | void;
}

/**
 * You can change the payload with the `onSend` hook. It is the seventh hook to be executed in the request lifecycle. The previous hook was `preSerialization`, the next hook will be `onResponse`.
 * Note: If you change the payload, you may only change it to a string, a Buffer, a stream, or null.
 */
export interface onSendHookHandler<
  OnSendPayload,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    payload: OnSendPayload,
    done: DoneFuncWithErrOrRes
  ): Promise<unknown> | void;
}

/**
 * `onResponse` is the eighth and last hook in the request hook lifecycle. The previous hook was `onSend`, there is no next hook.
 * The onResponse hook is executed when a response has been sent, so you will not be able to send more data to the client. It can however be useful for sending data to external services, for example to gather statistics.
 */
export interface onResponseHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * This hook is useful if you need to do some custom error logging or add some specific header in case of error.
 * It is not intended for changing the error, and calling reply.send will throw an exception.
 * This hook will be executed only after the customErrorHandler has been executed, and only if the customErrorHandler sends an error back to the user (Note that the default customErrorHandler always sends the error back to the user).
 * Notice: unlike the other hooks, pass an error to the done function is not supported.
 */
export interface onErrorHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    request: FastifyRequest<RawServer, RawRequest, RequestGeneric>,
    reply: FastifyReply<RawServer, RawReply, ContextConfig>,
    error: FastifyError,
    done: () => void
  ): Promise<unknown> | void;
}

// Application Hooks

/**
 * Triggered when a new route is registered. Listeners are passed a routeOptions object as the sole parameter. The interface is synchronous, and, as such, the listener does not get passed a callback
 */
export interface onRouteHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
  ContextConfig = ContextConfigDefault
> {
  (
    opts: RouteOptions<RawServer, RawRequest, RawReply, RequestGeneric, ContextConfig> & { path: string; prefix: string }
  ): Promise<unknown> | void;
}

/**
 * Triggered when a new plugin is registered and a new encapsulation context is created. The hook will be executed before the registered code.
 * This hook can be useful if you are developing a plugin that needs to know when a plugin context is formed, and you want to operate in that specific context.
 * Note: This hook will not be called if a plugin is wrapped inside fastify-plugin.
 */
export interface onRegisterHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  Logger = FastifyLoggerOptions<RawServer>
> {
  (
    instance: FastifyInstance<RawServer, RawRequest, RawReply, Logger>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void; // documentation is missing the `done` method
}

/**
 * Triggered when fastify.listen() or fastify.ready() is invoked to start the server. It is useful when plugins need a "ready" event, for example to load data before the server start listening for requests.
 */
export interface onReadyHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  Logger = FastifyLoggerOptions<RawServer>
> {
  (
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}

/**
 * Triggered when fastify.close() is invoked to stop the server. It is useful when plugins need a "shutdown" event, for example to close an open connection to a database.
 */
export interface onCloseHookHandler<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  Logger = FastifyLoggerOptions<RawServer>
> {
  (
    instance: FastifyInstance<RawServer, RawRequest, RawReply, Logger>,
    done: HookHandlerDoneFunction
  ): Promise<unknown> | void;
}
