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
import { getUsername, getUserProfile, addUser } from "./routes/users"
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

// Add rate limiting (using D1 for storage)
app.use('*', async (c, next) => {
  const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '127.0.0.1'
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  
  try {
    // Clean old entries
    await c.env.DB.prepare(`
      DELETE FROM rate_limits WHERE timestamp < ?1
    `).bind(now - windowMs).run()
    
    // Check current rate limit
    const { results } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM rate_limits 
      WHERE ip = ?1 AND timestamp > ?2
    `).bind(clientIP, now - windowMs).run()
    
    const requestCount = results[0]?.count || 0
    
    if (requestCount >= 100) {
      return c.json({ 
        error: 'Too many requests, please try again later.' 
      }, 429)
    }
    
    // Record this request
    await c.env.DB.prepare(`
      INSERT INTO rate_limits (ip, timestamp) VALUES (?1, ?2)
    `).bind(clientIP, now).run()
    
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    Logger.warn('Rate limiting failed', { error: error.message, ip: clientIP })
  }
  
  await next()
})

// Pretty JSON
app.use(prettyJSON({ space: 2 }))

// -------------------------
// Proxied or Global Requests
// -------------------------

function isPrivate(c) {
  const { path } = c.req
  const routes = [
    '/images',
    '/styles',
    '/-/npm/v1/user', // Allow user creation without auth
    '/-/v1/login',   // Allow login without auth
    '/-/user/org.couchdb.user:' // Allow adduser without auth
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
app.get('/-/ping', (c) => c.json({
  message: 'pong',
  timestamp: new Date().toISOString()
}, 200))

// GET /-/all (package listing)
app.get('/-/all', async (c) => {
  try {
    const query = "SELECT name FROM packages ORDER BY name"
    const { results } = await c.env.DB.prepare(query).all()
    const packages = results.map(row => row.name)
    return c.json(packages)
  } catch (error) {
    Logger.error('Failed to fetch package list', { error: error.message })
    return c.json({ error: 'Failed to fetch packages' }, 500)
  }
})

// GET /-/v1/search (package search)
app.get('/-/v1/search', async (c) => {
  try {
    const text = c.req.query('text') || ''
    const size = parseInt(c.req.query('size')) || 20
    const from = parseInt(c.req.query('from')) || 0
    
    let query = "SELECT name, tags FROM packages"
    let params = []
    
    if (text) {
      query += " WHERE name LIKE ?1"
      params.push(`%${text}%`)
    }
    
    query += " ORDER BY name LIMIT ?2 OFFSET ?3"
    params.push(size, from)
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    const packages = results.map(pkg => ({
      package: {
        name: pkg.name,
        version: "1.0.0",
        description: pkg.tags?.description || "No description available",
        date: new Date().toISOString(),
        keywords: [],
        publisher: { username: "admin", email: "", name: "Admin" },
        maintainers: [{ username: "admin", email: "", name: "Admin" }],
        links: {
          npm: `https://xvn.neopilot.workers.dev/${pkg.name}`,
          repository: null,
          bugs: null,
          homepage: null
        }
      },
      downloads: { monthly: 0, weekly: 0 },
      dependents: "0",
      updated: new Date().toISOString(),
      searchScore: 1.0,
      score: { final: 1.0, detail: { popularity: 0.5, quality: 0.5, maintenance: 0.5 } },
      flags: { insecure: 0 }
    }))    
    return c.json({
      objects: packages,
      total: packages.length,
      time: new Date().toISOString()
    })
  } catch (error) {
    Logger.error('Search failed', { error: error.message, query: c.req.query() })
    return c.json({ error: 'Search failed' }, 500)
  }
})

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

// POST /-/npm/v1/user (user creation)
app.post('/-/npm/v1/user', addUser)

// POST /-/v1/login (npm login)
app.post('/-/v1/login', addUser)

// PUT /-/user/org.couchdb.user:username (npm adduser)
app.put('/-/user/org.couchdb.user/:username', addUser)

// GET /-/v1/search (package search)
app.get('/-/v1/search', async (c) => {
  try {
    const text = c.req.query('text') || ''
    const size = parseInt(c.req.query('size')) || 20
    const from = parseInt(c.req.query('from')) || 0
    
    let query = "SELECT name, tags FROM packages"
    let params = []
    
    if (text) {
      query += " WHERE name LIKE ?1"
      params.push(`%${text}%`)
    }
    
    query += " ORDER BY name LIMIT ?2 OFFSET ?3"
    params.push(size, from)
    
    const { results } = await c.env.DB.prepare(query).bind(...params).all()
    
    const packages = results.map(pkg => ({
      package: {
        name: pkg.name,
        version: "1.0.0",
        description: pkg.tags?.description || "No description available",
        date: new Date().toISOString(),
        keywords: [],
        publisher: { username: "admin", email: "", name: "Admin" },
        maintainers: [{ username: "admin", email: "", name: "Admin" }],
        links: {
          npm: `https://xvn.neopilot.workers.dev/${pkg.name}`,
          repository: null,
          bugs: null,
          homepage: null
        }
      },
      downloads: { monthly: 0, weekly: 0 },
      dependents: "0",
      updated: new Date().toISOString(),
      searchScore: 1.0,
      score: { final: 1.0, detail: { popularity: 0.5, quality: 0.5, maintenance: 0.5 } },
      flags: { insecure: 0 }
    }))
    
    return c.json({
      objects: packages,
      total: packages.length,
      time: new Date().toISOString()
    })
  } catch (error) {
    Logger.error('Search failed', { error: error.message, query: c.req.query() })
    return c.json({ error: 'Search failed' }, 500)
  }
})

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
app.get('/:pkg/-/:tarball', getPackageTarball)
app.get('/:pkg', getPackagePackument)
app.get('/:pkg/:version', getPackageManifest)

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
