import { Buffer } from "buffer";
import { RawServerBase, RawServerDefault, RawRequestBase, RawRequestDefault } from './utils';

/**
 * Body parser method that operatoes on request body
 */
export type FastifyBodyParser<
  RawBody extends string | Buffer,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestBase = RawRequestDefault<RawServer>,
> = ((req: RawRequest, rawBody: RawBody, done: (err: Error | null, body?: any) => void) => void)
  | ((req: RawRequest, rawBody: RawBody) => Promise<any>)

/**
 * Content Type Parser method that operates on request content
 */
export type FastifyContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestBase = RawRequestDefault<RawServer>
> = ((req: RawRequest, done: (err: Error | null, body?: any) => void) => void)
  | ((req: RawRequest) => Promise<any>)

/**
 * Natively, Fastify only supports 'application/json' and 'text/plain' content types. The default charset is utf-8. If you need to support different content types, you can use the addContentTypeParser API. The default JSON and/or plain text parser can be changed.
 */
export interface addContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestBase = RawRequestDefault<RawServer>
> {
  (
    contentType: string | string[],
    opts: {
      bodyLimit?: number
    },
    parser: FastifyContentTypeParser<RawServer, RawRequest>
  ): void
}

export interface addContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestBase = RawRequestDefault<RawServer>
> {
  (contentType: string | string[], parser: FastifyContentTypeParser<RawServer, RawRequest>): void
}

export interface addContentTypeParser<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestBase = RawRequestDefault<RawServer>
>{
  <parseAs extends string | Buffer>(
    contentType: string | string[], 
    opts: { 
      parseAs: parseAs extends Buffer ? 'buffer' : 'string',
      bodyLimit?: number
    }, 
    parser: FastifyBodyParser<parseAs, RawServer, RawRequest>
  ): void
}

/**
 * Checks for a type parser of a content type
 */
export type hasContentTypeParser = (contentType: string) => boolean