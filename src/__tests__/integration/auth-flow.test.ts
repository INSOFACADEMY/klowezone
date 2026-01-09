import { createApiKey, verifyApiKey } from '@/lib/api-keys'

// Mock the database operations for integration tests
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

describe('Authentication Flow Integration', () => {
  describe('API Key Lifecycle', () => {
    it('should create and verify an API key successfully', async () => {
      const orgId = 'test-org-123'
      const userId = 'test-user-123'
      const name = 'Integration Test Key'

      // Mock database responses
      const mockPrisma = require('@/lib/prisma').prisma
      const mockApiKeyRecord = {
        id: 'test-key-id',
        organizationId: orgId,
        name,
        keyPrefix: 'kz_live_abc123',
        keyHash: 'hashed-key',
        createdAt: new Date(),
      }

      mockPrisma.apiKey.create.mockResolvedValue(mockApiKeyRecord)
      mockPrisma.apiKey.findUnique.mockResolvedValue(mockApiKeyRecord)

      // Test API key creation
      const createResult = await createApiKey(orgId, userId, name)

      expect(createResult).toHaveProperty('apiKeyPlain')
      expect(createResult).toHaveProperty('apiKeyRecord')
      expect(createResult.apiKeyRecord.organizationId).toBe(orgId)
      expect(createResult.apiKeyRecord.name).toBe(name)

      // Extract the API key for verification test
      const apiKey = createResult.apiKeyPlain

      // Test API key verification
      const verifyResult = await verifyApiKey(apiKey)

      expect(verifyResult).toBeTruthy()
      expect(verifyResult?.orgId).toBe(orgId)
      expect(verifyResult?.apiKeyId).toBe('test-key-id')
    })

    it('should handle API key verification failure', async () => {
      // Mock database to return null (key not found)
      const mockPrisma = require('@/lib/prisma').prisma
      mockPrisma.apiKey.findUnique.mockResolvedValue(null)

      const invalidKey = 'kz_live_invalid12345678901234567890123456789012'
      const result = await verifyApiKey(invalidKey)

      expect(result).toBeNull()
    })
  })

  describe('Multi-tenant Isolation', () => {
    it('should ensure API keys are properly scoped to organizations', async () => {
      const orgA = 'org-a-123'
      const orgB = 'org-b-456'

      // Mock different responses for different orgs
      const mockPrisma = require('@/lib/prisma').prisma
      mockPrisma.apiKey.findUnique
        .mockResolvedValueOnce({
          id: 'key-a',
          organizationId: orgA,
          keyHash: 'hash-a',
        })
        .mockResolvedValueOnce(null) // Org B key not found

      // Org A key should work
      const resultA = await verifyApiKey('kz_live_keyfromorga12345678901234567890123456789012')
      expect(resultA?.orgId).toBe(orgA)

      // Org B key should fail
      const resultB = await verifyApiKey('kz_live_keyfromorgb12345678901234567890123456789012')
      expect(resultB).toBeNull()
    })
  })
})





