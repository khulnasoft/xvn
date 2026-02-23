export class Logger {
  static log(level, message, context = {}) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    }
    
    // In production, this could be sent to a logging service
    console.log(JSON.stringify(logEntry))
  }

  static info(message, context) {
    this.log('INFO', message, context)
  }

  static warn(message, context) {
    this.log('WARN', message, context)
  }

  static error(message, context) {
    this.log('ERROR', message, context)
  }

  static debug(message, context) {
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development') {
      this.log('DEBUG', message, context)
    }
  }
}

export function errorHandler(error, c) {
  Logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    path: c.req.path,
    method: c.req.method,
    headers: Object.fromEntries(c.req.headers())
  })

  // Don't expose internal errors in production
  const isDevelopment = typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development'
  
  if (error.name === 'ValidationError') {
    return c.json({ 
      error: 'Validation failed', 
      details: isDevelopment ? error.message : undefined 
    }, 400)
  }

  if (error.name === 'UnauthorizedError') {
    return c.json({ 
      error: 'Unauthorized' 
    }, 401)
  }

  if (error.name === 'ForbiddenError') {
    return c.json({ 
      error: 'Forbidden' 
    }, 403)
  }

  if (error.name === 'NotFoundError') {
    return c.json({ 
      error: 'Not found' 
    }, 404)
  }

  // Default error response
  return c.json({ 
    error: 'Internal server error' 
  }, 500)
}
