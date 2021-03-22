/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { expectAssignable, expectError } from 'tsd'
import fastify, { FastifyInstance, FastifyPluginAsync } from '../../fastify'

const testPluginOptsAsync: FastifyPluginAsync = async function (_instance, _opts) { }

// Type validation
expectError(fastify().register(testPluginOptsAsync, { prefix: 1 }))
expectError(fastify().register(testPluginOptsAsync, { logLevel: () => ({}) }))
expectError(fastify().register(testPluginOptsAsync, { logSerializers: () => ({}) }))
expectError(fastify().register({}))

expectAssignable<FastifyInstance>(
  fastify().register(
    testPluginOptsAsync, { prefix: '/example', logLevel: 'info', logSerializers: { key: (value: any) => `${value}` } }
  )
)
