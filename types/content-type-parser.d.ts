/* eslint-disable @typescript-eslint/no-explicit-any */

import { Buffer } from 'buffer'
import { RawServerBase, RawServerDefault, RawRequestDefaultExpression } from './utils'
import { FastifyRequest, RequestGenericInterface } from './request'

type ContentTypeParserDoneFunction = (err: Error | null, body?: any) => void

/**
 * Body parser method that operatoes on request body
 */
export type FastifyBodyParser<
  RawBody extends string | Buffer,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
> = ((request: FastifyRequest<RawServer, RawRequest, RequestGeneric>, rawBody: RawBody, done: ContentTypeParserDoneFunction) => void)
| ((request: FastifyRequest<RawServer, RawRequest, RequestGeneric>, rawBody: RawBody) => Promise<any>)

/**
 * Content Type Parser method that operates on request content
 */
export type FastifyContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RequestGeneric extends RequestGenericInterface = RequestGenericInterface,
> = ((request: FastifyRequest<RawServer, RawRequest, RequestGeneric>, payload: RawRequest) => Promise<any>)
| ((request: FastifyRequest<RawServer, RawRequest, RequestGeneric>, payload: RawRequest, done: ContentTypeParserDoneFunction) => void)

/**
 * Content Type Parser method that operates on request content - Deprecated Version
 */
export type FastifyDeprecatedContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>
> = ((req: RawRequest) => Promise<any>)
| ((req: RawRequest, done: ContentTypeParserDoneFunction) => void)

/**
 * Natively, Fastify only supports 'application/json' and 'text/plain' content types. The default charset is utf-8. If you need to support different content types, you can use the addContentTypeParser API. The default JSON and/or plain text parser can be changed.
 */
export interface AddContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>
> {
  (
    contentType: string | string[],
    opts: {
      bodyLimit?: number;
    },
    parser: FastifyContentTypeParser<RawServer, RawRequest> | FastifyDeprecatedContentTypeParser<RawServer, RawRequest>
  ): void;
}

export interface AddContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>
> {
  (
    contentType: string | string[],
    parser: FastifyContentTypeParser<RawServer, RawRequest> | FastifyDeprecatedContentTypeParser<RawServer, RawRequest>
  ): void;
}

export interface AddContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>
>{
  <parseAs extends string | Buffer>(
    contentType: string | string[],
    opts: {
      parseAs: parseAs extends Buffer ? 'buffer' : 'string';
      bodyLimit?: number;
    },
    parser: FastifyBodyParser<parseAs, RawServer, RawRequest>
  ): void;
}

/**
 * Checks for a type parser of a content type
 */
export type hasContentTypeParser = (contentType: string) => boolean
