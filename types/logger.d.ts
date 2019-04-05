import * as http from 'http'
import * as net from 'net'

import { FastifyError } from './error'
import { RawRequestBase, RawRequestDefault, RawReplyBase, RawReplyDefault } from './utils';

type WriteFn = (msg: string, ...args: any[]) => void
type WriteFnWithObj = (obj: {}, msg?: string, ...args: any[]) => void

export interface FastifyLoggerOptions<
  RawRequest extends RawRequestBase = RawRequestDefault,
  RawReply extends RawReplyBase = RawReplyDefault
> {
  serializers?: {
    req: (req: RawRequest) => {
      method: string,
      url: string,
      version: string,
      hostname: string,
      remoteAddress: string,
      remotePort: number
    },
    err: (err: FastifyError) => {
      type: string;
      message: string;
      stack: string;
      [key: string]: any;
    },
    res: (res: RawReply) => {
      statusCode: string | number
    }
  };
  info: WriteFn | WriteFnWithObj;
  error: WriteFn | WriteFnWithObj;
  debug: WriteFn | WriteFnWithObj;
  fatal: WriteFn | WriteFnWithObj;
  warn: WriteFn | WriteFnWithObj;
  trace: WriteFn | WriteFnWithObj;
  child: WriteFn | WriteFnWithObj | FastifyLogger;
  genReqId?: string;
}

/**
Planning on using Pino as your logger?
1. Download and install pino types `npm i -s @types/pino
2. Add the following code block to a type declaration file
```typescript
import * as pino from 'pino' 
namespace fastify {
  interface FastifyInterface {
    logger: FastifyLogger | pino
  }
}
```
3. You now have access to the pino logger typings
*/
type PinoObject = object

export type FastifyLoggerFunction = (opts: FastifyLoggerOptions) => void
export type FastifyLogger = boolean | FastifyLoggerFunction | PinoObject
