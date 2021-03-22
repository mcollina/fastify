import { FastifyLoggerInstance } from './logger'
import { RawServerBase, RawServerDefault, RawRequestDefaultExpression, RequestBodyDefault, RequestQuerystringDefault, RequestParamsDefault, RequestHeadersDefault } from './utils'
import { RouteGenericInterface } from './route'

export interface RequestGenericInterface {
  Body?: RequestBodyDefault
  Querystring?: RequestQuerystringDefault
  Params?: RequestParamsDefault
  Headers?: RequestHeadersDefault
}

/**
 * FastifyRequest is an instance of the standard http or http2 request objects.
 * It defaults to http.IncomingMessage, and it also extends the relative request object.
 */
export interface FastifyRequest<
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
> {
  id: any
  params: RouteGeneric['Params']
  raw: RawRequest
  query: RouteGeneric['Querystring']
  log: FastifyLoggerInstance
  body: RouteGeneric['Body']

  /** in order for this to be used the user should ensure they have set the attachValidation option. */
  validationError?: Error & { validation: any, validationContext: string }

  /**
   * @deprecated Use `raw` property
   */
  readonly req: RawRequest
  readonly headers: RawRequest['headers'] & RouteGeneric['Headers'] // this enables the developer to extend the existing http(s|2) headers list
  readonly ip: string
  readonly ips?: string[]
  readonly hostname: string
  readonly url: string
  readonly protocol: 'http' | 'https'
  readonly method: string
  readonly routerPath: string
  readonly routerMethod: string
  readonly is404: boolean
  readonly socket: RawRequest['socket']

  // Prefer `socket` over deprecated `connection` property in node 13.0.0 or higher
  // @deprecated
  readonly connection: RawRequest['socket']
}
