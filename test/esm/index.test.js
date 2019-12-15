'use strict'

const t = require('tap')
const semver = require('semver')

if (semver.lt(process.versions.node, '13.3.0')) {
  t.skip('Skip because Node version <= 13.3.0')
  t.end()
} else {
  // Node v8 throw a `SyntaxError: Unexpected token import`
  // even if this branch is never touch in the code,
  // by using `eval` we can avoid this issue.
  // eslint-disable-next-line
  eval(`import('./esm.mjs').catch((err) => {
    process.nextTick(() => {
      throw err
    })
  })`)
}
