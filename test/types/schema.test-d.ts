import { expectAssignable, expectError } from 'tsd'
import fastify, { FastifyInstance, FastifyRequest, FastifySchema } from '../../fastify'
import { RouteGenericInterface } from '../../types/route'
import { ContextConfigDefault } from '../../types/utils'
import { FastifyReply } from '../../types/reply'
import Ajv = require('ajv')

const server = fastify()

expectAssignable<FastifyInstance>(server.get(
  '/full-schema',
  {
    schema: {
      body: { type: 'null' },
      querystring: { type: 'null' },
      params: { type: 'null' },
      headers: { type: 'null' },
      response: { type: 'null' }
    }
  },
  () => { }
))

expectAssignable<FastifyInstance>(server.get(
  '/empty-schema',
  {
    schema: {}
  },
  () => { }
))

expectAssignable<FastifyInstance>(server.get(
  '/no-schema',
  {},
  () => { }
))

expectAssignable<FastifyInstance>(server.get<RouteGenericInterface, ContextConfigDefault, { validate: (data: any) => any }>(
  '/no-schema',
{
  schema: {},
  validatorCompiler: ({ schema }) => {
    // Error: Property 'validate' does not exist on type 'FastifySchema'.
    return (data: any) => schema.validate(data)
  }
},
() => { }
))

expectAssignable<FastifyInstance>(
  server.route<RouteGenericInterface, ContextConfigDefault, { validate: (data: any) => any }>(
    {
      schema: {},
      validatorCompiler: ({ schema }) => {
        // Error: Property 'validate' does not exist on type 'FastifySchema'.
        return (data: any) => schema.validate(data)
      },
      method: 'POST',
      url: '/',
      handler: async (_request: FastifyRequest, _reply: FastifyReply) => {}
    }
  )
)

expectAssignable<FastifyInstance>(server.setValidatorCompiler(({ schema }) => {
  return new Ajv().compile(schema)
}))

expectAssignable<FastifyInstance>(server.setSerializerCompiler(() => {
  return data => JSON.stringify(data)
}))

expectAssignable<FastifyInstance>(server.post('/test', {
  validatorCompiler: ({ schema }) => {
    return data => {
      if (data === undefined || data.constructor !== Object) {
        return { error: new Error('value is not an object') }
      }
      return { value: data }
    }
  }
}, async req => req.body))

expectAssignable<FastifyInstance>(server.setValidatorCompiler<FastifySchema & { validate: Record<string, unknown> }>(
  function ({ schema }) {
    return new Ajv().compile(schema.validate)
  }
))

expectAssignable<FastifyInstance>(server.setSerializerCompiler<FastifySchema & { validate: string }>(
  () => data => JSON.stringify(data)
))

expectError(server.get(
  '/unknown-schema-prop',
  {
    schema: {
      unknown: { type: 'null' }
    }
  },
  () => { }
))
