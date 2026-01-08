import {
  validateAndSanitizeInput,
  sanitizeString,
  sanitizeHtml,
  createSettingsSchema,
  webhookPayloadSchema,
  createAutomationSchema
} from '../input-validation'

describe('Input Validation', () => {
  describe('String Sanitization', () => {
    it('should remove null bytes and control characters', () => {
      const input = 'test\x00string\x01with\x1Fcontrol'
      const result = sanitizeString(input)
      expect(result).toBe('teststringwithcontrol')
    })

    it('should trim whitespace', () => {
      const input = '  test string  '
      const result = sanitizeString(input)
      expect(result).toBe('test string')
    })

    it('should limit length', () => {
      const input = 'a'.repeat(20000)
      const result = sanitizeString(input)
      expect(result.length).toBeLessThanOrEqual(10000)
    })

    it('should handle null/undefined input', () => {
      expect(sanitizeString(null as any)).toBe('')
      expect(sanitizeString(undefined as any)).toBe('')
    })
  })

  describe('HTML Sanitization', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('Hello')
    })

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>Safe'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('<iframe>')
      expect(result).toContain('Safe')
    })

    it('should remove javascript URLs', () => {
      const input = '<a href="javascript:alert(1)">Click</a>'
      const result = sanitizeHtml(input)
      expect(result).not.toContain('javascript:')
    })
  })

  describe('Settings Schema Validation', () => {
    it('should validate correct settings input', () => {
      const input = {
        key: 'test_setting',
        value: 'test_value',
        category: 'test',
        isSecret: false
      }

      const result = validateAndSanitizeInput(createSettingsSchema, input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.key).toBe('test_setting')
        expect(result.data.value).toBe('test_value')
      }
    })

    it('should reject invalid key format', () => {
      const input = {
        key: 'invalid-key!',
        value: 'test_value'
      }

      const result = validateAndSanitizeInput(createSettingsSchema, input)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const input = {
        key: 'test_setting'
        // missing value
      }

      const result = validateAndSanitizeInput(createSettingsSchema, input)
      expect(result.success).toBe(false)
    })

    it('should sanitize string inputs', () => {
      const input = {
        key: 'test_setting\x00',
        value: 'test\x01value',
        category: 'test\x1Fcategory'
      }

      const result = validateAndSanitizeInput(createSettingsSchema, input, {
        sanitizeStrings: true
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.key).toBe('test_setting')
        expect(result.data.value).toBe('testvalue')
        expect(result.data.category).toBe('testcategory')
      }
    })
  })

  describe('Webhook Payload Schema Validation', () => {
    it('should validate correct webhook payload', () => {
      const input = {
        eventType: 'user.registered',
        payload: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com'
        },
        source: 'test_app'
      }

      const result = validateAndSanitizeInput(webhookPayloadSchema, input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const input = {
        eventType: 'user.registered',
        payload: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'invalid-email'
        }
      }

      const result = validateAndSanitizeInput(webhookPayloadSchema, input)
      expect(result.success).toBe(false)
    })

    it('should accept optional idempotency key', () => {
      const input = {
        eventType: 'user.registered',
        idempotencyKey: 'unique-key-123',
        payload: {
          userId: '550e8400-e29b-41d4-a716-446655440000',
          email: 'test@example.com'
        }
      }

      const result = validateAndSanitizeInput(webhookPayloadSchema, input)
      expect(result.success).toBe(true)
    })
  })

  describe('Automation Schema Validation', () => {
    it('should validate correct automation input', () => {
      const input = {
        name: 'Test Automation',
        trigger: {
          type: 'webhook',
          config: {}
        },
        actions: [
          {
            type: 'send_email',
            config: { template: 'welcome' }
          }
        ]
      }

      const result = validateAndSanitizeInput(createAutomationSchema, input)
      expect(result.success).toBe(true)
    })

    it('should reject automation without actions', () => {
      const input = {
        name: 'Test Automation',
        trigger: {
          type: 'webhook',
          config: {}
        },
        actions: [] // empty array
      }

      const result = validateAndSanitizeInput(createAutomationSchema, input)
      expect(result.success).toBe(false)
    })

    it('should limit actions to maximum', () => {
      const input = {
        name: 'Test Automation',
        trigger: {
          type: 'webhook',
          config: {}
        },
        actions: Array(25).fill({
          type: 'send_email',
          config: { template: 'test' }
        }) // 25 actions, exceeds limit of 20
      }

      const result = validateAndSanitizeInput(createAutomationSchema, input)
      expect(result.success).toBe(false)
    })
  })
})



