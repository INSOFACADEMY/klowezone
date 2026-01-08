import { z } from 'zod'
import { NextResponse } from 'next/server'

// Common validation schemas
export const stringSchema = (fieldName: string, options?: {
  min?: number
  max?: number
  required?: boolean
  pattern?: RegExp
}) => {
  let schema = z.string({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a string`
  })

  if (options?.required !== false) {
    schema = schema.min(1, `${fieldName} cannot be empty`)
  }

  if (options?.min) {
    schema = schema.min(options.min, `${fieldName} must be at least ${options.min} characters`)
  }

  if (options?.max) {
    schema = schema.max(options.max, `${fieldName} must be at most ${options.max} characters`)
  }

  if (options?.pattern) {
    schema = schema.regex(options.pattern, `${fieldName} format is invalid`)
  }

  return schema
}

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')

export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(2048, 'URL too long')

export const uuidSchema = z.string()
  .uuid('Invalid UUID format')

export const positiveIntegerSchema = z.number()
  .int('Must be an integer')
  .positive('Must be positive')

export const jsonSchema = z.string()
  .refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, 'Invalid JSON format')

// Sanitization functions
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''

  // Remove null bytes and other dangerous characters
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
    .trim()
    .substring(0, 10000) // Limit length
}

export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''

  // Basic HTML sanitization - remove dangerous tags
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .substring(0, 10000)
}

export function validateAndSanitizeInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: {
    sanitizeStrings?: boolean
    sanitizeHtml?: boolean
  }
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    // Pre-process data for sanitization
    let processedData = data

    if (options?.sanitizeStrings && typeof processedData === 'object' && processedData !== null) {
      processedData = sanitizeObjectStrings(processedData as Record<string, any>)
    }

    if (options?.sanitizeHtml && typeof processedData === 'object' && processedData !== null) {
      processedData = sanitizeObjectHtml(processedData as Record<string, any>)
    }

    const result = schema.parse(processedData)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }

    return { success: false, errors: ['Validation failed'] }
  }
}

function sanitizeObjectStrings(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObjectStrings(value)
    } else {
      result[key] = value
    }
  }

  return result
}

function sanitizeObjectHtml(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeHtml(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObjectHtml(value)
    } else {
      result[key] = value
    }
  }

  return result
}

// API-specific validation schemas
export const createSettingsSchema = z.object({
  key: stringSchema('key', { min: 1, max: 100, pattern: /^[a-zA-Z_][a-zA-Z0-9_]*$/ }),
  value: z.union([z.string(), z.number(), z.boolean()]).transform(val =>
    typeof val === 'string' ? val.substring(0, 1000) : val
  ),
  category: stringSchema('category', { min: 1, max: 50 }).optional(),
  isSecret: z.boolean().optional().default(false)
}).strict()

export const updateSettingsSchema = createSettingsSchema.partial().extend({
  key: stringSchema('key', { min: 1, max: 100 }) // key is required for updates
}).strict()

export const createAutomationSchema = z.object({
  name: stringSchema('name', { min: 1, max: 100 }),
  description: stringSchema('description', { max: 500 }).optional(),
  trigger: z.object({
    type: z.enum(['webhook', 'schedule', 'manual']),
    config: z.record(z.any())
  }),
  actions: z.array(z.object({
    type: z.string().min(1).max(50),
    config: z.record(z.any()),
    order: positiveIntegerSchema.optional()
  })).min(1).max(20),
  isActive: z.boolean().optional().default(true)
}).strict()

export const webhookPayloadSchema = z.object({
  eventType: stringSchema('eventType', { min: 1, max: 100 }),
  idempotencyKey: stringSchema('idempotencyKey', { max: 255 }).optional(),
  payload: z.record(z.any()),
  source: stringSchema('source', { max: 100 }).optional()
}).strict()

// Rate limiting aware validation
export async function validateApiRequest<T>(
  schema: z.ZodSchema<T>,
  request: Request,
  options?: {
    maxBodySize?: number
    sanitizeStrings?: boolean
    sanitizeHtml?: boolean
    rateLimit?: boolean
  }
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    // Check content length
    const contentLength = request.headers.get('content-length')
    const maxBodySize = options?.maxBodySize || 1024 * 1024 // 1MB default

    if (contentLength && parseInt(contentLength) > maxBodySize) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Request body too large' },
          { status: 413 }
        )
      }
    }

    // Parse JSON
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        )
      }
    }

    // Validate and sanitize
    const validation = validateAndSanitizeInput(schema, body, {
      sanitizeStrings: options?.sanitizeStrings ?? true,
      sanitizeHtml: options?.sanitizeHtml ?? false
    })

    if (!validation.success) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors
          },
          { status: 400 }
        )
      }
    }

    return { success: true, data: validation.data }
  } catch (error) {
    console.error('API validation error:', error)
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Internal server error during validation' },
        { status: 500 }
      )
    }
  }
}



