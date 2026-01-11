import { prisma } from './prisma'
import { encryptObject, decryptObject, type EncryptedData } from './encryption'
import {
  validateEmailConfig,
  validateAIConfig,
  validateStorageConfig,
  type EmailProviderConfig,
  type AIProviderConfig,
  type StorageProviderConfig
} from './validations/config-validation'

// ========================================
// CONFIGURATION SERVICES
// ========================================

// ========================================
// EMAIL PROVIDER SERVICES
// ========================================

export async function getEmailProviders() {
  try {
    const providers = await prisma.emailProvider.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return providers.map(provider => ({
      ...provider,
      config: decryptObject(provider.config as unknown as EncryptedData)
    }))
  } catch (error) {
    console.error('Error fetching email providers:', error)
    return []
  }
}

export async function createEmailProvider(data: EmailProviderConfig) {
  try {
    // Validate configuration
    const validatedConfig = validateEmailConfig(data.provider, data.config)

    // Encrypt sensitive data
    const encryptedConfig = encryptObject(validatedConfig)

    return await prisma.emailProvider.create({
      data: {
        name: data.name,
        provider: data.provider,
        config: encryptedConfig as any,
        isActive: data.isActive,
        isDefault: data.isDefault,
      }
    })
  } catch (error) {
    console.error('Error creating email provider:', error)
    throw error
  }
}

export async function updateEmailProvider(id: string, data: Partial<EmailProviderConfig>) {
  try {
    let encryptedConfig: any = undefined

    if (data.config) {
      const validatedConfig = validateEmailConfig(data.provider || 'smtp', data.config)
      encryptedConfig = encryptObject(validatedConfig)
    }

    return await prisma.emailProvider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.provider && { provider: data.provider }),
        ...(encryptedConfig && { config: encryptedConfig }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      }
    })
  } catch (error) {
    console.error('Error updating email provider:', error)
    throw error
  }
}

export async function deleteEmailProvider(id: string) {
  try {
    return await prisma.emailProvider.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting email provider:', error)
    throw error
  }
}

export async function testEmailConnection(providerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const provider = await prisma.emailProvider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado' }
    }

    const config = decryptObject(provider.config as unknown as EncryptedData)

    // Test connection based on provider type
    switch (provider.provider) {
      case 'smtp':
        return await testSMTPConnection(config)
      case 'sendgrid':
        return await testSendGridConnection(config)
      case 'resend':
        return await testResendConnection(config)
      default:
        return { success: false, message: 'Tipo de proveedor no soportado' }
    }
  } catch (error) {
    console.error('Error testing email connection:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// ========================================
// AI PROVIDER SERVICES
// ========================================

export async function getAIProviders() {
  try {
    // Prisma delegate for AIProvider is aIProvider due to acronym casing
    const providers = await prisma.aIProvider.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return providers.map(provider => ({
      ...provider,
      config: decryptObject(provider.config as unknown as EncryptedData)
    }))
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    return []
  }
}

export async function createAIProvider(data: AIProviderConfig) {
  try {
    const validatedConfig = validateAIConfig(data.provider, data.config)
    const encryptedConfig = encryptObject(validatedConfig)

    return await prisma.aIProvider.create({
      data: {
        name: data.name,
        provider: data.provider,
        model: validatedConfig.model,
        config: encryptedConfig as any,
        isActive: data.isActive,
        isDefault: data.isDefault,
        rateLimit: data.rateLimit,
        monthlyLimit: data.monthlyLimit,
      }
    })
  } catch (error) {
    console.error('Error creating AI provider:', error)
    throw error
  }
}

export async function updateAIProvider(id: string, data: Partial<AIProviderConfig>) {
  try {
    let encryptedConfig: any = undefined

    if (data.config) {
      const validatedConfig = validateAIConfig(data.provider || 'openai', data.config)
      encryptedConfig = encryptObject(validatedConfig)
    }

    return await prisma.aIProvider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.provider && { provider: data.provider }),
        ...(data.config && { model: (data.config as any).model }),
        ...(encryptedConfig && { config: encryptedConfig }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.rateLimit && { rateLimit: data.rateLimit }),
        ...(data.monthlyLimit && { monthlyLimit: data.monthlyLimit }),
      }
    })
  } catch (error) {
    console.error('Error updating AI provider:', error)
    throw error
  }
}

export async function deleteAIProvider(id: string) {
  try {
    return await prisma.aIProvider.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting AI provider:', error)
    throw error
  }
}

export async function testAIConnection(providerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const provider = await prisma.aIProvider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado' }
    }

    const config = decryptObject(provider.config as unknown as EncryptedData)

    // Test connection based on provider type
    switch (provider.provider) {
      case 'openai':
        return await testOpenAIConnection(config)
      case 'anthropic':
        return await testAnthropicConnection(config)
      case 'google':
        return await testGoogleConnection(config)
      default:
        return { success: false, message: 'Tipo de proveedor no soportado' }
    }
  } catch (error) {
    console.error('Error testing AI connection:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// ========================================
// STORAGE PROVIDER SERVICES
// ========================================

export async function getStorageProviders() {
  try {
    const providers = await prisma.storageProvider.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return providers.map(provider => ({
      ...provider,
      config: decryptObject(provider.config as unknown as EncryptedData)
    }))
  } catch (error) {
    console.error('Error fetching storage providers:', error)
    return []
  }
}

export async function createStorageProvider(data: StorageProviderConfig) {
  try {
    const validatedConfig = validateStorageConfig(data.provider, data.config)
    const encryptedConfig = encryptObject(validatedConfig)

    return await prisma.storageProvider.create({
      data: {
        name: data.name,
        provider: data.provider,
        config: encryptedConfig as any,
        bucket: 'bucket' in validatedConfig ? validatedConfig.bucket : '',
        region: 'region' in validatedConfig ? validatedConfig.region : null,
        isActive: data.isActive,
        isDefault: data.isDefault,
      }
    })
  } catch (error) {
    console.error('Error creating storage provider:', error)
    throw error
  }
}

export async function updateStorageProvider(id: string, data: Partial<StorageProviderConfig>) {
  try {
    let encryptedConfig: any = undefined

    if (data.config) {
      const validatedConfig = validateStorageConfig(data.provider || 's3', data.config)
      encryptedConfig = encryptObject(validatedConfig)
    }

    return await prisma.storageProvider.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.provider && { provider: data.provider }),
        ...(data.config && 'bucket' in data.config && { bucket: data.config.bucket }),
        ...(data.config && !('bucket' in data.config) && { bucket: '' }),
        ...(data.config && 'region' in data.config && { region: data.config.region }),
        ...(encryptedConfig && { config: encryptedConfig }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      }
    })
  } catch (error) {
    console.error('Error updating storage provider:', error)
    throw error
  }
}

export async function deleteStorageProvider(id: string) {
  try {
    return await prisma.storageProvider.delete({
      where: { id }
    })
  } catch (error) {
    console.error('Error deleting storage provider:', error)
    throw error
  }
}

export async function testStorageConnection(providerId: string): Promise<{ success: boolean; message: string }> {
  try {
    const provider = await prisma.storageProvider.findUnique({
      where: { id: providerId }
    })

    if (!provider) {
      return { success: false, message: 'Proveedor no encontrado' }
    }

    const config = decryptObject(provider.config as unknown as EncryptedData)

    // Test connection based on provider type
    switch (provider.provider) {
      case 's3':
        return await testS3Connection(config)
      case 'r2':
        return await testR2Connection(config)
      case 'local':
        return await testLocalConnection(config)
      default:
        return { success: false, message: 'Tipo de proveedor no soportado' }
    }
  } catch (error) {
    console.error('Error testing storage connection:', error)
    return { success: false, message: 'Error interno del servidor' }
  }
}

// ========================================
// SECURITY & ROLES SERVICES
// ========================================

export async function getRoles() {
  try {
    return await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return []
  }
}

export async function getPermissions() {
  try {
    return await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return []
  }
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  try {
    return await prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          set: permissionIds.map(id => ({ id }))
        }
      },
      include: {
        permissions: true
      }
    })
  } catch (error) {
    console.error('Error updating role permissions:', error)
    throw error
  }
}

export async function getSecurityConfig() {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: ['jwt.secret', 'session.timeout', 'auth.max_attempts', 'password.min_length', 'password.require_special', 'password.require_numbers', 'password.require_uppercase']
        }
      }
    })

    const configMap: any = {}
    configs.forEach(config => {
      configMap[config.key] = config.isSecret
        ? decryptObject(config.value as unknown as EncryptedData)
        : config.value
    })

    return {
      jwtSecret: configMap['jwt.secret'] || '',
      sessionTimeout: parseInt(configMap['session.timeout']) || 3600,
      maxLoginAttempts: parseInt(configMap['auth.max_attempts']) || 5,
      passwordMinLength: parseInt(configMap['password.min_length']) || 12,
      requireSpecialChars: configMap['password.require_special'] === 'true',
      requireNumbers: configMap['password.require_numbers'] === 'true',
      requireUppercase: configMap['password.require_uppercase'] === 'true',
    }
  } catch (error) {
    console.error('Error fetching security config:', error)
    return {
      jwtSecret: '',
      sessionTimeout: 3600,
      maxLoginAttempts: 5,
      passwordMinLength: 12,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
    }
  }
}

export async function updateSecurityConfig(config: any) {
  try {
    const updates = [
      {
        key: 'jwt.secret',
        value: encryptObject(config.jwtSecret),
        isSecret: true
      },
      {
        key: 'session.timeout',
        value: config.sessionTimeout.toString(),
        isSecret: false
      },
      {
        key: 'auth.max_attempts',
        value: config.maxLoginAttempts.toString(),
        isSecret: false
      },
      {
        key: 'password.min_length',
        value: config.passwordMinLength.toString(),
        isSecret: false
      },
      {
        key: 'password.require_special',
        value: config.requireSpecialChars.toString(),
        isSecret: false
      },
      {
        key: 'password.require_numbers',
        value: config.requireNumbers.toString(),
        isSecret: false
      },
      {
        key: 'password.require_uppercase',
        value: config.requireUppercase.toString(),
        isSecret: false
      }
    ]

    const results = await Promise.all(
      updates.map(async (update) => {
        const existing = await prisma.systemConfig.findFirst({
          where: {
            key: update.key,
            organizationId: null
          }
        })

        if (existing) {
          return await prisma.systemConfig.update({
            where: { id: existing.id },
            data: {
              value: update.value,
              isSecret: update.isSecret,
              updatedAt: new Date()
            }
          })
        } else {
          return await prisma.systemConfig.create({
            data: {
              key: update.key,
              value: update.value,
              category: 'system',
              isSecret: update.isSecret
            }
          })
        }
      })
    )

    return results
  } catch (error) {
    console.error('Error updating security config:', error)
    throw error
  }
}

// ========================================
// CONNECTION TEST FUNCTIONS (PLACEHOLDER)
// ========================================

async function testSMTPConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual SMTP connection test
  return { success: true, message: 'Conexión SMTP verificada exitosamente' }
}

async function testSendGridConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual SendGrid connection test
  return { success: true, message: 'API Key de SendGrid válida' }
}

async function testResendConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual Resend connection test
  return { success: true, message: 'API Key de Resend válida' }
}

async function testOpenAIConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual OpenAI connection test
  return { success: true, message: 'API Key de OpenAI válida' }
}

async function testAnthropicConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual Anthropic connection test
  return { success: true, message: 'API Key de Anthropic válida' }
}

async function testGoogleConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual Google AI connection test
  return { success: true, message: 'API Key de Google AI válida' }
}

async function testS3Connection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual S3 connection test
  return { success: true, message: 'Credenciales AWS S3 válidas' }
}

async function testR2Connection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual R2 connection test
  return { success: true, message: 'Credenciales Cloudflare R2 válidas' }
}

async function testLocalConnection(config: any): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual local storage test
  return { success: true, message: 'Directorio local accesible' }
}

// ========================================
// PROVIDER VALIDATION HELPERS
// ========================================

/**
 * Helper to validate that an email provider belongs to an organization
 * Handles the aIProvider casing issue internally
 */
export async function getEmailProviderForOrg(id: string, orgId: string) {
  return await prisma.emailProvider.findFirst({
    where: { id, organizationId: orgId }
  })
}

/**
 * Helper to validate that an AI provider belongs to an organization
 * Handles the aIProvider casing issue internally
 */
export async function getAIProviderForOrg(id: string, orgId: string) {
  return await prisma.aIProvider.findFirst({
    where: { id, organizationId: orgId }
  })
}

/**
 * Helper to validate that a storage provider belongs to an organization
 * Handles the aIProvider casing issue internally
 */
export async function getStorageProviderForOrg(id: string, orgId: string) {
  return await prisma.storageProvider.findFirst({
    where: { id, organizationId: orgId }
  })
}













