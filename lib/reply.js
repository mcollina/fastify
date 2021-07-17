'use strict'

const eos = require('readable-stream').finished
const statusCodes = require('http').STATUS_CODES
const FJS = require('fast-json-stringify')
const {
  kSchemaResponse,
  kFourOhFourContext,
  kReplyErrorHandlerCalled,
  kReplyHijacked,
  kReplyStartTime,
  kReplySerializer,
  kReplySerializerDefault,
  kReplyHeaders,
  kReplyHasStatusCode,
  kReplyIsRunningOnErrorHook,
  kDisableRequestLogging
} = require('./symbols.js')
const { hookRunner, hookIterator, onSendHookRunner } = require('./hooks')

const internals = require('./handleRequest')[Symbol.for('internals')]
const loggerUtils = require('./logger')
const now = loggerUtils.now
const wrapThenable = require('./wrapThenable')
const setErrorHeaders = require('./setErrorHeaders')

const serializeError = FJS({
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    code: { type: 'string' },
    error: { type: 'string' },
    message: { type: 'string' }
  }
})

const CONTENT_TYPE = {
  JSON: 'application/json; charset=utf-8',
  PLAIN: 'text/plain; charset=utf-8',
  OCTET: 'application/octet-stream'
}
const {
  FST_ERR_REP_INVALID_PAYLOAD_TYPE,
  FST_ERR_REP_ALREADY_SENT,
  FST_ERR_REP_SENT_VALUE,
  FST_ERR_SEND_INSIDE_ONERR,
  FST_ERR_BAD_STATUS_CODE
} = require('./errors')
const warning = require('./warnings')

function Reply (res, request, log) {
  this.raw = res
  this[kReplySerializer] = null
  this[kReplyErrorHandlerCalled] = false
  this[kReplyIsRunningOnErrorHook] = false
  this.request = request
  this[kReplyHeaders] = {}
  this[kReplyHasStatusCode] = false
  this[kReplyStartTime] = undefined
  this.log = log
}

Object.defineProperties(Reply.prototype, {
  context: {
    get () {
      return this.request.context
    }
  },
  sent: {
    enumerable: true,
    get () {
      // We are checking whether reply was hijacked or the response has ended.
      // The response.writableEnded property was added in Node.js v12.9.0. Since
      // fastify supports older Node.js versions as well, we have to take
      // response.finished property in consideration when applicable. The
      // response.finished will be always true when the request method is HEAD
      // and http2 is used, so we have to combine that with
      // response.headersSent.
      // TODO: remove fallback when the lowest supported Node.js version >= v12.9.0
      return (this[kReplyHijacked] || (typeof this.raw.writableEnded !== 'undefined' ? this.raw.writableEnded : (this.raw.headersSent && this.raw.finished))) === true
    },
    set (value) {
      warning.emit('FSTDEP010')

      if (value !== true) {
        throw new FST_ERR_REP_SENT_VALUE()
      }

      // We throw only if sent was overwritten from Fastify
      if (this.sent && this[kReplyHijacked]) {
        throw new FST_ERR_REP_ALREADY_SENT()
      }

      this[kReplyHijacked] = true
    }
  },
  statusCode: {
    get () {
      return this.raw.statusCode
    },
    set (value) {
      this.code(value)
    }
  },
  server: {
    value: null,
    writable: true
  }
})

Reply.prototype.hijack = function () {
  this[kReplyHijacked] = true
  return this
}

Reply.prototype.send = function (payload, isError = false) {
  if (this[kReplyIsRunningOnErrorHook] === true) {
    throw new FST_ERR_SEND_INSIDE_ONERR()
  }

  if (this.sent) {
    this.log.warn({ err: new FST_ERR_REP_ALREADY_SENT() }, 'Reply already sent')
    return this
  }

  if (payload instanceof Error || isError) {
    onErrorHook(this, payload, onSendHook)
    return this
  }

  if (payload === undefined) {
    onSendHook(this, payload)
    return this
  }

  const contentType = this.getHeader('content-type')
  const hasContentType = contentType !== undefined

  if (payload !== null) {
    if (typeof payload.pipe === 'function') {
      onSendHook(this, payload)
      return this
    }

    if (Buffer.isBuffer(payload)) {
      if (hasContentType === false) {
        this[kReplyHeaders]['content-type'] = CONTENT_TYPE.OCTET
      }
      onSendHook(this, payload)
      return this
    }

    if (hasContentType === false && typeof payload === 'string') {
      this[kReplyHeaders]['content-type'] = CONTENT_TYPE.PLAIN
      onSendHook(this, payload)
      return this
    }
  }

  if (this[kReplySerializer] !== null) {
    if (typeof payload !== 'string') {
      preserializeHook(this, payload)
      return this
    } else {
      payload = this[kReplySerializer](payload)
    }

  // The indexOf below also matches custom json mimetypes such as 'application/hal+json' or 'application/ld+json'
  } else if (hasContentType === false || contentType.indexOf('json') > -1) {
    if (hasContentType === false) {
      this[kReplyHeaders]['content-type'] = CONTENT_TYPE.JSON
    } else {
      // If hasContentType === true, we have a JSON mimetype
      if (contentType.indexOf('charset') === -1) {
        // If we have simply application/json instead of a custom json mimetype
        if (contentType.indexOf('/json') > -1) {
          this[kReplyHeaders]['content-type'] = CONTENT_TYPE.JSON
        } else {
          const currContentType = this[kReplyHeaders]['content-type']
          // We extract the custom mimetype part (e.g. 'hal+' from 'application/hal+json')
          const customJsonType = currContentType.substring(
            currContentType.indexOf('/'),
            currContentType.indexOf('json') + 4
          )

          // We ensure we set the header to the proper JSON content-type if necessary
          // (e.g. 'application/hal+json' instead of 'application/json')
          this[kReplyHeaders]['content-type'] = CONTENT_TYPE.JSON.replace('/json', customJsonType)
        }
      }
    }
    if (typeof payload !== 'string') {
      preserializeHook(this, payload)
      return this
    }
  }

  onSendHook(this, payload)

  return this
}

Reply.prototype.getHeader = function (key) {
  key = key.toLowerCase()
  const res = this.raw
  let value = this[kReplyHeaders][key]
  if (value === undefined && res.hasHeader(key)) {
    value = res.getHeader(key)
  }
  return value
}

Reply.prototype.getHeaders = function () {
  return {
    ...this.raw.getHeaders(),
    ...this[kReplyHeaders]
  }
}

Reply.prototype.hasHeader = function (key) {
  key = key.toLowerCase()
  if (this[kReplyHeaders][key] !== undefined) {
    return true
  }
  return this.raw.hasHeader(key)
}

Reply.prototype.removeHeader = function (key) {
  // Node.js does not like headers with keys set to undefined,
  // so we have to delete the key.
  delete this[kReplyHeaders][key.toLowerCase()]
  return this
}

Reply.prototype.header = function (key, value) {
  const _key = key.toLowerCase()

  // default the value to ''
  value = value === undefined ? '' : value

  if (this[kReplyHeaders][_key] && _key === 'set-cookie') {
    // https://tools.ietf.org/html/rfc7230#section-3.2.2
    if (typeof this[kReplyHeaders][_key] === 'string') {
      this[kReplyHeaders][_key] = [this[kReplyHeaders][_key]]
    }
    if (Array.isArray(value)) {
      Array.prototype.push.apply(this[kReplyHeaders][_key], value)
    } else {
      this[kReplyHeaders][_key].push(value)
    }
  } else {
    this[kReplyHeaders][_key] = value
  }
  return this
}

Reply.prototype.headers = function (headers) {
  const keys = Object.keys(headers)
  /* eslint-disable no-var */
  for (var i = 0; i !== keys.length; ++i) {
    const key = keys[i]
    this.header(key, headers[key])
  }
  return this
}

Reply.prototype.code = function (code) {
  const intValue = parseInt(code)
  if (isNaN(intValue) || intValue < 100 || intValue > 600) {
    throw new FST_ERR_BAD_STATUS_CODE(code || String(code))
  }

  this.raw.statusCode = intValue
  this[kReplyHasStatusCode] = true
  return this
}

Reply.prototype.status = Reply.prototype.code

Reply.prototype.serialize = function (payload) {
  if (this[kReplySerializer] !== null) {
    return this[kReplySerializer](payload)
  } else {
    if (this.context && this.context[kReplySerializerDefault]) {
      return this.context[kReplySerializerDefault](payload, this.raw.statusCode)
    } else {
      return serialize(this.context, payload, this.raw.statusCode)
    }
  }
}

Reply.prototype.serializer = function (fn) {
  this[kReplySerializer] = fn
  return this
}

Reply.prototype.type = function (type) {
  this[kReplyHeaders]['content-type'] = type
  return this
}

Reply.prototype.redirect = function (code, url) {
  if (typeof code === 'string') {
    url = code
    code = this[kReplyHasStatusCode] ? this.raw.statusCode : 302
  }

  this.header('location', url).code(code).send()
}

Reply.prototype.callNotFound = function () {
  notFound(this)
}

Reply.prototype.getResponseTime = function () {
  let responseTime = 0

  if (this[kReplyStartTime] !== undefined) {
    responseTime = now() - this[kReplyStartTime]
  }

  return responseTime
}

// Make reply a thenable, so it could be used with async/await.
// See
// - https://github.com/fastify/fastify/issues/1864 for the discussions
// - https://promisesaplus.com/ for the definition of thenable
// - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then for the signature
Reply.prototype.then = function (fulfilled, rejected) {
  if (this.sent) {
    fulfilled()
    return
  }

  eos(this.raw, (err) => {
    // We must not treat ERR_STREAM_PREMATURE_CLOSE as
    // an error because it is created by eos, not by the stream.
    if (err && err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      if (rejected) {
        rejected(err)
      } else {
        this.log && this.log.warn('unhandled rejection on reply.then')
      }
    } else {
      fulfilled()
    }
  })
}

function preserializeHook (reply, payload) {
  if (reply.context.preSerialization !== null) {
    onSendHookRunner(
      reply.context.preSerialization,
      reply.request,
      reply,
      payload,
      preserializeHookEnd
    )
  } else {
    preserializeHookEnd(null, reply.request, reply, payload)
  }
}

function preserializeHookEnd (err, request, reply, payload) {
  if (err != null) {
    onErrorHook(reply, err)
    return
  }

  if (reply[kReplySerializer] !== null) {
    payload = reply[kReplySerializer](payload)
  } else if (reply.context && reply.context[kReplySerializerDefault]) {
    payload = reply.context[kReplySerializerDefault](payload, reply.raw.statusCode)
  } else {
    payload = serialize(reply.context, payload, reply.raw.statusCode)
  }

  onSendHook(reply, payload)
}

function onSendHook (reply, payload) {
  if (reply.context.onSend !== null) {
    onSendHookRunner(
      reply.context.onSend,
      reply.request,
      reply,
      payload,
      wrapOnSendEnd
    )
  } else {
    onSendEnd(reply, payload)
  }
}

function wrapOnSendEnd (err, request, reply, payload) {
  if (err != null) {
    onErrorHook(reply, err)
  } else {
    onSendEnd(reply, payload)
  }
}

function onSendEnd (reply, payload) {
  const res = reply.raw
  const req = reply.request
  const statusCode = res.statusCode

  if (payload === undefined || payload === null) {
    // according to https://tools.ietf.org/html/rfc7230#section-3.3.2
    // we cannot send a content-length for 304 and 204, and all status code
    // < 200.
    // For HEAD we don't overwrite the `content-length`
    if (statusCode >= 200 && statusCode !== 204 && statusCode !== 304 && req.method !== 'HEAD') {
      reply[kReplyHeaders]['content-length'] = '0'
    }

    res.writeHead(statusCode, reply[kReplyHeaders])
    // avoid ArgumentsAdaptorTrampoline from V8
    res.end(null, null, null)
    return
  }

  if (typeof payload.pipe === 'function') {
    sendStream(payload, res, reply)
    return
  }

  if (typeof payload !== 'string' && !Buffer.isBuffer(payload)) {
    throw new FST_ERR_REP_INVALID_PAYLOAD_TYPE(typeof payload)
  }

  if (!reply[kReplyHeaders]['content-length']) {
    reply[kReplyHeaders]['content-length'] = '' + Buffer.byteLength(payload)
  } else if (req.raw.method !== 'HEAD' && reply[kReplyHeaders]['content-length'] !== Buffer.byteLength(payload)) {
    reply[kReplyHeaders]['content-length'] = '' + Buffer.byteLength(payload)
  }

  res.writeHead(statusCode, reply[kReplyHeaders])

  // avoid ArgumentsAdaptorTrampoline from V8
  res.end(payload, null, null)
}

function logStreamError (logger, err, res) {
  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    if (!logger[kDisableRequestLogging]) {
      logger.info({ res }, 'stream closed prematurely')
    }
  } else {
    logger.warn({ err }, 'response terminated with an error with headers already sent')
  }
}

function sendStream (payload, res, reply) {
  let sourceOpen = true
  let errorLogged = false

  eos(payload, { readable: true, writable: false }, function (err) {
    sourceOpen = false
    if (err != null) {
      if (res.headersSent) {
        if (!errorLogged) {
          errorLogged = true
          logStreamError(reply.log, err, res)
        }
        res.destroy()
      } else {
        onErrorHook(reply, err)
      }
    }
    // there is nothing to do if there is not an error
  })

  eos(res, function (err) {
    if (sourceOpen) {
      if (err != null && res.headersSent && !errorLogged) {
        errorLogged = true
        logStreamError(reply.log, err, res)
      }
      if (typeof payload.destroy === 'function') {
        payload.destroy()
      } else if (typeof payload.close === 'function') {
        payload.close(noop)
      } else if (typeof payload.abort === 'function') {
        payload.abort()
      } else {
        reply.log.warn('stream payload does not end properly')
      }
    }
  })

  // streams will error asynchronously, and we want to handle that error
  // appropriately, e.g. a 404 for a missing file. So we cannot use
  // writeHead, and we need to resort to setHeader, which will trigger
  // a writeHead when there is data to send.
  if (!res.headersSent) {
    for (const key in reply[kReplyHeaders]) {
      res.setHeader(key, reply[kReplyHeaders][key])
    }
  } else {
    reply.log.warn('response will send, but you shouldn\'t use res.writeHead in stream mode')
  }
  payload.pipe(res)
}

function onErrorHook (reply, error, cb) {
  if (reply.context.onError !== null && reply[kReplyErrorHandlerCalled] === true) {
    reply[kReplyIsRunningOnErrorHook] = true
    onSendHookRunner(
      reply.context.onError,
      reply.request,
      reply,
      error,
      () => handleError(reply, error, cb)
    )
  } else {
    handleError(reply, error, cb)
  }
}

function handleError (reply, error, cb) {
  reply[kReplyIsRunningOnErrorHook] = false
  const res = reply.raw
  setErrorHeaders(error, reply)

  const errorHandler = reply.context.errorHandler
  if (errorHandler && reply[kReplyErrorHandlerCalled] === false) {
    reply[kReplyErrorHandlerCalled] = true
    reply[kReplyHeaders]['content-length'] = undefined
    const result = errorHandler(error, reply.request, reply)
    if (result && typeof result.then === 'function') {
      wrapThenable(result, reply)
    }
    return
  }

  const statusCode = res.statusCode
  let payload
  try {
    const serializerFn = getSchemaSerializer(reply.context, statusCode)
    payload = (serializerFn === false)
      ? serializeError({
          error: statusCodes[statusCode + ''],
          code: error.code,
          message: error.message || '',
          statusCode: statusCode
        })
      : serializerFn(Object.create(error, {
        error: { value: statusCodes[statusCode + ''] },
        message: { value: error.message || '' },
        statusCode: { value: statusCode }
      }))
  } catch (err) {
    // error is always FST_ERR_SCH_SERIALIZATION_BUILD because this is called from route/compileSchemasForSerialization
    reply.log.error({ err, statusCode: res.statusCode }, 'The serializer for the given status code failed')
    res.statusCode = 500
    payload = serializeError({
      error: statusCodes['500'],
      message: err.message,
      statusCode: 500
    })
  }

  reply[kReplyHeaders]['content-type'] = CONTENT_TYPE.JSON
  reply[kReplyHeaders]['content-length'] = '' + Buffer.byteLength(payload)

  if (cb) {
    cb(reply, payload)
    return
  }

  res.writeHead(res.statusCode, reply[kReplyHeaders])
  res.end(payload)
}

function setupResponseListeners (reply) {
  reply[kReplyStartTime] = now()

  const onResFinished = err => {
    reply.raw.removeListener('finish', onResFinished)
    reply.raw.removeListener('error', onResFinished)

    const ctx = reply.context

    if (ctx && ctx.onResponse !== null) {
      hookRunner(
        ctx.onResponse,
        onResponseIterator,
        reply.request,
        reply,
        onResponseCallback
      )
    } else {
      onResponseCallback(err, reply.request, reply)
    }
  }

  reply.raw.on('finish', onResFinished)
  reply.raw.on('error', onResFinished)
}

function onResponseIterator (fn, request, reply, next) {
  return fn(request, reply, next)
}

function onResponseCallback (err, request, reply) {
  if (reply.log[kDisableRequestLogging]) {
    return
  }

  const responseTime = reply.getResponseTime()

  if (err != null) {
    reply.log.error({
      res: reply,
      err,
      responseTime
    }, 'request errored')
    return
  }

  reply.log.info({
    res: reply,
    responseTime
  }, 'request completed')
}

function buildReply (R) {
  function _Reply (res, request, log) {
    this.raw = res
    this[kReplyErrorHandlerCalled] = false
    this[kReplyHijacked] = false
    this[kReplySerializer] = null
    this.request = request
    this[kReplyHeaders] = {}
    this[kReplyStartTime] = undefined
    this.log = log
  }
  _Reply.prototype = new R()
  return _Reply
}

function notFound (reply) {
  if (reply.context[kFourOhFourContext] === null) {
    reply.log.warn('Trying to send a NotFound error inside a 404 handler. Sending basic 404 response.')
    reply.code(404).send('404 Not Found')
    return
  }

  reply.request.context = reply.context[kFourOhFourContext]

  // preHandler hook
  if (reply.context.preHandler !== null) {
    hookRunner(
      reply.context.preHandler,
      hookIterator,
      reply.request,
      reply,
      internals.preHandlerCallback
    )
  } else {
    internals.preHandlerCallback(null, reply.request, reply)
  }
}

/**
 * This function runs when a payload that is not a string|buffer|stream or null
 * should be serialized to be streamed to the response.
 * This is the default serializer that can be customized by the user using the replySerializer
 *
 * @param {object} context the request context
 * @param {object} data the JSON payload to serialize
 * @param {number} statusCode the http status code
 * @returns {string} the serialized payload
 */
function serialize (context, data, statusCode) {
  const fnSerialize = getSchemaSerializer(context, statusCode)
  if (fnSerialize) {
    return fnSerialize(data)
  }
  return JSON.stringify(data)
}

/**
 * Search for the right JSON schema compiled function in the request context
 * setup by the route configuration `schema.response`.
 * It will look for the exact match (eg 200) or generic (eg 2xx)
 *
 * @param {object} context the request context
 * @param {number} statusCode the http status code
 * @returns {function|boolean} the right JSON Schema function to serialize
 * the reply or false if it is not set
 */
function getSchemaSerializer (context, statusCode) {
  const responseSchemaDef = context[kSchemaResponse]
  if (!responseSchemaDef) {
    return false
  }
  if (responseSchemaDef[statusCode]) {
    return responseSchemaDef[statusCode]
  }
  const fallbackStatusCode = (statusCode + '')[0] + 'xx'
  if (responseSchemaDef[fallbackStatusCode]) {
    return responseSchemaDef[fallbackStatusCode]
  }
  return false
}

function noop () { }

module.exports = Reply
module.exports.buildReply = buildReply
module.exports.setupResponseListeners = setupResponseListeners
