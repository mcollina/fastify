'use strict'

const FindMyWay = require('find-my-way')
const avvio = require('avvio')
const http = require('http')
const https = require('https')
const urlUtil = require('url')
const Middie = require('middie')
const lightMyRequest = require('light-my-request')
const abstractLogging = require('abstract-logging')
const proxyAddr = require('proxy-addr')

const {
  childrenKey,
  bodyLimitKey,
  routePrefixKey,
  logLevelKey,
  hooksKey,
  schemasKey,
  contentTypeParserKey,
  ReplyKey,
  RequestKey,
  middlewaresKey,
  canSetNotFoundHandlerKey,
  fourOhFourLevelInstanceKey,
  fourOhFourContextKey
} = require('./lib/symbols.js')

const Reply = require('./lib/reply')
const Request = require('./lib/request')
const supportedMethods = ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT', 'OPTIONS']
const buildSchema = require('./lib/validation').build
const handleRequest = require('./lib/handleRequest')
const validation = require('./lib/validation')
const isValidLogger = validation.isValidLogger
const buildSchemaCompiler = validation.buildSchemaCompiler
const decorator = require('./lib/decorate')
const ContentTypeParser = require('./lib/ContentTypeParser')
const { Hooks, hookRunner, hookIterator, buildHooks } = require('./lib/hooks')
const Schemas = require('./lib/schemas')
const loggerUtils = require('./lib/logger')
const pluginUtils = require('./lib/pluginUtils')

const DEFAULT_BODY_LIMIT = 1024 * 1024 // 1 MiB

function validateBodyLimitOption (bodyLimit) {
  if (bodyLimit === undefined) return
  if (!Number.isInteger(bodyLimit) || bodyLimit <= 0) {
    throw new TypeError(`'bodyLimit' option must be an integer > 0. Got '${bodyLimit}'`)
  }
}

function build (options) {
  options = options || {}
  if (typeof options !== 'object') {
    throw new TypeError('Options must be an object')
  }

  var log
  var hasLogger = true
  if (isValidLogger(options.logger)) {
    log = loggerUtils.createLogger({
      logger: options.logger,
      serializers: Object.assign({}, loggerUtils.serializers, options.logger.serializers)
    })
  } else if (!options.logger) {
    hasLogger = false
    log = Object.create(abstractLogging)
    log.child = () => log
  } else {
    options.logger = typeof options.logger === 'object' ? options.logger : {}
    options.logger.level = options.logger.level || 'info'
    options.logger.serializers = Object.assign({}, loggerUtils.serializers, options.logger.serializers)
    log = loggerUtils.createLogger(options.logger)
  }

  const fastify = {
    [childrenKey]: []
  }
  const router = FindMyWay({
    defaultRoute: defaultRoute,
    ignoreTrailingSlash: options.ignoreTrailingSlash,
    maxParamLength: options.maxParamLength,
    caseSensitive: options.caseSensitive
  })

  const requestIdHeader = options.requestIdHeader || 'request-id'

  fastify.printRoutes = router.prettyPrint.bind(router)

  const setupResponseListeners = Reply.setupResponseListeners
  // logger utils
  const customGenReqId = options.logger ? options.logger.genReqId : null
  const handleTrustProxy = options.trustProxy ? _handleTrustProxy : _ipAsRemoteAddress
  const proxyFn = getTrustProxyFn()
  const genReqId = customGenReqId || loggerUtils.reqIdGenFactory(requestIdHeader)

  const app = avvio(fastify, {
    autostart: false,
    timeout: Number(options.pluginTimeout) || 0
  })
  // Override to allow the plugin incapsulation
  app.override = override

  var listening = false
  var closing = false
  // true when Fastify is ready to go
  var started = false
  app.on('start', () => {
    started = true
  })

  function throwIfAlreadyStarted (msg) {
    if (started) throw new Error(msg)
  }

  var server
  const httpHandler = router.lookup.bind(router)
  if (options.serverFactory) {
    server = options.serverFactory(httpHandler, options)
  } else if (options.https) {
    if (options.http2) {
      server = http2().createSecureServer(options.https, httpHandler)
    } else {
      server = https.createServer(options.https, httpHandler)
    }
  } else if (options.http2) {
    server = http2().createServer(httpHandler)
  } else {
    server = http.createServer(httpHandler)
  }

  app.once('preReady', () => {
    fastify.onClose((instance, done) => {
      closing = true
      if (listening) {
        instance.server.close(done)
      } else {
        done(null)
      }
    })
  })

  if (Number(process.version.match(/v(\d+)/)[1]) >= 6) {
    server.on('clientError', handleClientError)
  }

  // body limit option
  validateBodyLimitOption(options.bodyLimit)
  fastify[bodyLimitKey] = options.bodyLimit || DEFAULT_BODY_LIMIT

  // shorthand methods
  fastify.delete = _delete
  fastify.get = _get
  fastify.head = _head
  fastify.patch = _patch
  fastify.post = _post
  fastify.put = _put
  fastify.options = _options
  fastify.all = _all
  // extended route
  fastify.route = route
  fastify[routePrefixKey] = ''
  fastify[logLevelKey] = ''

  Object.defineProperty(fastify, 'basePath', {
    get: function () {
      return this[routePrefixKey]
    }
  })

  // expose logger instance
  fastify.log = log

  // hooks
  fastify.addHook = addHook
  fastify[hooksKey] = new Hooks()

  // schemas
  fastify.addSchema = addSchema
  fastify[schemasKey] = new Schemas()
  fastify.getSchemas = fastify[schemasKey].getSchemas.bind(fastify[schemasKey])

  const onRouteHooks = []

  // custom parsers
  fastify.addContentTypeParser = addContentTypeParser
  fastify.hasContentTypeParser = hasContentTypeParser
  fastify[contentTypeParserKey] = new ContentTypeParser(fastify[bodyLimitKey])

  fastify.setSchemaCompiler = setSchemaCompiler
  fastify.setSchemaCompiler(buildSchemaCompiler())

  // plugin
  fastify.register = fastify.use
  fastify.listen = listen
  fastify.server = server
  fastify[pluginUtils.registeredPlugins] = []

  // extend server methods
  fastify.decorate = decorator.add
  fastify.hasDecorator = decorator.exist
  fastify.decorateReply = decorator.decorateReply
  fastify.decorateRequest = decorator.decorateRequest
  fastify.hasRequestDecorator = decorator.existRequest
  fastify.hasReplyDecorator = decorator.existReply

  fastify[ReplyKey] = Reply.buildReply(Reply)
  fastify[RequestKey] = Request.buildRequest(Request)

  // middleware support
  fastify.use = use
  fastify[middlewaresKey] = []

  // fake http injection
  fastify.inject = inject

  var fourOhFour = FindMyWay({ defaultRoute: fourOhFourFallBack })
  fastify[canSetNotFoundHandlerKey] = true
  fastify[fourOhFourLevelInstanceKey] = fastify
  fastify[fourOhFourContextKey] = null
  fastify.setNotFoundHandler = setNotFoundHandler
  fastify.setNotFoundHandler() // Set the default 404 handler

  fastify.setErrorHandler = setErrorHandler

  return fastify

  function getTrustProxyFn () {
    const tp = options.trustProxy
    if (typeof tp === 'function') {
      return tp
    }
    if (tp === true) {
      // Support plain true/false
      return function () { return true }
    }
    if (typeof tp === 'number') {
      // Support trusting hop count
      return function (a, i) { return i < tp }
    }
    if (typeof tp === 'string') {
      // Support comma-separated tps
      const vals = tp.split(',').map(it => it.trim())
      return proxyAddr.compile(vals)
    }
    return proxyAddr.compile(tp || [])
  }

  function _handleTrustProxy (req) {
    req.ip = proxyAddr(req, proxyFn)
    req.ips = proxyAddr.all(req, proxyFn)
    if (req.ip !== undefined) {
      req.hostname = req.headers['x-forwarded-host']
    }
  }

  function _ipAsRemoteAddress (req) {
    req.ip = req.connection.remoteAddress
  }

  function routeHandler (req, res, params, context) {
    if (closing === true) {
      res.writeHead(503, {
        'Content-Type': 'application/json',
        'Content-Length': '80',
        'Connection': 'close'
      })
      res.end('{"error":"Service Unavailable","message":"Service Unavailable","statusCode":503}')
      setImmediate(() => req.destroy())
      return
    }

    req.id = genReqId(req)
    handleTrustProxy(req)
    req.hostname = req.hostname || req.headers['host']
    req.log = res.log = log.child({ reqId: req.id, level: context.logLevel })
    req.originalUrl = req.url

    req.log.info({ req }, 'incoming request')

    var request = new context.Request(params, req, urlUtil.parse(req.url, true).query, req.headers, req.log)
    var reply = new context.Reply(res, context, request, res.log)

    if (hasLogger === true || context.onResponse !== null) {
      setupResponseListeners(reply)
    }

    if (context.onRequest !== null) {
      hookRunner(
        context.onRequest,
        hookIterator,
        request,
        reply,
        middlewareCallback
      )
    } else {
      middlewareCallback(null, request, reply)
    }
  }

  function listenPromise (port, address, backlog) {
    if (listening) {
      return Promise.reject(new Error('Fastify is already listening'))
    }

    return fastify.ready().then(() => {
      var errEventHandler
      var errEvent = new Promise((resolve, reject) => {
        errEventHandler = (err) => {
          listening = false
          reject(err)
        }
        server.once('error', errEventHandler)
      })
      var listen = new Promise((resolve, reject) => {
        server.listen(port, address, backlog, () => {
          server.removeListener('error', errEventHandler)
          resolve(logServerAddress(server.address(), options.https))
        })
        // we set it afterwards because listen can throw
        listening = true
      })

      return Promise.race([
        errEvent, // e.g invalid port range error is always emitted before the server listening
        listen
      ])
    })
  }

  function listen (port, address, backlog, cb) {
    /* Deal with listen (port, cb) */
    if (typeof address === 'function') {
      cb = address
      address = undefined
    }

    // This will listen to what localhost is.
    // It can be 127.0.0.1 or ::1, depending on the operating system.
    // Fixes https://github.com/fastify/fastify/issues/1022.
    address = address || 'localhost'

    /* Deal with listen (port, address, cb) */
    if (typeof backlog === 'function') {
      cb = backlog
      backlog = undefined
    }

    if (cb === undefined) return listenPromise(port, address, backlog)

    fastify.ready(function (err) {
      if (err) return cb(err)

      if (listening) {
        return cb(new Error('Fastify is already listening'), null)
      }

      server.once('error', wrap)
      if (backlog) {
        server.listen(port, address, backlog, wrap)
      } else {
        server.listen(port, address, wrap)
      }

      listening = true
    })

    function wrap (err) {
      server.removeListener('error', wrap)
      if (!err) {
        address = logServerAddress(server.address(), options.https)
        cb(null, address)
      } else {
        listening = false
        cb(err, null)
      }
    }
  }

  function logServerAddress (address, isHttps) {
    const isUnixSocket = typeof address === 'string'
    if (!isUnixSocket) {
      if (address.address.indexOf(':') === -1) {
        address = address.address + ':' + address.port
      } else {
        address = '[' + address.address + ']:' + address.port
      }
    }
    address = (isUnixSocket ? '' : ('http' + (isHttps ? 's' : '') + '://')) + address
    fastify.log.info('Server listening at ' + address)
    return address
  }

  function middlewareCallback (err, request, reply) {
    if (reply.sent === true) return
    if (err) {
      reply.send(err)
      return
    }

    if (reply.context._middie !== null) {
      reply.context._middie.run(request.raw, reply.res, reply)
    } else {
      onRunMiddlewares(null, null, null, reply)
    }
  }

  function onRunMiddlewares (err, req, res, reply) {
    if (err) {
      reply.send(err)
      return
    }

    handleRequest(reply.request, reply)
  }

  function override (old, fn, opts) {
    const shouldSkipOverride = pluginUtils.registerPlugin.call(old, fn)
    if (shouldSkipOverride) {
      return old
    }

    const instance = Object.create(old)
    old[childrenKey].push(instance)
    instance[childrenKey] = []
    instance[ReplyKey] = Reply.buildReply(instance[ReplyKey])
    instance[RequestKey] = Request.buildRequest(instance[RequestKey])
    instance[contentTypeParserKey] = ContentTypeParser.buildContentTypeParser(instance[contentTypeParserKey])
    instance[hooksKey] = Hooks.buildHooks(instance[hooksKey])
    instance[routePrefixKey] = buildRoutePrefix(instance[routePrefixKey], opts.prefix)
    instance[logLevelKey] = opts.logLevel || instance[logLevelKey]
    instance[middlewaresKey] = old[middlewaresKey].slice()
    instance[pluginUtils.registeredPlugins] = Object.create(instance[pluginUtils.registeredPlugins])

    if (opts.prefix) {
      instance[canSetNotFoundHandlerKey] = true
      instance[fourOhFourLevelInstanceKey] = instance
    }

    return instance
  }

  function buildRoutePrefix (instancePrefix, pluginPrefix) {
    if (!pluginPrefix) {
      return instancePrefix
    }

    // Ensure that there is a '/' between the prefixes
    if (instancePrefix.endsWith('/')) {
      if (pluginPrefix[0] === '/') {
        // Remove the extra '/' to avoid: '/first//second'
        pluginPrefix = pluginPrefix.slice(1)
      }
    } else if (pluginPrefix[0] !== '/') {
      pluginPrefix = '/' + pluginPrefix
    }

    return instancePrefix + pluginPrefix
  }

  // Shorthand methods
  function _delete (url, opts, handler) {
    return _route(this, 'DELETE', url, opts, handler)
  }

  function _get (url, opts, handler) {
    return _route(this, 'GET', url, opts, handler)
  }

  function _head (url, opts, handler) {
    return _route(this, 'HEAD', url, opts, handler)
  }

  function _patch (url, opts, handler) {
    return _route(this, 'PATCH', url, opts, handler)
  }

  function _post (url, opts, handler) {
    return _route(this, 'POST', url, opts, handler)
  }

  function _put (url, opts, handler) {
    return _route(this, 'PUT', url, opts, handler)
  }

  function _options (url, opts, handler) {
    return _route(this, 'OPTIONS', url, opts, handler)
  }

  function _all (url, opts, handler) {
    return _route(this, supportedMethods, url, opts, handler)
  }

  function _route (_fastify, method, url, options, handler) {
    if (!handler && typeof options === 'function') {
      handler = options
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
      handler: handler || (options && options.handler)
    })

    return _fastify.route(options)
  }

  // Route management
  function route (opts) {
    throwIfAlreadyStarted('Cannot add route when fastify instance is already started!')

    const _fastify = this

    if (Array.isArray(opts.method)) {
      for (var i = 0; i < opts.method.length; i++) {
        if (supportedMethods.indexOf(opts.method[i]) === -1) {
          throw new Error(`${opts.method[i]} method is not supported!`)
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

    validateBodyLimitOption(opts.bodyLimit)

    _fastify.after(function afterRouteAdded (notHandledErr, done) {
      const prefix = _fastify[routePrefixKey]
      var path = opts.url || opts.path
      if (path === '/' && prefix.length > 0) {
        // Ensure that '/prefix' + '/' gets registered as '/prefix'
        path = ''
      } else if (path[0] === '/' && prefix.endsWith('/')) {
        // Ensure that '/prefix/' + '/route' gets registered as '/prefix/route'
        path = path.slice(1)
      }
      const url = prefix + path

      opts.url = url
      opts.path = url
      opts.prefix = prefix
      opts.logLevel = opts.logLevel || _fastify[logLevelKey]

      // run 'onRoute' hooks
      for (var h of onRouteHooks) {
        h.call(_fastify, opts)
      }

      const config = opts.config || {}
      config.url = url

      const context = new Context(
        opts.schema,
        opts.handler.bind(_fastify),
        _fastify[ReplyKey],
        _fastify[RequestKey],
        _fastify[contentTypeParserKey],
        config,
        _fastify._errorHandler,
        opts.bodyLimit,
        opts.logLevel
      )

      try {
        buildSchema(context, opts.schemaCompiler || _fastify._schemaCompiler, _fastify[schemasKey])
      } catch (error) {
        done(error)
        return
      }

      if (opts.beforeHandler) {
        if (Array.isArray(opts.beforeHandler)) {
          opts.beforeHandler.forEach((h, i) => {
            opts.beforeHandler[i] = h.bind(_fastify)
          })
        } else {
          opts.beforeHandler = opts.beforeHandler.bind(_fastify)
        }
      }

      try {
        router.on(opts.method, url, { version: opts.version }, routeHandler, context)
      } catch (err) {
        done(err)
        return
      }

      // It can happen that a user register a plugin with some hooks/middlewares *after*
      // the route registration. To be sure to load also that hoooks/middlwares,
      // we must listen for the avvio's preReady event, and update the context object accordingly.
      app.once('preReady', () => {
        const onRequest = _fastify[hooksKey].onRequest
        const onResponse = _fastify[hooksKey].onResponse
        const onSend = _fastify[hooksKey].onSend
        const preHandler = _fastify[hooksKey].preHandler.concat(opts.beforeHandler || [])

        context.onRequest = onRequest.length ? onRequest : null
        context.preHandler = preHandler.length ? preHandler : null
        context.onSend = onSend.length ? onSend : null
        context.onResponse = onResponse.length ? onResponse : null

        context._middie = buildMiddie(_fastify[middlewaresKey])

        // Must store the 404 Context in 'preReady' because it is only guaranteed to
        // be available after all of the plugins and routes have been loaded.
        const _404Context = Object.assign({}, _fastify[fourOhFourContextKey])
        _404Context.onSend = context.onSend
        context[fourOhFourContextKey] = _404Context
      })

      done(notHandledErr)
    })

    // chainable api
    return _fastify
  }

  function Context (schema, handler, Reply, Request, contentTypeParser, config, errorHandler, bodyLimit, logLevel) {
    this.schema = schema
    this.handler = handler
    this.Reply = Reply
    this.Request = Request
    this.contentTypeParser = contentTypeParser
    this.onRequest = null
    this.onSend = null
    this.preHandler = null
    this.onResponse = null
    this.config = config
    this.errorHandler = errorHandler
    this._middie = null
    this._parserOptions = {
      limit: bodyLimit || null
    }
    this.logLevel = logLevel
    this[fourOhFourContextKey] = null
  }

  function inject (opts, cb) {
    if (started) {
      return lightMyRequest(httpHandler, opts, cb)
    }

    if (cb) {
      this.ready(err => {
        if (err) throw err
        return lightMyRequest(httpHandler, opts, cb)
      })
    } else {
      return new Promise((resolve, reject) => {
        this.ready(err => {
          if (err) return reject(err)
          resolve()
        })
      }).then(() => lightMyRequest(httpHandler, opts))
    }
  }

  function use (url, fn) {
    throwIfAlreadyStarted('Cannot call "use" when fastify instance is already started!')
    if (typeof url === 'string') {
      const prefix = this[routePrefixKey]
      url = prefix + (url === '/' && prefix.length > 0 ? '' : url)
    }
    return this.after((err, done) => {
      addMiddleware(this, [url, fn])
      done(err)
    })
  }

  function addMiddleware (instance, middleware) {
    instance[middlewaresKey].push(middleware)
    instance[childrenKey].forEach(child => addMiddleware(child, middleware))
  }

  function addHook (name, fn) {
    throwIfAlreadyStarted('Cannot call "addHook" when fastify instance is already started!')

    if (name === 'onClose') {
      this[hooksKey].validate(name, fn)
      this.onClose(fn)
    } else if (name === 'onRoute') {
      this[hooksKey].validate(name, fn)
      onRouteHooks.push(fn)
    } else {
      this.after((err, done) => {
        _addHook(this, name, fn)
        done(err)
      })
    }
    return this
  }

  function _addHook (instance, name, fn) {
    instance[hooksKey].add(name, fn.bind(instance))
    instance[childrenKey].forEach(child => _addHook(child, name, fn))
  }

  function addSchema (name, schema) {
    throwIfAlreadyStarted('Cannot call "addSchema" when fastify instance is already started!')
    this[schemasKey].add(name, schema)
    return this
  }

  function addContentTypeParser (contentType, opts, parser) {
    throwIfAlreadyStarted('Cannot call "addContentTypeParser" when fastify instance is already started!')

    if (typeof opts === 'function') {
      parser = opts
      opts = {}
    }

    if (!opts) {
      opts = {}
    }

    if (!opts.bodyLimit) {
      opts.bodyLimit = this[bodyLimitKey]
    }

    if (Array.isArray(contentType)) {
      contentType.forEach((type) => this[contentTypeParserKey].add(type, opts, parser))
    } else {
      this[contentTypeParserKey].add(contentType, opts, parser)
    }

    return this
  }

  function hasContentTypeParser (contentType, fn) {
    return this[contentTypeParserKey].hasParser(contentType)
  }

  function handleClientError (e, socket) {
    const body = JSON.stringify({
      error: http.STATUS_CODES['400'],
      message: 'Client Error',
      statusCode: 400
    })
    log.error(e, 'client error')
    socket.end(`HTTP/1.1 400 Bad Request\r\nContent-Length: ${body.length}\r\nContent-Type: application/json\r\n\r\n${body}`)
  }

  function defaultRoute (req, res) {
    if (req.headers['accept-version'] !== undefined) {
      req.headers['accept-version'] = undefined
    }
    fourOhFour.lookup(req, res)
  }

  function basic404 (req, reply) {
    reply.code(404).send(new Error('Not Found'))
  }

  function fourOhFourFallBack (req, res) {
    // if this happen, we have a very bad bug
    // we might want to do some hard debugging
    // here, let's print out as much info as
    // we can
    req.id = genReqId(req)
    req.log = res.log = log.child({ reqId: req.id })
    req.originalUrl = req.url

    req.log.info({ req }, 'incoming request')

    var request = new Request(null, req, null, req.headers, req.log)
    var reply = new Reply(res, { onSend: [] }, request, res.log)

    reply._setup(hasLogger)

    request.log.warn('the default handler for 404 did not catch this, this is likely a fastify bug, please report it')
    request.log.warn(fourOhFour.prettyPrint())
    reply.code(404).send(new Error('Not Found'))
  }

  function setNotFoundHandler (opts, handler) {
    throwIfAlreadyStarted('Cannot call "setNotFoundHandler" when fastify instance is already started!')

    const _fastify = this
    const prefix = this[routePrefixKey] || '/'

    if (this[canSetNotFoundHandlerKey] === false) {
      throw new Error(`Not found handler already set for Fastify instance with prefix: '${prefix}'`)
    }

    if (typeof opts === 'object' && opts.beforeHandler) {
      if (Array.isArray(opts.beforeHandler)) {
        opts.beforeHandler.forEach((h, i) => {
          opts.beforeHandler[i] = h.bind(_fastify)
        })
      } else {
        opts.beforeHandler = opts.beforeHandler.bind(_fastify)
      }
    }

    if (typeof opts === 'function') {
      handler = opts
      opts = undefined
    }
    opts = opts || {}

    if (handler) {
      this[fourOhFourLevelInstanceKey][canSetNotFoundHandlerKey] = false
      handler = handler.bind(this)
    } else {
      handler = basic404
    }

    this.after((notHandledErr, done) => {
      _setNotFoundHandler.call(this, prefix, opts, handler)
      done(notHandledErr)
    })
  }

  function _setNotFoundHandler (prefix, opts, handler) {
    const context = new Context(
      opts.schema,
      handler,
      this[ReplyKey],
      this[RequestKey],
      this[contentTypeParserKey],
      opts.config || {},
      this._errorHandler,
      this[bodyLimitKey],
      this[logLevelKey]
    )

    app.once('preReady', () => {
      const context = this[fourOhFourContextKey]

      const onRequest = this[hooksKey].onRequest
      const preHandler = this[hooksKey].preHandler.concat(opts.beforeHandler || [])
      const onSend = this[hooksKey].onSend
      const onResponse = this[hooksKey].onResponse

      context.onRequest = onRequest.length ? onRequest : null
      context.preHandler = preHandler.length ? preHandler : null
      context.onSend = onSend.length ? onSend : null
      context.onResponse = onResponse.length ? onResponse : null

      context._middie = buildMiddie(this[middlewaresKey])
    })

    if (this[fourOhFourContextKey] !== null && prefix === '/') {
      Object.assign(this[fourOhFourContextKey], context) // Replace the default 404 handler
      return
    }

    this[fourOhFourLevelInstanceKey][fourOhFourContextKey] = context

    fourOhFour.all(prefix + (prefix.endsWith('/') ? '*' : '/*'), routeHandler, context)
    fourOhFour.all(prefix || '/', routeHandler, context)
  }

  function setSchemaCompiler (schemaCompiler) {
    throwIfAlreadyStarted('Cannot call "setSchemaCompiler" when fastify instance is already started!')

    this._schemaCompiler = schemaCompiler
    return this
  }

  function setErrorHandler (func) {
    throwIfAlreadyStarted('Cannot call "setErrorHandler" when fastify instance is already started!')

    this._errorHandler = func
    return this
  }

  function buildMiddie (middlewares) {
    if (!middlewares.length) {
      return null
    }

    const middie = Middie(onRunMiddlewares)
    for (var i = 0; i < middlewares.length; i++) {
      middie.use.apply(middie, middlewares[i])
    }

    return middie
  }
}

function http2 () {
  try {
    return require('http2')
  } catch (err) {
    console.error('http2 is available only from node >= 8.8.1')
  }
}

module.exports = build
