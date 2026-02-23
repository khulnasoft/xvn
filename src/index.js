// TODO: check all SQL query strings for SQL injection vulnerabilities
// TODO: switch to using prepared statements/parameterized queries
// ex. c.env.DB.prepare("SELECT * FROM users WHERE user_id = ?1").bind(userId)
// ref. https://developers.cloudflare.com/d1/build-with-d1/d1-client-api/
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { bearerAuth } from 'hono/bearer-auth'
import { prettyJSON } from 'hono/pretty-json'
import { except } from 'hono/combine'
import { apiReference } from '@scalar/hono-api-reference'
import { secureHeaders } from 'hono/secure-headers'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { rateLimiter } from 'hono-rate-limiter'

import { PROXIES, API_DOCS } from '../config.js'
import { verifyToken } from './utils/auth'
import { Logger, errorHandler } from './utils/logger'
import { getUsername, getUserProfile } from './routes/users'
import { getToken, putToken, postToken, deleteToken } from './routes/tokens'
import { packageSpec } from './utils/packages'

import {
  getPackageManifest,
  getPackagePackument,
  getPackageTarball,
  publishPackage,
} from './routes/packages'

// Hono instance
const app = new Hono({ strict: false })

// Trim trailing slash requests
app.use(trimTrailingSlash())

// Add requestId
app.use('*', requestId())

// Add secure headers
app.use(secureHeaders())

// TODO: Re-enable rate limiter after fixing global scope issue
// app.use('*', rateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: { error: 'Too many requests, please try again later.' },
//   standardHeaders: true,
//   legacyHeaders: false,
// }))

// Pretty JSON
app.use(prettyJSON({ space: 2 }))

// -------------------------
// Proxied or Global Requests
// -------------------------

function isPrivate(c) {
  const { path } = c.req
  const routes = [
    '/images',
    '/styles'
  ]
  return path === '/' || !!routes.filter(r => path.startsWith(r)).length
}

async function proxyRoute (c) {
  let { ref, version } = packageSpec(c)
  const ret = await fetch(`${PROXIES[ref]}${ref}/${version}`)
  const json = await ret.json()
  return c.json(json, 200)
}

if (PROXIES) {
  for (const proxy of PROXIES) {
    app.get(proxy, proxyRoute)
    app.get(`${proxy}/`, proxyRoute)
  }
}

// -------------------------
// Documentation
// -------------------------

// GET scalar API reference
app.get('/', apiReference(API_DOCS))

// GET /-/ping
app.get('/-/ping', (c) => c.json({}, 200))

// -------------------------
// Authorization
// -------------------------

// Verify token
app.use('*', except(isPrivate, bearerAuth({ verifyToken })))

// -------------------------
// Users / Authentication
// -------------------------

// GET a user profile
app.get('/-/whoami', getUsername)

// GET /-/npm/v1/user
app.get('/-/npm/v1/user', getUserProfile)

// -------------------------
// Tokens
// -------------------------

// GET a token profile (checked)
app.get('/-/npm/v1/tokens', getToken)

// POST a new token
app.post('/-/npm/v1/tokens', postToken)

// PUT an existing token
app.put('/-/npm/v1/tokens', putToken)

// DELETE a new token
app.delete('/-/npm/v1/tokens/token/:token', deleteToken)

// -------------------------
// Packages
// -------------------------

app.get('/:scope/:pkg', getPackagePackument)
app.get('/:scope/:pkg/:version', getPackageManifest)
app.get('/:scope/:pkg/-/:tarball', getPackageTarball)
app.get('/:pkg/:version', getPackageManifest)
app.get('/:pkg/-/:tarball', getPackageTarball)
app.get('/:pkg', getPackagePackument)
app.put('/:scope/:pkg', publishPackage)
app.put('/:pkg', publishPackage)

// -------------------------
// Fallbacks
// -------------------------

app.get('*', (c) => c.json({ error: 'Not found' }, 404))

// Global error handler
app.onError(errorHandler)

// Log requests in development
if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development') {
  app.use('*', async (c, next) => {
    const start = Date.now()
    await next()
    const duration = Date.now() - start
    Logger.info('Request completed', {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      duration: `${duration}ms`
    })
  })
}

export default app
