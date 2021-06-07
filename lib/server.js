'use strict'

const assert = require('assert')
const http = require('http')
const https = require('https')

const { kState, kOptions } = require('./symbols')
const { FST_ERR_HTTP2_INVALID_VERSION, FST_ERR_REOPENED_CLOSE_SERVER, FST_ERR_REOPENED_SERVER } = require('./errors')

function createServer (options, httpHandler) {
  assert(options, 'Missing options')
  assert(httpHandler, 'Missing http handler')

  let server = null
  if (options.serverFactory) {
    server = options.serverFactory(httpHandler, options)
  } else if (options.https) {
    if (options.http2) {
      server = http2().createSecureServer(options.https, httpHandler)
      server.on('session', sessionTimeout(options.timeouts.http2SessionTimeout))
    } else {
      server = https.createServer(options.https, httpHandler)
      server.keepAliveTimeout = options.timeouts.keepAliveTimeout
    }
  } else if (options.http2) {
    server = http2().createServer(httpHandler)
    server.on('session', sessionTimeout(options.timeouts.http2SessionTimeout))
  } else {
    server = http.createServer(httpHandler)
    server.keepAliveTimeout = options.timeouts.keepAliveTimeout
  }

  if (!options.serverFactory) {
    server.setTimeout(options.timeouts.connectionTimeout)
  }

  return { server, listen }

  // `this` is the Fastify object
  function listen () {
    const normalizeListenArgs = (args) => {
      if (args.length === 0) {
        return { port: 0, host: 'localhost' }
      }

      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : undefined
      const options = { cb: cb }

      const firstArg = args[0]
      const argsLength = args.length
      const lastArg = args[argsLength - 1]
      /* Deal with listen (options) || (handle[, backlog]) */
      if (typeof firstArg === 'object' && firstArg !== null) {
        options.backlog = argsLength > 1 ? lastArg : undefined
        Object.assign(options, firstArg)
      } else if (typeof firstArg === 'string' && isNaN(firstArg)) {
        /* Deal with listen (pipe[, backlog]) */
        options.path = firstArg
        options.backlog = argsLength > 1 ? lastArg : undefined
      } else {
        /* Deal with listen ([port[, host[, backlog]]]) */
        options.port = argsLength >= 1 && firstArg ? firstArg : 0
        // This will listen to what localhost is.
        // It can be 127.0.0.1 or ::1, depending on the operating system.
        // Fixes https://github.com/fastify/fastify/issues/1022.
        options.host = argsLength >= 2 && args[1] ? args[1] : 'localhost'
        options.backlog = argsLength >= 3 ? args[2] : undefined
      }

      return options
    }

    const listenOptions = normalizeListenArgs(Array.from(arguments))
    const cb = listenOptions.cb

    const wrap = err => {
      server.removeListener('error', wrap)
      if (!err) {
        const address = logServerAddress()
        cb(null, address)
      } else {
        this[kState].listening = false
        cb(err, null)
      }
    }

    const listenPromise = (listenOptions) => {
      if (this[kState].listening && this[kState].closing) {
        return Promise.reject(new FST_ERR_REOPENED_CLOSE_SERVER())
      } else if (this[kState].listening) {
        return Promise.reject(new FST_ERR_REOPENED_SERVER())
      }

      return this.ready().then(() => {
        let errEventHandler
        const errEvent = new Promise((resolve, reject) => {
          errEventHandler = (err) => {
            this[kState].listening = false
            reject(err)
          }
          server.once('error', errEventHandler)
        })
        const listen = new Promise((resolve, reject) => {
          server.listen(listenOptions, () => {
            server.removeListener('error', errEventHandler)
            resolve(logServerAddress())
          })
          // we set it afterwards because listen can throw
          this[kState].listening = true
        })

        return Promise.race([
          errEvent, // e.g invalid port range error is always emitted before the server listening
          listen
        ])
      })
    }

    const logServerAddress = () => {
      let address = server.address()
      const isUnixSocket = typeof address === 'string'
      /* istanbul ignore next */
      if (!isUnixSocket) {
        if (address.address.indexOf(':') === -1) {
          address = address.address + ':' + address.port
        } else {
          address = '[' + address.address + ']:' + address.port
        }
      }
      /* istanbul ignore next */
      address = (isUnixSocket ? '' : ('http' + (this[kOptions].https ? 's' : '') + '://')) + address
      this.log.info('Server listening at ' + address)
      return address
    }

    if (cb === undefined) return listenPromise(listenOptions)

    this.ready(err => {
      if (err != null) return cb(err)

      if (this[kState].listening && this[kState].closing) {
        return cb(new FST_ERR_REOPENED_CLOSE_SERVER(), null)
      } else if (this[kState].listening) {
        return cb(new FST_ERR_REOPENED_SERVER(), null)
      }

      server.once('error', wrap)
      server.listen(listenOptions, wrap)

      this[kState].listening = true
    })
  }
}

function http2 () {
  try {
    return require('http2')
  } catch (err) {
    throw new FST_ERR_HTTP2_INVALID_VERSION()
  }
}

function sessionTimeout (timeout) {
  return function (session) {
    session.setTimeout(timeout, close)
  }
}

function close () {
  this.close()
}

module.exports = { createServer }
