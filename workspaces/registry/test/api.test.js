import { describe, it, expect, beforeEach, vi } from 'vitest'
import app from '../src/index.js'

// Mock Cloudflare Workers environment
const mockEnv = {
  DB: {
    prepare: vi.fn(() => ({
      bind: vi.fn(() => ({
        run: vi.fn(() => Promise.resolve({ results: [] }))
      }))
    }))
  },
  BUCKET: {
    get: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve())
  }
}

describe('XVN Registry API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /-/ping', () => {
    it('should return pong', async () => {
      const res = await app.request('/-/ping', {}, mockEnv)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json).toEqual({})
    })
  })

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const res = await app.request('/-/whoami', {}, mockEnv)
      expect(res.status).toBe(401)
    })

    it('should accept requests with valid auth token', async () => {
      // Mock successful token lookup
      mockEnv.DB.prepare().bind().run.mockResolvedValue({
        results: [{
          token: 'test-token',
          uuid: 'test-user',
          scope: '[{"values": ["*"], "types": {"user": {"read": true}}}]'
        }]
      })

      const res = await app.request('/-/whoami', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }, mockEnv)
      
      expect(res.status).toBe(200)
    })
  })

  describe('Package Operations', () => {
    beforeEach(() => {
      // Mock package queries
      mockEnv.DB.prepare().bind().run.mockImplementation((query) => {
        if (query.includes('packages')) {
          return Promise.resolve({ results: [] })
        }
        if (query.includes('versions')) {
          return Promise.resolve({ results: [] })
        }
        return Promise.resolve({ results: [] })
      })
    })

    it('should return 404 for non-existent packages', async () => {
      const res = await app.request('/non-existent-package', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }, mockEnv)
      
      expect(res.status).toBe(404)
    })

    it('should handle scoped package requests', async () => {
      const res = await app.request('/@scope/package-name', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }, mockEnv)
      
      expect(res.status).toBe(404) // Expected since no data is mocked
    })
  })
})
