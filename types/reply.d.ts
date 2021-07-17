import { RawReplyDefaultExpression, RawServerBase, RawServerDefault, ContextConfigDefault, RawRequestDefaultExpression, ReplyDefault } from './utils'
import { FastifyContext } from './context'
import { FastifyLoggerInstance } from './logger'
import { FastifyRequest } from './request'
import { RouteGenericInterface } from './route'

export interface ReplyGenericInterface {
  Reply?: ReplyDefault;
}

/**
 * FastifyReply is an instance of the standard http or http2 reply types.
 * It defaults to http.ServerResponse, and it also extends the relative reply object.
 */
export interface FastifyReply<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
> {
  raw: RawReply;
  context: FastifyContext<ContextConfig>;
  log: FastifyLoggerInstance;
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest>;
  code(statusCode: number): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  status(statusCode: number): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  statusCode: number;
  sent: boolean;
  send(payload?: RouteGeneric['Reply'], isError?: boolean): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  header(key: string, value: any): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  headers(values: {[key: string]: any}): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  getHeader(key: string): string | undefined;
  getHeaders(): {
    // Node's `getHeaders()` can return numbers and arrays, so they're included here as possible types.
    [key: string]: number | string | string[] | undefined;
  };
  removeHeader(key: string): void;
  hasHeader(key: string): boolean;
  // Note: should consider refactoring the argument order for redirect. statusCode is optional so it should be after the required url param
  redirect(statusCode: number, url: string): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  redirect(url: string): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  hijack(): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  callNotFound(): void;
  getResponseTime(): number;
  type(contentType: string): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  serializer(fn: (payload: any) => string): FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig>;
  serialize(payload: any): string;
  then(fulfilled: () => void, rejected: (err: Error) => void): void;
}
