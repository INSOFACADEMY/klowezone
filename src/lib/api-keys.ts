/**
 * API KEYS SERVICE
 *
 * Secure API key management with hashing and organization isolation
 */

import { prisma } from '@/lib/prisma'
import { randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'
import { logAuditEvent } from '@/lib/logging-service'

const scryptAsync = promisify(scrypt)

export interface CreateApiKeyResult {
  apiKeyPlain: string
  apiKeyRecord: {
    id: string
    name: string
    keyPrefix: string
    organizationId: string
    createdByUserId: string | null
    createdAt: Date
  }
}

export interface VerifyApiKeyResult {
  orgId: string
  apiKeyId: string
  name: string
}

export interface ApiKeyRecord {
  id: string
  name: string
  keyPrefix: string
  lastUsedAt: Date | null
  createdAt: Date
  createdByUserId: string | null
}

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
  const isProduction = process.env.NODE_ENV === 'production'
  const prefix = isProduction ? 'kz_live_' : 'kz_test_'
  const randomPart = randomBytes(32).toString('hex')
  return prefix + randomPart
}

/**
 * Hash an API key using scrypt
 */
async function hashApiKey(apiKey: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(apiKey, salt, 64) as Buffer
  return salt.toString('hex') + ':' + key.toString('hex')
}

/**
 * Verify an API key against its hash
 */
async function verifyApiKeyHash(apiKey: string, storedHash: string): Promise<boolean> {
  try {
    const [saltHex, keyHex] = storedHash.split(':')
    const salt = Buffer.from(saltHex, 'hex')
    const storedKey = Buffer.from(keyHex, 'hex')

    const computedKey = await scryptAsync(apiKey, salt, 64) as Buffer
    return computedKey.equals(storedKey)
  } catch (error) {
    return false
  }
}

/**
 * Create a new API key for an organization
 */
export async function createApiKey(
  orgId: string,
  userId: string | null,
  name: string
): Promise<CreateApiKeyResult> {
  // Generate the API key
  const apiKeyPlain = generateApiKey()
  const keyPrefix = apiKeyPlain.substring(0, 8) + '****'

  // Hash the API key
  const keyHash = await hashApiKey(apiKeyPlain)

  // Create the database record
  const apiKeyRecord = await prisma.apiKey.create({
    data: {
      organizationId: orgId,
      name,
      keyPrefix,
      keyHash,
      createdByUserId: userId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      organizationId: true,
      createdByUserId: true,
      createdAt: true,
    },
  })

  // Log the audit event
  if (userId) {
    await logAuditEvent({
      userId,
      organizationId: orgId,
      action: 'API_KEY_CREATED',
      resourceType: 'API_KEY',
      resourceId: apiKeyRecord.id,
      details: { name, keyPrefix },
    })
  }

  return {
    apiKeyPlain,
    apiKeyRecord,
  }
}

/**
 * Verify an API key and return organization info
 */
export async function verifyApiKey(apiKeyPlain: string): Promise<VerifyApiKeyResult | null> {
  // Find all API keys with matching prefix for efficiency
  const keyPrefix = apiKeyPlain.substring(0, 8) + '****'
  const potentialKeys = await prisma.apiKey.findMany({
    where: {
      keyPrefix,
      isRevoked: false,
    },
    select: {
      id: true,
      keyHash: true,
      organizationId: true,
      name: true,
      keyPrefix: true,
    },
  })

  // Check each potential key
  for (const apiKey of potentialKeys) {
    const isValid = await verifyApiKeyHash(apiKeyPlain, apiKey.keyHash)
    if (isValid) {
      // Update lastUsedAt asynchronously
      prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      }).catch(error => {
        console.error('Failed to update API key lastUsedAt:', error)
      })

      // Log audit event asynchronously
      logAuditEvent({
        userId: null, // API key usage doesn't have a user
        organizationId: apiKey.organizationId,
        action: 'API_KEY_USED',
        resourceType: 'API_KEY',
        resourceId: apiKey.id,
        details: {
          keyPrefix: apiKey.keyPrefix,
          keyName: apiKey.name,
          usedAt: new Date().toISOString(),
        },
      }).catch(error => {
        console.error('Failed to log API key usage audit event:', error)
      })

      return {
        orgId: apiKey.organizationId,
        apiKeyId: apiKey.id,
        name: apiKey.name,
      }
    }
  }

  return null
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(id: string, orgId: string, revokedByUserId?: string): Promise<void> {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      organizationId: orgId,
      isRevoked: false,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
    },
  })

  if (!apiKey) {
    throw new Error('API key not found or already revoked')
  }

  await prisma.apiKey.update({
    where: { id },
    data: {
      isRevoked: true,
      revokedAt: new Date(),
    },
  })

  // Log the audit event
  if (revokedByUserId) {
    await logAuditEvent({
      userId: revokedByUserId,
      organizationId: orgId,
      action: 'API_KEY_REVOKED',
      resourceType: 'API_KEY',
      resourceId: id,
      details: { name: apiKey.name, keyPrefix: apiKey.keyPrefix },
    })
  }
}

/**
 * List API keys for an organization (never returns hashes)
 */
export async function listApiKeys(orgId: string): Promise<ApiKeyRecord[]> {
  const apiKeys = await prisma.apiKey.findMany({
    where: {
      organizationId: orgId,
      isRevoked: false,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      createdByUserId: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return apiKeys.map(key => ({
    id: key.id,
    name: key.name,
    keyPrefix: key.keyPrefix,
    lastUsedAt: key.lastUsedAt,
    createdAt: key.createdAt,
    createdByUserId: key.createdByUserId,
  }))
}

/**
 * Get API key by ID (for admin purposes)
 */
export async function getApiKeyById(id: string, orgId: string): Promise<ApiKeyRecord | null> {
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      id,
      organizationId: orgId,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      createdAt: true,
      createdByUserId: true,
      isRevoked: true,
      revokedAt: true,
    },
  })

  if (!apiKey) return null

  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    lastUsedAt: apiKey.lastUsedAt,
    createdAt: apiKey.createdAt,
    createdByUserId: apiKey.createdByUserId,
  }
}
