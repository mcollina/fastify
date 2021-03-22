/* eslint-disable @typescript-eslint/no-invalid-void-type */
import { expectType } from 'tsd'
import fastify, { FastifyLogFn, LogLevel, FastifyLoggerInstance } from '../../fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import * as pino from 'pino'

expectType<FastifyLoggerInstance>(fastify().log)

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
class Foo {}

['trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach(logLevel => {
  expectType<FastifyLogFn>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel])
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel](''))
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel]({}))
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel]({ foo: 'bar' }))
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel](new Error()))
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel](new Foo()))
  expectType<void>(fastify<Server, IncomingMessage, ServerResponse, FastifyLoggerInstance>().log[logLevel as LogLevel](0))
})

interface CustomLogger extends FastifyLoggerInstance {
  customMethod: (msg: string, ...args: unknown[]) => void
}

class CustomLoggerImpl implements CustomLogger {
  customMethod (msg: string, ...args: unknown[]): void { console.log(msg, args) }

  // Implementation signature must be compatible with all overloads of FastifyLogFn
  info (arg1: unknown, arg2?: unknown, ...args: unknown[]): void {
    console.log(arg1, arg2, ...args)
  }

  warn (...args: unknown[]): void { console.log(args) }
  error (...args: unknown[]): void { console.log(args) }
  fatal (...args: unknown[]): void { console.log(args) }
  trace (...args: unknown[]): void { console.log(args) }
  debug (...args: unknown[]): void { console.log(args) }
  child (): CustomLoggerImpl { return new CustomLoggerImpl() }
}

const customLogger = new CustomLoggerImpl()

const serverWithCustomLogger = fastify<
Server,
IncomingMessage,
ServerResponse,
CustomLoggerImpl
>({ logger: customLogger })

expectType<CustomLoggerImpl>(serverWithCustomLogger.log)

const serverWithPino = fastify<
Server,
IncomingMessage,
ServerResponse,
pino.Logger
>({
  logger: pino({
    level: 'info',
    redact: ['x-userinfo']
  })
})

expectType<pino.Logger>(serverWithPino.log)

const serverWithLogOptions = fastify<
Server,
IncomingMessage,
ServerResponse
>({
  logger: {
    level: 'info'
  }
})

expectType<FastifyLoggerInstance>(serverWithLogOptions.log)

const serverAutoInferringTypes = fastify({
  logger: {
    level: 'info'
  }
})

expectType<FastifyLoggerInstance>(serverAutoInferringTypes.log)

const serverWithAutoInferredPino = fastify({
  logger: pino({
    level: 'info',
    redact: ['x-userinfo']
  })
})

expectType<pino.Logger>(serverWithAutoInferredPino.log)

const serverAutoInferredPinoPrettyBooleanOption = fastify({
  logger: {
    prettyPrint: true
  }
})

expectType<FastifyLoggerInstance>(serverAutoInferredPinoPrettyBooleanOption.log)

const serverAutoInferredPinoPrettyObjectOption = fastify({
  logger: {
    prettyPrint: {
      translateTime: true,
      levelFirst: false,
      messageKey: 'msg',
      timestampKey: 'time',
      messageFormat: false,
      colorize: true,
      crlf: false,
      errorLikeObjectKeys: ['err', 'error'],
      errorProps: '',
      search: 'foo == `bar`',
      ignore: 'pid,hostname',
      suppressFlushSyncWarning: true
    }
  }
})

expectType<FastifyLoggerInstance>(serverAutoInferredPinoPrettyObjectOption.log)

const serverAutoInferredSerializerObjectOption = fastify({
  logger: {
    serializers: {
      req (IncomingMessage) {
        return {
          method: 'method',
          url: 'url',
          version: 'version',
          hostname: 'hostname',
          remoteAddress: 'remoteAddress',
          remotePort: 80,
          other: ''
        }
      },
      res (ServerResponse) {
        return {
          statusCode: 'statusCode'
        }
      },
      err (FastifyError) {
        return {
          other: '',
          type: 'type',
          message: 'msg',
          stack: 'stack'
        }
      }
    }
  }
})

expectType<FastifyLoggerInstance>(serverAutoInferredSerializerObjectOption.log)
