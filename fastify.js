'use strict'

const Avvio = require('avvio')
const http = require('http')
const querystring = require('querystring')
let lightMyRequest
let version
let versionLoaded = false

const {
  kAvvioBoot,
  kChildren,
  kBodyLimit,
  kRoutePrefix,
  kLogLevel,
  kLogSerializers,
  kHooks,
  kSchemaController,
  kReplySerializerDefault,
  kContentTypeParser,
  kReply,
  kRequest,
  kFourOhFour,
  kState,
  kOptions,
  kPluginNameChain,
  kSchemaErrorFormatter,
  kErrorHandler
} = require('./lib/symbols.js')

const { createServer } = require('./lib/server')
const Reply = require('./lib/reply')
const Request = require('./lib/request')
const supportedMethods = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS']
const decorator = require('./lib/decorate')
const ContentTypeParser = require('./lib/contentTypeParser')
const SchemaController = require('./lib/schema-controller')
const { Hooks, hookRunnerApplication } = require('./lib/hooks')
const { createLogger } = require('./lib/logger')
const pluginUtils = require('./lib/pluginUtils')
const reqIdGenFactory = require('./lib/reqIdGenFactory')
const { buildRouting, validateBodyLimitOption } = require('./lib/route')
const build404 = require('./lib/fourOhFour')
const getSecuredInitialConfig = require('./lib/initialConfigValidation')
const override = require('./lib/pluginOverride')
const { defaultInitOptions } = getSecuredInitialConfig

const {
  FST_ERR_BAD_URL,
  FST_ERR_MISSING_MIDDLEWARE
} = require('./lib/errors')

const onBadUrlContext = {
  config: {
  },
  onSend: [],
  onError: []
}

function defaultErrorHandler (error, request, reply) {
  if (reply.statusCode < 500) {
    reply.log.info(
      { res: reply, err: error },
      error && error.message
    )
  } else {
    reply.log.error(
      { req: request, res: reply, err: error },
      error && error.message
    )
  }
  reply.send(error)
}

function fastify (options) {
  // Options validations
  options = options || {}

  if (typeof options !== 'object') {
    throw new TypeError('Options must be an object')
  }

  if (options.querystringParser && typeof options.querystringParser !== 'function') {
    throw new Error(`querystringParser option should be a function, instead got '${typeof options.querystringParser}'`)
  }

  if (options.schemaController && options.schemaController.bucket && typeof options.schemaController.bucket !== 'function') {
    throw new Error(`schemaController.bucket option should be a function, instead got '${typeof options.schemaController.bucket}'`)
  }

  validateBodyLimitOption(options.bodyLimit)

  const requestIdHeader = options.requestIdHeader || defaultInitOptions.requestIdHeader
  const querystringParser = options.querystringParser || querystring.parse
  const genReqId = options.genReqId || reqIdGenFactory()
  const requestIdLogLabel = options.requestIdLogLabel || 'reqId'
  const bodyLimit = options.bodyLimit || defaultInitOptions.bodyLimit
  const disableRequestLogging = options.disableRequestLogging || false
  const exposeHeadRoutes = options.exposeHeadRoutes != null ? options.exposeHeadRoutes : false

  const ajvOptions = Object.assign({
    customOptions: {},
    plugins: []
  }, options.ajv)
  const frameworkErrors = options.frameworkErrors

  // Ajv options
  if (!ajvOptions.customOptions || Object.prototype.toString.call(ajvOptions.customOptions) !== '[object Object]') {
    throw new Error(`ajv.customOptions option should be an object, instead got '${typeof ajvOptions.customOptions}'`)
  }
  if (!ajvOptions.plugins || !Array.isArray(ajvOptions.plugins)) {
    throw new Error(`ajv.plugins option should be an array, instead got '${typeof ajvOptions.plugins}'`)
  }

  ajvOptions.plugins = ajvOptions.plugins.map(plugin => {
    return Array.isArray(plugin) ? plugin : [plugin]
  })

  // Instance Fastify components
  const { logger, hasLogger } = createLogger(options)

  // Update the options with the fixed values
  options.connectionTimeout = options.connectionTimeout || defaultInitOptions.connectionTimeout
  options.keepAliveTimeout = options.keepAliveTimeout || defaultInitOptions.keepAliveTimeout
  options.logger = logger
  options.genReqId = genReqId
  options.requestIdHeader = requestIdHeader
  options.querystringParser = querystringParser
  options.requestIdLogLabel = requestIdLogLabel
  options.disableRequestLogging = disableRequestLogging
  options.ajv = ajvOptions
  options.clientErrorHandler = options.clientErrorHandler || defaultClientErrorHandler
  options.exposeHeadRoutes = exposeHeadRoutes

  const initialConfig = getSecuredInitialConfig(options)

  // Default router
  const router = buildRouting({
    config: {
      defaultRoute: defaultRoute,
      onBadUrl: onBadUrl,
      ignoreTrailingSlash: options.ignoreTrailingSlash || defaultInitOptions.ignoreTrailingSlash,
      maxParamLength: options.maxParamLength || defaultInitOptions.maxParamLength,
      caseSensitive: options.caseSensitive,
      versioning: options.versioning
    }
  })

  // 404 router, used for handling encapsulated 404 handlers
  const fourOhFour = build404(options)

  // HTTP server and its handler
  const httpHandler = wrapRouting(router.routing, options)

  // we need to set this before calling createServer
  options.http2SessionTimeout = initialConfig.http2SessionTimeout
  const { server, listen } = createServer(options, httpHandler)

  const setupResponseListeners = Reply.setupResponseListeners
  const schemaController = SchemaController.buildSchemaController(null, options.schemaController)

  // Public API
  const fastify = {
    // Fastify internals
    [kState]: {
      listening: false,
      closing: false,
      started: false
    },
    [kOptions]: options,
    [kChildren]: [],
    [kBodyLimit]: bodyLimit,
    [kRoutePrefix]: '',
    [kLogLevel]: '',
    [kLogSerializers]: null,
    [kHooks]: new Hooks(),
    [kSchemaController]: schemaController,
    [kSchemaErrorFormatter]: null,
    [kErrorHandler]: defaultErrorHandler,
    [kReplySerializerDefault]: null,
    [kContentTypeParser]: new ContentTypeParser(
      bodyLimit,
      (options.onProtoPoisoning || defaultInitOptions.onProtoPoisoning),
      (options.onConstructorPoisoning || defaultInitOptions.onConstructorPoisoning)
    ),
    [kReply]: Reply.buildReply(Reply),
    [kRequest]: Request.buildRequest(Request, options.trustProxy),
    [kFourOhFour]: fourOhFour,
    [pluginUtils.registeredPlugins]: [],
    [kPluginNameChain]: [],
    [kAvvioBoot]: null,
    // routing method
    routing: httpHandler,
    getDefaultRoute: router.getDefaultRoute.bind(router),
    setDefaultRoute: router.setDefaultRoute.bind(router),
    // routes shorthand methods
    delete: function _delete (url, opts, handler) {
      return router.prepareRoute.call(this, 'DELETE', url, opts, handler)
    },
    get: function _get (url, opts, handler) {
      return router.prepareRoute.call(this, 'GET', url, opts, handler)
    },
    head: function _head (url, opts, handler) {
      return router.prepareRoute.call(this, 'HEAD', url, opts, handler)
    },
    patch: function _patch (url, opts, handler) {
      return router.prepareRoute.call(this, 'PATCH', url, opts, handler)
    },
    post: function _post (url, opts, handler) {
      return router.prepareRoute.call(this, 'POST', url, opts, handler)
    },
    put: function _put (url, opts, handler) {
      return router.prepareRoute.call(this, 'PUT', url, opts, handler)
    },
    options: function _options (url, opts, handler) {
      return router.prepareRoute.call(this, 'OPTIONS', url, opts, handler)
    },
    all: function _all (url, opts, handler) {
      return router.prepareRoute.call(this, supportedMethods, url, opts, handler)
    },
    // extended route
    route: function _route (opts) {
      // we need the fastify object that we are producing so we apply a lazy loading of the function,
      // otherwise we should bind it after the declaration
      return router.route.call(this, opts)
    },
    // expose logger instance
    log: logger,
    // hooks
    addHook: addHook,
    // schemas
    addSchema: addSchema,
    getSchema: schemaController.getSchema.bind(schemaController),
    getSchemas: schemaController.getSchemas.bind(schemaController),
    setValidatorCompiler: setValidatorCompiler,
    setSerializerCompiler: setSerializerCompiler,
    setSchemaController: setSchemaController,
    setReplySerializer: setReplySerializer,
    setSchemaErrorFormatter: setSchemaErrorFormatter,
    // custom parsers
    addContentTypeParser: ContentTypeParser.helpers.addContentTypeParser,
    hasContentTypeParser: ContentTypeParser.helpers.hasContentTypeParser,
    getDefaultJsonParser: ContentTypeParser.defaultParsers.getDefaultJsonParser,
    defaultTextParser: ContentTypeParser.defaultParsers.defaultTextParser,
    // Fastify architecture methods (initialized by Avvio)
    register: null,
    after: null,
    ready: null,
    onClose: null,
    close: null,
    // http server
    listen: listen,
    server: server,
    // extend fastify objects
    decorate: decorator.add,
    hasDecorator: decorator.exist,
    decorateReply: decorator.decorateReply,
    decorateRequest: decorator.decorateRequest,
    hasRequestDecorator: decorator.existRequest,
    hasReplyDecorator: decorator.existReply,
    // fake http injection
    inject: inject,
    // pretty print of the registered routes
    printRoutes: router.printRoutes,
    // custom error handling
    setNotFoundHandler: setNotFoundHandler,
    setErrorHandler: setErrorHandler,
    // Set fastify initial configuration options read-only object
    initialConfig
  }

  Object.defineProperties(fastify, {
    pluginName: {
      get () {
        if (this[kPluginNameChain].length > 1) {
          return this[kPluginNameChain].join(' -> ')
        }
        return this[kPluginNameChain][0]
      }
    },
    prefix: {
      get () { return this[kRoutePrefix] }
    },
    validatorCompiler: {
      get () { return this[kSchemaController].getValidatorCompiler() }
    },
    serializerCompiler: {
      get () { return this[kSchemaController].getSerializerCompiler() }
    },
    version: {
      get () {
        if (versionLoaded === false) {
          version = loadVersion()
        }
        return version
      }
    },
    errorHandler: {
      get () {
        return this[kErrorHandler]
      }
    }
  })

  // We are adding `use` to the fastify prototype so the user
  // can still access it (and get the expected error), but `decorate`
  // will not detect it, and allow the user to override it.
  Object.setPrototypeOf(fastify, { use })

  if (options.schemaErrorFormatter) {
    validateSchemaErrorFormatter(options.schemaErrorFormatter)
    fastify[kSchemaErrorFormatter] = options.schemaErrorFormatter.bind(fastify)
  }

  // Install and configure Avvio
  // Avvio will update the following Fastify methods:
  // - register
  // - after
  // - ready
  // - onClose
  // - close
  const avvio = Avvio(fastify, {
    autostart: false,
    timeout: Number(options.pluginTimeout) || defaultInitOptions.pluginTimeout,
    expose: {
      use: 'register'
    }
  })
  // Override to allow the plugin encapsulation
  avvio.override = override
  avvio.on('start', () => (fastify[kState].started = true))
  fastify[kAvvioBoot] = fastify.ready // the avvio ready function
  fastify.ready = ready // overwrite the avvio ready function
  // cache the closing value, since we are checking it in an hot path
  avvio.once('preReady', () => {
    fastify.onClose((instance, done) => {
      fastify[kState].closing = true
      router.closeRoutes()
      if (fastify[kState].listening) {
        // No new TCP connections are accepted
        instance.server.close(done)
      } else {
        done(null)
      }
    })
  })

  // Set the default 404 handler
  fastify.setNotFoundHandler()
  fourOhFour.arrange404(fastify)

  router.setup(options, {
    avvio,
    fourOhFour,
    logger,
    hasLogger,
    setupResponseListeners,
    throwIfAlreadyStarted
  })

  // Delay configuring clientError handler so that it can access fastify state.
  server.on('clientError', options.clientErrorHandler.bind(fastify))

  return fastify

  function throwIfAlreadyStarted (msg) {
    if (fastify[kState].started) throw new Error(msg)
  }

  // HTTP injection handling
  // If the server is not ready yet, this
  // utility will automatically force it.
  function inject (opts, cb) {
    // lightMyRequest is dynamically laoded as it seems very expensive
    // because of Ajv
    if (lightMyRequest === undefined) {
      lightMyRequest = require('light-my-request')
    }

    if (fastify[kState].started) {
      if (fastify[kState].closing) {
        // Force to return an error
        const error = new Error('Server is closed')
        if (cb) {
          cb(error)
          return
        } else {
          return Promise.reject(error)
        }
      }
      return lightMyRequest(httpHandler, opts, cb)
    }

    if (cb) {
      this.ready(err => {
        if (err) cb(err, null)
        else lightMyRequest(httpHandler, opts, cb)
      })
    } else {
      return lightMyRequest((req, res) => {
        this.ready(function (err) {
          if (err) {
            res.emit('error', err)
            return
          }
          httpHandler(req, res)
        })
      }, opts)
    }
  }

  function ready (cb) {
    let resolveReady
    let rejectReady

    // run the hooks after returning the promise
    process.nextTick(runHooks)

    if (!cb) {
      return new Promise(function (resolve, reject) {
        resolveReady = resolve
        rejectReady = reject
      })
    }

    function runHooks () {
      // start loading
      fastify[kAvvioBoot]((err, done) => {
        if (err || fastify[kState].started) {
          manageErr(err)
        } else {
          hookRunnerApplication('onReady', fastify[kAvvioBoot], fastify, manageErr)
        }
        done()
      })
    }

    function manageErr (err) {
      if (cb) {
        if (err) {
          cb(err)
        } else {
          cb(undefined, fastify)
        }
      } else {
        if (err) {
          return rejectReady(err)
        }
        resolveReady(fastify)
      }
    }
  }

  function use () {
    throw new FST_ERR_MISSING_MIDDLEWARE()
  }

  // wrapper that we expose to the user for hooks handling
  function addHook (name, fn) {
    throwIfAlreadyStarted('Cannot call "addHook" when fastify instance is already started!')

    this[kHooks].validateAsyncHookParams(name, fn)

    if (name === 'onClose') {
      this[kHooks].validate(name, fn)
      this.onClose(fn)
    } else if (name === 'onReady') {
      this[kHooks].add(name, fn)
    } else {
      this.after((err, done) => {
        _addHook.call(this, name, fn)
        done(err)
      })
    }
    return this

    function _addHook (name, fn) {
      this[kHooks].add(name, fn)
      this[kChildren].forEach(child => _addHook.call(child, name, fn))
    }
  }

  // wrapper that we expose to the user for schemas handling
  function addSchema (schema) {
    throwIfAlreadyStarted('Cannot call "addSchema" when fastify instance is already started!')
    this[kSchemaController].add(schema)
    this[kChildren].forEach(child => child.addSchema(schema))
    return this
  }

  function defaultClientErrorHandler (err, socket) {
    // In case of a connection reset, the socket has been destroyed and there is nothing that needs to be done.
    // https://github.com/fastify/fastify/issues/2036
    // https://github.com/nodejs/node/issues/33302
    if (err.code === 'ECONNRESET') {
      return
    }

    const body = JSON.stringify({
      error: http.STATUS_CODES['400'],
      message: 'Client Error',
      statusCode: 400
    })

    // Most devs do not know what to do with this error.
    // In the vast majority of cases, it's a network error and/or some
    // config issue on the the load balancer side.
    this.log.trace({ err }, 'client error')

    // If the socket is not writable, there is no reason to try to send data.
    if (socket.writable) {
      socket.end(`HTTP/1.1 400 Bad Request\r\nContent-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n${body}`)
    }
  }

  // If the router does not match any route, every request will land here
  // req and res are Node.js core objects
  function defaultRoute (req, res) {
    if (req.headers['accept-version'] !== undefined) {
      req.headers['accept-version'] = undefined
    }
    fourOhFour.router.lookup(req, res)
  }

  function onBadUrl (path, req, res) {
    if (frameworkErrors) {
      const id = genReqId(req)
      const childLogger = logger.child({ reqId: id })

      childLogger.info({ req }, 'incoming request')

      const request = new Request(id, null, req, null, childLogger, onBadUrlContext)
      const reply = new Reply(res, request, childLogger)
      return frameworkErrors(new FST_ERR_BAD_URL(path), request, reply)
    }
    const body = `{"error":"Bad Request","message":"'${path}' is not a valid url component","statusCode":400}`
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Content-Length': body.length
    })
    res.end(body)
  }

  function setNotFoundHandler (opts, handler) {
    throwIfAlreadyStarted('Cannot call "setNotFoundHandler" when fastify instance is already started!')

    fourOhFour.setNotFoundHandler.call(this, opts, handler, avvio, router.routeHandler)
    return this
  }

  function setValidatorCompiler (validatorCompiler) {
    throwIfAlreadyStarted('Cannot call "setValidatorCompiler" when fastify instance is already started!')
    this[kSchemaController].setValidatorCompiler(validatorCompiler)
    return this
  }

  function setSchemaErrorFormatter (errorFormatter) {
    throwIfAlreadyStarted('Cannot call "setSchemaErrorFormatter" when fastify instance is already started!')
    validateSchemaErrorFormatter(errorFormatter)
    this[kSchemaErrorFormatter] = errorFormatter.bind(this)
    return this
  }

  function setSerializerCompiler (serializerCompiler) {
    throwIfAlreadyStarted('Cannot call "setSerializerCompiler" when fastify instance is already started!')
    this[kSchemaController].setSerializerCompiler(serializerCompiler)
    return this
  }

  function setSchemaController (schemaControllerOpts) {
    throwIfAlreadyStarted('Cannot call "setSchemaController" when fastify instance is already started!')
    const old = this[kSchemaController]
    const schemaController = SchemaController.buildSchemaController(old.parent, Object.assign({}, old.opts, schemaControllerOpts))
    this[kSchemaController] = schemaController
    this.getSchema = schemaController.getSchema.bind(schemaController)
    this.getSchemas = schemaController.getSchemas.bind(schemaController)
    return this
  }

  function setReplySerializer (replySerializer) {
    throwIfAlreadyStarted('Cannot call "setReplySerializer" when fastify instance is already started!')

    this[kReplySerializerDefault] = replySerializer
    return this
  }

  // wrapper that we expose to the user for configure the custom error handler
  function setErrorHandler (func) {
    throwIfAlreadyStarted('Cannot call "setErrorHandler" when fastify instance is already started!')

    this[kErrorHandler] = func.bind(this)
    return this
  }
}

function validateSchemaErrorFormatter (schemaErrorFormatter) {
  if (typeof schemaErrorFormatter !== 'function') {
    throw new Error(`schemaErrorFormatter option should be a function, instead got ${typeof schemaErrorFormatter}`)
  } else if (schemaErrorFormatter.constructor.name === 'AsyncFunction') {
    throw new Error('schemaErrorFormatter option should not be an async function')
  }
}

function wrapRouting (httpHandler, { rewriteUrl, logger }) {
  if (!rewriteUrl) {
    return httpHandler
  }
  return function preRouting (req, res) {
    const originalUrl = req.url
    const url = rewriteUrl(req)
    if (originalUrl !== url) {
      logger.debug({ originalUrl, url }, 'rewrite url')
      if (typeof url === 'string') {
        req.url = url
      } else {
        req.destroy(new Error(`Rewrite url for "${req.url}" needs to be of type "string" but received "${typeof url}"`))
      }
    }
    httpHandler(req, res)
  }
}

function loadVersion () {
  versionLoaded = true
  const fs = require('fs')
  const path = require('path')
  try {
    const pkgPath = path.join(__dirname, 'package.json')
    fs.accessSync(pkgPath, fs.constants.R_OK)
    const pkg = JSON.parse(fs.readFileSync(pkgPath))
    return pkg.name === 'fastify' ? pkg.version : undefined
  } catch (e) {
    return undefined
  }
}

/**
 * These export configurations enable JS and TS developers
 * to consumer fastify in whatever way best suits their needs.
 * Some examples of supported import syntax includes:
 * - `const fastify = require('fastify')`
 * - `const { fastify } = require('fastify')`
 * - `import * as Fastify from 'fastify'`
 * - `import { fastify, TSC_definition } from 'fastify'`
 * - `import fastify from 'fastify'`
 * - `import fastify, { TSC_definition } from 'fastify'`
 */
module.exports = fastify
module.exports.fastify = fastify
module.exports.default = fastify
