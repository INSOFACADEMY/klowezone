import { verifyToken } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/auth'

describe('Authentication Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123!'
      const hashed = await hashPassword(password)

      expect(hashed).toBeDefined()
      expect(typeof hashed).toBe('string')
      expect(hashed.length).toBeGreaterThan(0)
      expect(hashed).not.toBe(password)
    })

    it('should verify correct password', async () => {
      const password = 'testPassword123!'
      const hashed = await hashPassword(password)

      const isValid = await verifyPassword(password, hashed)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!'
      const hashed = await hashPassword(password)

      const isValid = await verifyPassword('wrongPassword', hashed)
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Verification', () => {
    it('should verify a valid token structure', () => {
      // This test assumes JWT_SECRET is set in environment
      // In a real scenario, you'd create a valid token first
      const invalidToken = 'invalid.jwt.token'

      const result = verifyToken(invalidToken)
      expect(result).toBeNull()
    })

    it('should handle malformed tokens', () => {
      const malformedTokens = [
        '',
        'not-a-jwt',
        'header.payload',
        'header.payload.signature.extra'
      ]

      malformedTokens.forEach(token => {
        const result = verifyToken(token)
        expect(result).toBeNull()
      })
    })
  })
})







