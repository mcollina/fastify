'use strict'

const warning = require('fastify-warning')()

/**
 * Deprecation codes:
 *   - FSTDEP001
 *   - FSTDEP002
 *   - FSTDEP003
 *   - FSTDEP004
 *   - FSTDEP005
 */

warning.create('FastifyDeprecation', 'FSTDEP001', 'You are accessing the Node.js core request object via "request.req", Use "request.raw" instead.')

warning.create('FastifyDeprecation', 'FSTDEP002', 'You are accessing the Node.js core response object via "reply.res", Use "reply.raw" instead.')

warning.create('FastifyDeprecation', 'FSTDEP003', 'You are using the legacy Content Type Parser function signature. Use the one suggested in the documentation instead.')

warning.create('FastifyDeprecation', 'FSTDEP004', 'You are using the legacy preParsing hook signature. Use the one suggested in the documentation instead.')

warning.create('FastifyDeprecation', 'FSTDEP005', 'You are accessing the deprecated "request.connection" property. Use "request.socket" instead.')

warning.create('FastifyDeprecation', 'FSTDEP006', 'You are decorating Request/Reply with a reference type. This reference is shared amongst all requests. Use onRequest hook instead. Property: %s')

warning.create('FastifyDeprecation', 'FSTDEP007', 'You are trying to set a HEAD route using "exposeHeadRoute" route flag when a sibling route is already set. See documentation for more info.')

warning.create('FastifyDeprecation', 'FSTDEP008', 'You are using the legacy way to add route-level hooks. Use the one suggested in the documentation instead.')

module.exports = warning
