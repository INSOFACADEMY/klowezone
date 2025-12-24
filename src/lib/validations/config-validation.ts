import { z } from 'zod'

// ========================================
// CONFIGURATION VALIDATION SCHEMAS
// ========================================

// Email Provider Validation
export const smtpConfigSchema = z.object({
  host: z.string().min(1, 'Host es requerido'),
  port: z.number().min(1).max(65535),
  user: z.string().email('Email inválido'),
  pass: z.string().min(1, 'Contraseña es requerida'),
  encryption: z.enum(['none', 'ssl', 'tls']).default('tls'),
})

export const sendgridConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key es requerida'),
  fromEmail: z.string().email('Email remitente inválido'),
  fromName: z.string().min(1, 'Nombre remitente es requerido'),
})

export const resendConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key es requerida'),
  fromEmail: z.string().email('Email remitente inválido'),
  fromName: z.string().min(1, 'Nombre remitente es requerido'),
})

export const emailProviderSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  provider: z.enum(['smtp', 'sendgrid', 'resend']),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  config: z.union([smtpConfigSchema, sendgridConfigSchema, resendConfigSchema]),
})

// AI Provider Validation
export const openaiConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key es requerida'),
  model: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4o']).default('gpt-4'),
  maxTokens: z.number().min(1).max(32768).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
})

export const anthropicConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key es requerida'),
  model: z.enum(['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']).default('claude-3-sonnet'),
  maxTokens: z.number().min(1).max(4096).default(4096),
  temperature: z.number().min(0).max(1).default(0.7),
})

export const googleConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key es requerida'),
  model: z.enum(['gemini-pro', 'gemini-pro-vision']).default('gemini-pro'),
  maxTokens: z.number().min(1).max(8192).default(4096),
  temperature: z.number().min(0).max(2).default(0.7),
})

export const aiProviderSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  provider: z.enum(['openai', 'anthropic', 'google']),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  rateLimit: z.number().min(1).max(1000).default(100),
  monthlyLimit: z.number().min(100).max(1000000).default(10000),
  config: z.union([openaiConfigSchema, anthropicConfigSchema, googleConfigSchema]),
})

// Storage Provider Validation
export const s3ConfigSchema = z.object({
  accessKeyId: z.string().min(1, 'Access Key ID es requerido'),
  secretAccessKey: z.string().min(1, 'Secret Access Key es requerido'),
  region: z.string().min(1, 'Región es requerida'),
  bucket: z.string().min(1, 'Bucket es requerido'),
  endpoint: z.string().url().optional(),
})

export const r2ConfigSchema = z.object({
  accessKeyId: z.string().min(1, 'Access Key ID es requerido'),
  secretAccessKey: z.string().min(1, 'Secret Access Key es requerido'),
  accountId: z.string().min(1, 'Account ID es requerido'),
  bucket: z.string().min(1, 'Bucket es requerido'),
})

export const localConfigSchema = z.object({
  uploadPath: z.string().min(1, 'Ruta de subida es requerida'),
  maxFileSize: z.number().min(1024).max(104857600).default(10485760), // 10MB default
})

export const storageProviderSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  provider: z.enum(['s3', 'r2', 'local']),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  config: z.union([s3ConfigSchema, r2ConfigSchema, localConfigSchema]),
})

// Security Configuration
export const securityConfigSchema = z.object({
  jwtSecret: z.string().min(32, 'JWT Secret debe tener al menos 32 caracteres'),
  sessionTimeout: z.number().min(300).max(86400).default(3600), // 1 hour default
  maxLoginAttempts: z.number().min(3).max(10).default(5),
  passwordMinLength: z.number().min(8).max(128).default(12),
  requireSpecialChars: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireUppercase: z.boolean().default(true),
})

// Role Configuration
export const roleConfigSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().min(1, 'Descripción es requerida'),
  permissions: z.array(z.string()).min(1, 'Debe tener al menos un permiso'),
  isActive: z.boolean().default(true),
})

// ========================================
// TYPE EXPORTS
// ========================================

export type SMTPConfig = z.infer<typeof smtpConfigSchema>
export type SendGridConfig = z.infer<typeof sendgridConfigSchema>
export type ResendConfig = z.infer<typeof resendConfigSchema>
export type EmailProviderConfig = z.infer<typeof emailProviderSchema>

export type OpenAIConfig = z.infer<typeof openaiConfigSchema>
export type AnthropicConfig = z.infer<typeof anthropicConfigSchema>
export type GoogleConfig = z.infer<typeof googleConfigSchema>
export type AIProviderConfig = z.infer<typeof aiProviderSchema>

export type S3Config = z.infer<typeof s3ConfigSchema>
export type R2Config = z.infer<typeof r2ConfigSchema>
export type LocalConfig = z.infer<typeof localConfigSchema>
export type StorageProviderConfig = z.infer<typeof storageProviderSchema>

export type SecurityConfig = z.infer<typeof securityConfigSchema>
export type RoleConfig = z.infer<typeof roleConfigSchema>

// ========================================
// VALIDATION HELPERS
// ========================================

export const validateEmailConfig = (provider: string, config: any) => {
  switch (provider) {
    case 'smtp':
      return smtpConfigSchema.parse(config)
    case 'sendgrid':
      return sendgridConfigSchema.parse(config)
    case 'resend':
      return resendConfigSchema.parse(config)
    default:
      throw new Error(`Proveedor de email no soportado: ${provider}`)
  }
}

export const validateAIConfig = (provider: string, config: any) => {
  switch (provider) {
    case 'openai':
      return openaiConfigSchema.parse(config)
    case 'anthropic':
      return anthropicConfigSchema.parse(config)
    case 'google':
      return googleConfigSchema.parse(config)
    default:
      throw new Error(`Proveedor de IA no soportado: ${provider}`)
  }
}

export const validateStorageConfig = (provider: string, config: any) => {
  switch (provider) {
    case 's3':
      return s3ConfigSchema.parse(config)
    case 'r2':
      return r2ConfigSchema.parse(config)
    case 'local':
      return localConfigSchema.parse(config)
    default:
      throw new Error(`Proveedor de almacenamiento no soportado: ${provider}`)
  }
}
