'use strict'

const applicationHooks = [
  'onRoute',
  'onRegister',
  'onReady',
  'onClose'
]
const lifecycleHooks = [
  'onTimeout',
  'onRequest',
  'preParsing',
  'preValidation',
  'preSerialization',
  'preHandler',
  'onSend',
  'onResponse',
  'onError'
]
const supportedHooks = lifecycleHooks.concat(applicationHooks)
const {
  FST_ERR_HOOK_INVALID_TYPE,
  FST_ERR_HOOK_INVALID_HANDLER,
  FST_ERR_SEND_UNDEFINED_ERR,
  FST_ERR_HOOK_TIMEOUT,
  AVVIO_ERRORS_MAP,
  appendStackTrace
} = require('./errors')

const {
  kChildren,
  kHooks
} = require('./symbols')

function Hooks () {
  this.onRequest = []
  this.preParsing = []
  this.preValidation = []
  this.preSerialization = []
  this.preHandler = []
  this.onResponse = []
  this.onSend = []
  this.onError = []
  this.onRoute = []
  this.onRegister = []
  this.onReady = []
  this.onTimeout = []
}

Hooks.prototype.validate = function (hook, fn) {
  if (typeof hook !== 'string') throw new FST_ERR_HOOK_INVALID_TYPE()
  if (typeof fn !== 'function') throw new FST_ERR_HOOK_INVALID_HANDLER()
  if (supportedHooks.indexOf(hook) === -1) {
    throw new Error(`${hook} hook not supported!`)
  }
}

Hooks.prototype.add = function (hook, fn) {
  this.validate(hook, fn)
  this[hook].push(fn)
}

function buildHooks (h) {
  const hooks = new Hooks()
  hooks.onRequest = h.onRequest.slice()
  hooks.preParsing = h.preParsing.slice()
  hooks.preValidation = h.preValidation.slice()
  hooks.preSerialization = h.preSerialization.slice()
  hooks.preHandler = h.preHandler.slice()
  hooks.onSend = h.onSend.slice()
  hooks.onResponse = h.onResponse.slice()
  hooks.onError = h.onError.slice()
  hooks.onRoute = h.onRoute.slice()
  hooks.onRegister = h.onRegister.slice()
  hooks.onTimeout = h.onTimeout.slice()
  hooks.onReady = []
  return hooks
}

function hookRunnerApplication (hookName, boot, server, cb) {
  const hooks = server[kHooks][hookName]
  let i = 0
  let c = 0

  next()

  function exit (err) {
    if (err) {
      if (err.code === 'AVV_ERR_READY_TIMEOUT') {
        err = appendStackTrace(err, new FST_ERR_HOOK_TIMEOUT(hookName))
      } else {
        err = AVVIO_ERRORS_MAP[err.code] != null
          ? appendStackTrace(err, new AVVIO_ERRORS_MAP[err.code](err.message))
          : err
      }

      cb(err)
      return
    }
    cb()
  }

  function next (err) {
    if (err) {
      exit(err)
      return
    }

    if (i === hooks.length && c === server[kChildren].length) {
      if (i === 0 && c === 0) { // speed up start
        exit()
      } else {
        // This is the last function executed for every fastify instance
        boot(function manageTimeout (err, done) {
          // this callback is needed by fastify to provide an hook interface without the error
          // as first parameter and managing it on behalf the user
          exit(err)

          // this callback is needed by avvio to continue the loading of the next `register` plugins
          done(err)
        })
      }
      return
    }

    if (i === hooks.length && c < server[kChildren].length) {
      const child = server[kChildren][c++]
      hookRunnerApplication(hookName, boot, child, next)
      return
    }

    boot(wrap(hooks[i++], server))
    next()
  }

  function wrap (fn, server) {
    return function (err, done) {
      if (err) {
        done(err)
        return
      }

      if (fn.length === 1) {
        try {
          fn.call(server, done)
        } catch (error) {
          done(error)
        }
        return
      }

      const ret = fn.call(server)
      if (ret && typeof ret.then === 'function') {
        ret.then(done, done)
        return
      }

      done(err) // auto done
    }
  }
}

function hookRunner (functions, runner, request, reply, cb) {
  let i = 0

  function next (err) {
    if (err || i === functions.length) {
      cb(err, request, reply)
      return
    }

    let result
    try {
      result = runner(functions[i++], request, reply, next)
    } catch (error) {
      next(error)
      return
    }
    if (result && typeof result.then === 'function') {
      result.then(handleResolve, handleReject)
    }
  }

  function handleResolve () {
    next()
  }

  function handleReject (err) {
    if (!err) {
      err = new FST_ERR_SEND_UNDEFINED_ERR()
    }

    cb(err, request, reply)
  }

  next()
}

function onSendHookRunner (functions, request, reply, payload, cb) {
  let i = 0

  function next (err, newPayload) {
    if (err) {
      cb(err, request, reply, payload)
      return
    }

    if (newPayload !== undefined) {
      payload = newPayload
    }

    if (i === functions.length) {
      try {
        cb(null, request, reply, payload)
      } catch (err) {
        handleReject(err)
      }
      return
    }

    let result
    try {
      result = functions[i++](request, reply, payload, next)
    } catch (error) {
      next(error)
      return
    }
    if (result && typeof result.then === 'function') {
      result.then(handleResolve, handleReject)
    }
  }

  function handleResolve (newPayload) {
    next(null, newPayload)
  }

  function handleReject (err) {
    cb(err, request, reply, payload)
  }

  next()
}

function hookIterator (fn, request, reply, next) {
  if (reply.sent === true) return undefined
  return fn(request, reply, next)
}

module.exports = {
  Hooks,
  buildHooks,
  hookRunner,
  onSendHookRunner,
  hookIterator,
  hookRunnerApplication,
  lifecycleHooks
}
