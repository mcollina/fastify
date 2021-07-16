'use strict'

const proxyAddr = require('proxy-addr')
const semver = require('semver')
const warning = require('./warnings')

function Request (id, params, req, query, log, context) {
  this.id = id
  this.context = context
  this.params = params
  this.raw = req
  this.query = query
  this.log = log
  this.body = null
}

function getTrustProxyFn (tp) {
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
  return proxyAddr.compile(tp)
}

function buildRequest (R, trustProxy) {
  if (trustProxy) {
    return buildRequestWithTrustProxy(R, trustProxy)
  }

  return buildRegularRequest(R)
}

function buildRegularRequest (R) {
  function _Request (id, params, req, query, log, context) {
    this.id = id
    this.context = context
    this.params = params
    this.raw = req
    this.query = query
    this.log = log
    this.body = null
  }
  _Request.prototype = new R()

  return _Request
}

function getLastEntryInMultiHeaderValue (headerValue) {
  // we use the last one if the header is set more than once
  const lastIndex = headerValue.lastIndexOf(',')
  return lastIndex === -1 ? headerValue.trim() : headerValue.slice(lastIndex + 1).trim()
}

function buildRequestWithTrustProxy (R, trustProxy) {
  const _Request = buildRegularRequest(R)
  const proxyFn = getTrustProxyFn(trustProxy)

  Object.defineProperties(_Request.prototype, {
    ip: {
      get () {
        return proxyAddr(this.raw, proxyFn)
      }
    },
    ips: {
      get () {
        return proxyAddr.all(this.raw, proxyFn)
      }
    },
    hostname: {
      get () {
        if (this.ip !== undefined && this.headers['x-forwarded-host']) {
          return getLastEntryInMultiHeaderValue(this.headers['x-forwarded-host'])
        }
        return this.headers.host || this.headers[':authority']
      }
    },
    protocol: {
      get () {
        if (this.headers['x-forwarded-proto']) {
          return getLastEntryInMultiHeaderValue(this.headers['x-forwarded-proto'])
        }
        return this.socket.encrypted ? 'https' : 'http'
      }
    }
  })

  return _Request
}

Object.defineProperties(Request.prototype, {
  req: {
    get () {
      warning.emit('FSTDEP001')
      return this.raw
    }
  },
  url: {
    get () {
      return this.raw.url
    }
  },
  method: {
    get () {
      return this.raw.method
    }
  },
  routerPath: {
    get () {
      return this.context.config.url
    }
  },
  routerMethod: {
    get () {
      return this.context.config.method
    }
  },
  is404: {
    get () {
      return this.context.config.url === undefined
    }
  },
  connection: {
    get () {
      /* istanbul ignore next */
      if (semver.gte(process.versions.node, '13.0.0')) {
        warning.emit('FSTDEP005')
      }
      return this.raw.connection
    }
  },
  socket: {
    get () {
      return this.raw.socket
    }
  },
  ip: {
    get () {
      return this.socket.remoteAddress
    }
  },
  hostname: {
    get () {
      return this.raw.headers.host || this.raw.headers[':authority']
    }
  },
  protocol: {
    get () {
      return this.socket.encrypted ? 'https' : 'http'
    }
  },
  headers: {
    get () {
      return this.raw.headers
    },
    set (headers) {
      for (const [header, value] of Object.entries(headers)) {
        this.setHeader(header, value)
      }
    }
  },
  server: {
    value: null,
    writable: true
  }
})

module.exports = Request
module.exports.buildRequest = buildRequest
