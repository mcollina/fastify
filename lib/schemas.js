'use strict'

const fastClone = require('rfdc')({ circles: false, proto: true })
const { kSchemaVisited } = require('./symbols')
const kFluentSchema = Symbol.for('fluent-schema-object')

const {
  FST_ERR_SCH_MISSING_ID,
  FST_ERR_SCH_ALREADY_PRESENT,
  FST_ERR_SCH_DUPLICATE
} = require('./errors')

const SCHEMAS_SOURCE = ['params', 'body', 'querystring', 'query', 'headers']

class Schemas {
  constructor (initStore) {
    this.store = initStore || {}
  }

  add (inputSchema) {
    const schema = fastClone((inputSchema.isFluentSchema || inputSchema.isFluentJSONSchema || inputSchema[kFluentSchema])
      ? inputSchema.valueOf()
      : inputSchema
    )

    // devs can add schemas without $id, but with $def instead
    const id = schema.$id
    if (!id) {
      throw new FST_ERR_SCH_MISSING_ID()
    }

    if (this.store[id]) {
      throw new FST_ERR_SCH_ALREADY_PRESENT(id)
    }

    this.store[id] = schema
  }

  getSchemas () {
    return Object.assign({}, this.store)
  }

  getSchema (schemaId) {
    return this.store[schemaId]
  }
}

function normalizeSchema (routeSchemas, serverOptions) {
  if (routeSchemas[kSchemaVisited]) {
    return routeSchemas
  }

  // alias query to querystring schema
  if (routeSchemas.query) {
    // check if our schema has both querystring and query
    if (routeSchemas.querystring) {
      throw new FST_ERR_SCH_DUPLICATE('querystring')
    }
    routeSchemas.querystring = routeSchemas.query
  }

  generateFluentSchema(routeSchemas)

  // let's check if our schemas have a custom prototype
  for (const key of ['headers', 'querystring', 'params', 'body']) {
    if (typeof routeSchemas[key] === 'object' && Object.getPrototypeOf(routeSchemas[key]) !== Object.prototype) {
      return routeSchemas
    }
  }

  if (routeSchemas.body) {
    routeSchemas.body = getSchemaAnyway(routeSchemas.body, serverOptions.jsonShorthand)
  }

  if (routeSchemas.headers) {
    routeSchemas.headers = getSchemaAnyway(routeSchemas.headers, serverOptions.jsonShorthand)
  }

  if (routeSchemas.querystring) {
    routeSchemas.querystring = getSchemaAnyway(routeSchemas.querystring, serverOptions.jsonShorthand)
  }

  if (routeSchemas.params) {
    routeSchemas.params = getSchemaAnyway(routeSchemas.params, serverOptions.jsonShorthand)
  }

  if (routeSchemas.response) {
    const httpCodes = Object.keys(routeSchemas.response)
    for (const code of httpCodes) {
      routeSchemas.response[code] = getSchemaAnyway(routeSchemas.response[code], serverOptions.jsonShorthand)
    }
  }

  routeSchemas[kSchemaVisited] = true
  return routeSchemas
}

function generateFluentSchema (schema) {
  for (const key of SCHEMAS_SOURCE) {
    if (schema[key] && (schema[key].isFluentSchema || schema[key][kFluentSchema])) {
      schema[key] = schema[key].valueOf()
    }
  }

  if (schema.response) {
    const httpCodes = Object.keys(schema.response)
    for (const code of httpCodes) {
      if (schema.response[code].isFluentSchema || schema.response[code][kFluentSchema]) {
        schema.response[code] = schema.response[code].valueOf()
      }
    }
  }
}

function getSchemaAnyway (schema, jsonShorthand) {
  if (!jsonShorthand || schema.$ref || schema.oneOf || schema.allOf || schema.anyOf || schema.$merge || schema.$patch) return schema
  if (!schema.type && !schema.properties) {
    return {
      type: 'object',
      properties: schema
    }
  }
  return schema
}

module.exports = {
  buildSchemas (initStore) { return new Schemas(initStore) },
  normalizeSchema
}
