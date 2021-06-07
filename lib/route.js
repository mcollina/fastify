'use strict'

const FindMyWay = require('find-my-way')
const Context = require('./context')
const handleRequest = require('./handleRequest')
const { hookRunner, hookIterator, lifecycleHooks } = require('./hooks')
const supportedMethods = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS']
const { normalizeSchema } = require('./schemas')
const { parseHeadOnSendHandlers } = require('./headRoute')
const warning = require('./warnings')

const {
  compileSchemasForValidation,
  compileSchemasForSerialization
} = require('./validation')

const {
  FST_ERR_SCH_VALIDATION_BUILD,
  FST_ERR_SCH_SERIALIZATION_BUILD,
  FST_ERR_DEFAULT_ROUTE_INVALID_TYPE
} = require('./errors')

const {
  kRoutePrefix,
  kLogLevel,
  kLogSerializers,
  kHooks,
  kHooksDeprecatedPreParsing,
  kSchemaController,
  kOptions,
  kContentTypeParser,
  kReply,
  kReplySerializerDefault,
  kReplyIsError,
  kRequest,
  kRequestPayloadStream,
  kDisableRequestLogging,
  kSchemaErrorFormatter,
  kErrorHandler
} = require('./symbols.js')

function buildRouting (options) {
  const router = FindMyWay(options.config)

  let avvio
  let fourOhFour
  let requestIdHeader
  let querystringParser
  let requestIdLogLabel
  let logger
  let hasLogger
  let setupResponseListeners
  let throwIfAlreadyStarted
  let genReqId
  let disableRequestLogging
  let ignoreTrailingSlash
  let return503OnClosing
  let globalExposeHeadRoutes

  let closing = false

  return {
    setup (options, fastifyArgs) {
      avvio = fastifyArgs.avvio
      fourOhFour = fastifyArgs.fourOhFour
      logger = fastifyArgs.logger
      hasLogger = fastifyArgs.hasLogger
      setupResponseListeners = fastifyArgs.setupResponseListeners
      throwIfAlreadyStarted = fastifyArgs.throwIfAlreadyStarted

      globalExposeHeadRoutes = options.routing.exposeHeadRoutes
      requestIdHeader = options.requestIdHeader
      querystringParser = options.querystringParser
      requestIdLogLabel = options.requestIdLogLabel
      genReqId = options.genReqId
      disableRequestLogging = options.disableRequestLogging
      ignoreTrailingSlash = options.routing.ignoreTrailingSlash
      return503OnClosing = Object.prototype.hasOwnProperty.call(options.errorManagement, 'return503OnClosing') ? options.errorManagement.return503OnClosing : true
    },
    routing: router.lookup.bind(router), // router func to find the right handler to call
    route, // configure a route in the fastify instance
    prepareRoute,
    getDefaultRoute: function () {
      return router.defaultRoute
    },
    setDefaultRoute: function (defaultRoute) {
      if (typeof defaultRoute !== 'function') {
        throw new FST_ERR_DEFAULT_ROUTE_INVALID_TYPE()
      }

      router.defaultRoute = defaultRoute
    },
    routeHandler,
    closeRoutes: () => { closing = true },
    printRoutes: router.prettyPrint.bind(router)
  }

  // Convert shorthand to extended route declaration
  function prepareRoute (method, url, options, handler) {
    if (!handler && typeof options === 'function') {
      handler = options // for support over direct function calls such as fastify.get() options are reused as the handler
      options = {}
    } else if (handler && typeof handler === 'function') {
      if (Object.prototype.toString.call(options) !== '[object Object]') {
        throw new Error(`Options for ${method}:${url} route must be an object`)
      } else if (options.handler) {
        if (typeof options.handler === 'function') {
          throw new Error(`Duplicate handler for ${method}:${url} route is not allowed!`)
        } else {
          throw new Error(`Handler for ${method}:${url} route must be a function`)
        }
      }
    }

    options = Object.assign({}, options, {
      method,
      url,
      path: url,
      handler: handler || (options && options.handler)
    })

    return route.call(this, options)
  }

  // Route management
  function route (options) {
    // Since we are mutating/assigning only top level props, it is fine to have a shallow copy using the spread operator
    const opts = { ...options }

    throwIfAlreadyStarted('Cannot add route when fastify instance is already started!')

    if (Array.isArray(opts.method)) {
      // eslint-disable-next-line no-var
      for (var i = 0; i < opts.method.length; ++i) {
        const method = opts.method[i]
        if (supportedMethods.indexOf(method) === -1) {
          throw new Error(`${method} method is not supported!`)
        }
      }
    } else {
      if (supportedMethods.indexOf(opts.method) === -1) {
        throw new Error(`${opts.method} method is not supported!`)
      }
    }

    if (!opts.handler) {
      throw new Error(`Missing handler function for ${opts.method}:${opts.url} route.`)
    }

    if (opts.errorHandler !== undefined && typeof opts.errorHandler !== 'function') {
      throw new Error(`Error Handler for ${opts.method}:${opts.url} route, if defined, must be a function`)
    }

    validateBodyLimitOption(opts.bodyLimit)

    const prefix = this[kRoutePrefix]

    this.after((notHandledErr, done) => {
      const path = opts.url || opts.path
      if (path === '/' && prefix.length && opts.method !== 'HEAD') {
        switch (opts.prefixTrailingSlash) {
          case 'slash':
            afterRouteAdded.call(this, { path }, notHandledErr, done)
            break
          case 'no-slash':
            afterRouteAdded.call(this, { path: '' }, notHandledErr, done)
            break
          case 'both':
          default:
            afterRouteAdded.call(this, { path: '' }, notHandledErr, done)
            // If ignoreTrailingSlash is set to true we need to add only the '' route to prevent adding an incomplete one.
            if (ignoreTrailingSlash !== true) {
              afterRouteAdded.call(this, { path, prefixing: true }, notHandledErr, done)
            }
        }
      } else if (path && path[0] === '/' && prefix.endsWith('/')) {
        // Ensure that '/prefix/' + '/route' gets registered as '/prefix/route'
        afterRouteAdded.call(this, { path: path.slice(1) }, notHandledErr, done)
      } else {
        afterRouteAdded.call(this, { path }, notHandledErr, done)
      }
    })

    // chainable api
    return this

    /**
     * This function sets up a new route, its log serializers, and triggers route hooks.
     *
     * @param {object} opts contains route `path` and `prefixing` flag which indicates if this is an auto-prefixed route, e.g. `fastify.register(routes, { prefix: '/foo' })`
     * @param {*} notHandledErr error object to be passed back to the original invoker
     * @param {*} done callback
     */
    function afterRouteAdded ({ path, prefixing = false }, notHandledErr, done) {
      const url = prefix + path

      opts.url = url
      opts.path = url
      opts.routePath = path
      opts.prefix = prefix
      opts.logLevel = opts.logLevel || this[kLogLevel]

      if (this[kLogSerializers] || opts.logSerializers) {
        opts.logSerializers = Object.assign(Object.create(this[kLogSerializers]), opts.logSerializers)
      }

      if (opts.attachValidation == null) {
        opts.attachValidation = false
      }

      if (prefixing === false) {
      // run 'onRoute' hooks
        for (const hook of this[kHooks].onRoute) {
          try {
            hook.call(this, opts)
          } catch (error) {
            done(error)
            return
          }
        }
      }

      const config = {
        ...opts.config,
        url,
        method: opts.method
      }
      const constraints = opts.constraints || {}
      if (opts.version) {
        warning.emit('FSTDEP008')
        constraints.version = opts.version
      }

      const context = new Context(
        opts.schema,
        opts.handler.bind(this),
        this[kReply],
        this[kRequest],
        this[kContentTypeParser],
        config,
        opts.errorHandler || this[kErrorHandler],
        opts.bodyLimit,
        opts.logLevel,
        opts.logSerializers,
        opts.attachValidation,
        this[kReplySerializerDefault],
        opts.schemaErrorFormatter || this[kSchemaErrorFormatter]
      )

      const headRouteExists = router.find('HEAD', path) != null

      try {
        router.on(opts.method, opts.url, { constraints }, routeHandler, context)
      } catch (err) {
        done(err)
        return
      }

      const { exposeHeadRoute } = opts
      const hasRouteExposeHeadRouteFlag = exposeHeadRoute != null
      const shouldExposeHead = hasRouteExposeHeadRouteFlag ? exposeHeadRoute : globalExposeHeadRoutes

      if (shouldExposeHead && options.method === 'GET' && !headRouteExists) {
        const onSendHandlers = parseHeadOnSendHandlers(opts.onSend)
        prepareRoute.call(this, 'HEAD', path, { ...opts, onSend: onSendHandlers })
      } else if (headRouteExists && exposeHeadRoute) {
        warning.emit('FSTDEP007')
      }

      // It can happen that a user registers a plugin with some hooks *after*
      // the route registration. To be sure to also load those hooks,
      // we must listen for the avvio's preReady event, and update the context object accordingly.
      avvio.once('preReady', () => {
        for (const hook of lifecycleHooks) {
          const toSet = this[kHooks][hook]
            .concat(opts[hook] || [])
            .map(h => {
              const bound = h.bind(this)

              // Track hooks deprecation markers
              if (hook === 'preParsing') {
                // Check for deprecation syntax
                if (h.length === (h.constructor.name === 'AsyncFunction' ? 2 : 3)) {
                  warning.emit('FSTDEP004')
                  bound[kHooksDeprecatedPreParsing] = true
                }
              }

              return bound
            })
          context[hook] = toSet.length ? toSet : null
        }

        // Must store the 404 Context in 'preReady' because it is only guaranteed to
        // be available after all of the plugins and routes have been loaded.
        fourOhFour.setContext(this, context)

        if (opts.schema) {
          context.schema = normalizeSchema(context.schema)

          const schemaController = this[kSchemaController]
          if (!opts.validatorCompiler && (opts.schema.body || opts.schema.headers || opts.schema.querystring || opts.schema.params)) {
            schemaController.setupValidator(this[kOptions])
          }
          try {
            compileSchemasForValidation(context, opts.validatorCompiler || schemaController.validatorCompiler)
          } catch (error) {
            throw new FST_ERR_SCH_VALIDATION_BUILD(opts.method, url, error.message)
          }

          if (opts.schema.response && !opts.serializerCompiler) {
            schemaController.setupSerializer(this[kOptions])
          }
          try {
            compileSchemasForSerialization(context, opts.serializerCompiler || schemaController.serializerCompiler)
          } catch (error) {
            throw new FST_ERR_SCH_SERIALIZATION_BUILD(opts.method, url, error.message)
          }
        }
      })

      done(notHandledErr)
    }
  }

  // HTTP request entry point, the routing has already been executed
  function routeHandler (req, res, params, context) {
    if (closing === true) {
      /* istanbul ignore next mac, windows */
      if (req.httpVersionMajor !== 2) {
        res.once('finish', () => req.destroy())
        res.setHeader('Connection', 'close')
      }

      if (return503OnClosing) {
        const headers = {
          'Content-Type': 'application/json',
          'Content-Length': '80'
        }
        res.writeHead(503, headers)
        res.end('{"error":"Service Unavailable","message":"Service Unavailable","statusCode":503}')
        return
      }
    }

    const id = req.headers[requestIdHeader] || genReqId(req)

    const loggerOpts = {
      [requestIdLogLabel]: id,
      level: context.logLevel
    }

    if (context.logSerializers) {
      loggerOpts.serializers = context.logSerializers
    }
    const childLogger = logger.child(loggerOpts)
    childLogger[kDisableRequestLogging] = disableRequestLogging

    const queryPrefix = req.url.indexOf('?')
    const query = querystringParser(queryPrefix > -1 ? req.url.slice(queryPrefix + 1) : '')
    const request = new context.Request(id, params, req, query, childLogger, context)
    const reply = new context.Reply(res, request, childLogger)

    if (disableRequestLogging === false) {
      childLogger.info({ req: request }, 'incoming request')
    }

    if (hasLogger === true || context.onResponse !== null) {
      setupResponseListeners(reply)
    }

    if (context.onRequest !== null) {
      hookRunner(
        context.onRequest,
        hookIterator,
        request,
        reply,
        runPreParsing
      )
    } else {
      runPreParsing(null, request, reply)
    }

    if (context.onTimeout !== null) {
      if (!request.raw.socket._meta) {
        request.raw.socket.on('timeout', handleTimeout)
      }
      request.raw.socket._meta = { context, request, reply }
    }
  }
}

function handleTimeout () {
  const { context, request, reply } = this._meta
  hookRunner(
    context.onTimeout,
    hookIterator,
    request,
    reply,
    noop
  )
}

function validateBodyLimitOption (bodyLimit) {
  if (bodyLimit === undefined) return
  if (!Number.isInteger(bodyLimit) || bodyLimit <= 0) {
    throw new TypeError(`'bodyLimit' option must be an integer > 0. Got '${bodyLimit}'`)
  }
}

function runPreParsing (err, request, reply) {
  if (reply.sent === true) return
  if (err != null) {
    reply.send(err)
    return
  }

  request[kRequestPayloadStream] = request.raw

  if (reply.context.preParsing !== null) {
    preParsingHookRunner(reply.context.preParsing, request, reply, handleRequest)
  } else {
    handleRequest(null, request, reply)
  }
}

function preParsingHookRunner (functions, request, reply, cb) {
  let i = 0

  function next (err, stream) {
    if (reply.sent) {
      return
    }

    if (typeof stream !== 'undefined') {
      request[kRequestPayloadStream] = stream
    }

    if (err || i === functions.length) {
      if (err && !(err instanceof Error)) {
        reply[kReplyIsError] = true
      }

      cb(err, request, reply)
      return
    }

    const fn = functions[i++]
    let result
    try {
      if (fn[kHooksDeprecatedPreParsing]) {
        result = fn(request, reply, next)
      } else {
        result = fn(request, reply, request[kRequestPayloadStream], next)
      }
    } catch (error) {
      next(error)
      return
    }

    if (result && typeof result.then === 'function') {
      result.then(handleResolve, handleReject)
    }
  }

  function handleResolve (stream) {
    next(null, stream)
  }

  function handleReject (err) {
    next(err)
  }

  next(null, request[kRequestPayloadStream])
}

function noop () { }

module.exports = { buildRouting, validateBodyLimitOption }
