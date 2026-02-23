import { z } from 'zod'

// Token validation schemas
export const TokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  uuid: z.string().min(1, 'UUID is required'),
  scope: z.array(z.object({
    values: z.array(z.string()),
    types: z.object({
      pkg: z.object({
        read: z.boolean().optional(),
        write: z.boolean().optional()
      }).optional(),
      user: z.object({
        read: z.boolean().optional(),
        write: z.boolean().optional()
      }).optional()
    })
  }))
})

// Package validation schemas
export const PackageNameSchema = z.string()
  .min(1, 'Package name is required')
  .max(214, 'Package name too long')
  .regex(/^[a-z0-9-_\.]+$/, 'Invalid package name format')

export const ScopedPackageSchema = z.string()
  .regex(/^@[a-z0-9-_\.]+\/[a-z0-9-_\.]+$/, 'Invalid scoped package name format')

export const VersionSchema = z.string()
  .min(1, 'Version is required')
  .regex(/^\d+\.\d+\.\d+/, 'Invalid semantic version')

// User validation schemas
export const UserSchema = z.object({
  uuid: z.string().min(1, 'UUID is required'),
  email: z.string().email('Invalid email format').optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long')
})

// Request validation middleware
export function validateRequest(schema) {
  return async (c, next) => {
    try {
      const body = await c.req.json()
      const validated = schema.parse(body)
      c.set('validated', validated)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new Error('Validation failed')
        validationError.name = 'ValidationError'
        validationError.details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        throw validationError
      }
      throw error
    }
  }
}

// Parameter validation middleware
export function validateParams(schema) {
  return async (c, next) => {
    try {
      const params = c.req.param()
      const validated = schema.parse(params)
      c.set('validatedParams', validated)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new Error('Parameter validation failed')
        validationError.name = 'ValidationError'
        validationError.details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        throw validationError
      }
      throw error
    }
  }
}

// Query validation middleware
export function validateQuery(schema) {
  return async (c, next) => {
    try {
      const query = c.req.query()
      const validated = schema.parse(query)
      c.set('validatedQuery', validated)
      await next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new Error('Query validation failed')
        validationError.name = 'ValidationError'
        validationError.details = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
        throw validationError
      }
      throw error
    }
  }
}
