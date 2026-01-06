/**
 * WEBHOOK EVENTS CATALOG
 *
 * Catalog of supported event types with descriptions, schemas, and validation
 */

import { z } from 'zod'

// ========================================
// EVENT TYPE DEFINITIONS
// ========================================

export interface EventTypeDefinition {
  name: string
  description: string
  category: string
  schema: z.ZodSchema
  example: any
}

// User Events
const userRegisteredEvent = {
  name: 'user.registered',
  description: 'User account created and registered',
  category: 'User Management',
  schema: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    registrationMethod: z.enum(['email', 'google', 'github', 'linkedin']).optional(),
    metadata: z.object({
      ipAddress: z.string().optional(),
      userAgent: z.string().optional(),
      referralSource: z.string().optional()
    }).optional()
  }),
  example: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    registrationMethod: 'email',
    metadata: {
      ipAddress: '192.168.1.1',
      referralSource: 'google'
    }
  }
}

const userLoginEvent = {
  name: 'user.login',
  description: 'User successfully logged in',
  category: 'Authentication',
  schema: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    loginMethod: z.enum(['password', 'google', 'github', 'linkedin']),
    ipAddress: z.string(),
    userAgent: z.string().optional(),
    sessionId: z.string().optional()
  }),
  example: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john.doe@example.com',
    loginMethod: 'password',
    ipAddress: '192.168.1.1',
    sessionId: 'sess_abc123'
  }
}

const userProfileUpdatedEvent = {
  name: 'user.profile.updated',
  description: 'User profile information updated',
  category: 'User Management',
  schema: z.object({
    userId: z.string().uuid(),
    email: z.string().email(),
    changes: z.array(z.object({
      field: z.string(),
      oldValue: z.any().optional(),
      newValue: z.any()
    })),
    updatedBy: z.string().uuid() // User who made the change (could be self or admin)
  }),
  example: {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'john.doe@example.com',
    changes: [
      { field: 'firstName', oldValue: 'John', newValue: 'Johnny' },
      { field: 'phone', newValue: '+1234567890' }
    ],
    updatedBy: '550e8400-e29b-41d4-a716-446655440000'
  }
}

// Project Events
const projectCreatedEvent = {
  name: 'project.created',
  description: 'New project created',
  category: 'Project Management',
  schema: z.object({
    projectId: z.string().uuid(),
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    ownerId: z.string().uuid(),
    teamSize: z.number().int().min(1).optional(),
    budget: z.number().positive().optional(),
    deadline: z.string().datetime().optional(),
    tags: z.array(z.string()).optional()
  }),
  example: {
    projectId: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Website Redesign',
    description: 'Complete redesign of company website',
    ownerId: '550e8400-e29b-41d4-a716-446655440000',
    teamSize: 5,
    budget: 50000,
    deadline: '2024-12-31T23:59:59Z',
    tags: ['web', 'design', 'frontend']
  }
}

const projectStatusChangedEvent = {
  name: 'project.status.changed',
  description: 'Project status updated',
  category: 'Project Management',
  schema: z.object({
    projectId: z.string().uuid(),
    oldStatus: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
    newStatus: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
    changedBy: z.string().uuid(),
    reason: z.string().optional(),
    completionPercentage: z.number().min(0).max(100).optional()
  }),
  example: {
    projectId: '550e8400-e29b-41d4-a716-446655440001',
    oldStatus: 'planning',
    newStatus: 'active',
    changedBy: '550e8400-e29b-41d4-a716-446655440000',
    completionPercentage: 0
  }
}

// Lead/Sales Events
const leadCapturedEvent = {
  name: 'lead.captured',
  description: 'New lead captured from marketing channel',
  category: 'Sales & Marketing',
  schema: z.object({
    leadId: z.string().uuid(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    source: z.enum(['website', 'social', 'email', 'paid_ads', 'referral', 'direct']),
    campaignId: z.string().optional(),
    campaignName: z.string().optional(),
    landingPage: z.string().url().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  example: {
    leadId: '550e8400-e29b-41d4-a716-446655440002',
    email: 'jane.smith@company.com',
    firstName: 'Jane',
    lastName: 'Smith',
    company: 'Tech Corp',
    source: 'paid_ads',
    campaignId: 'camp_123',
    campaignName: 'Q4 Digital Campaign',
    landingPage: 'https://example.com/landing'
  }
}

const leadQualifiedEvent = {
  name: 'lead.qualified',
  description: 'Lead qualified and ready for sales follow-up',
  category: 'Sales & Marketing',
  schema: z.object({
    leadId: z.string().uuid(),
    qualifiedBy: z.string().uuid(),
    qualificationScore: z.number().min(0).max(100),
    qualificationReason: z.string(),
    nextAction: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent'])
  }),
  example: {
    leadId: '550e8400-e29b-41d4-a716-446655440002',
    qualifiedBy: '550e8400-e29b-41d4-a716-446655440000',
    qualificationScore: 85,
    qualificationReason: 'High-value enterprise lead with immediate needs',
    nextAction: 'Schedule discovery call',
    priority: 'high'
  }
}

// Demo/Test Events (for development)
const demoEvent = {
  name: 'demo.event',
  description: 'Demo event for testing webhook ingestion',
  category: 'Development',
  schema: z.object({
    userId: z.string(),
    action: z.string(),
    timestamp: z.string().datetime().optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  example: {
    userId: 'user123',
    action: 'button_clicked',
    timestamp: '2024-01-15T10:30:00Z',
    metadata: {
      source: 'web_app',
      version: '1.0'
    }
  }
}

// ========================================
// EVENT CATALOG
// ========================================

// Event Catalog
const eventCatalog: Record<string, EventTypeDefinition> = {
  'user.registered': userRegisteredEvent,
  'user.login': userLoginEvent,
  'user.profile.updated': userProfileUpdatedEvent,
  'project.created': projectCreatedEvent,
  'project.status.changed': projectStatusChangedEvent,
  'lead.captured': leadCapturedEvent,
  'lead.qualified': leadQualifiedEvent,
  'demo.event': demoEvent,
}

export { eventCatalog as EVENT_CATALOG };

// ========================================
// VALIDATION FUNCTIONS
// ========================================

export type ValidationResult =
  | {
      success: true
      validated: true
      data: any
    }
  | {
      success: false
      validated: false
      error: string
      unvalidated: true
    }
  | {
      success: true
      validated: false
      unvalidated: true
      data: any
    }

/**
 * Validate an event payload against its schema
 */
export function validateEvent(eventType: string, payload: any): ValidationResult {
  const eventDefinition = eventCatalog[eventType]

  if (!eventDefinition) {
    // Event type not in catalog - allow but mark as unvalidated
    return {
      success: true,
      validated: false,
      unvalidated: true,
      data: payload
    }
  }

  try {
    const validatedData = eventDefinition.schema.parse(payload)
    return {
      success: true,
      validated: true,
      data: validatedData
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        validated: false,
        error: `Validation failed: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        unvalidated: true
      }
    }

    return {
      success: false,
      validated: false,
      error: `Validation error: ${error}`,
      unvalidated: true
    }
  }
}

/**
 * Get all supported event types
 */
export function getSupportedEventTypes(): string[] {
  return Object.keys(eventCatalog)
}

/**
 * Get event type definition
 */
export function getEventDefinition(eventType: string): EventTypeDefinition | null {
  return eventCatalog[eventType] || null
}

/**
 * Get events by category
 */
export function getEventsByCategory(category: string): EventTypeDefinition[] {
  return Object.values(eventCatalog).filter(event => event.category === category)
}

/**
 * Get all categories
 */
export function getEventCategories(): string[] {
  const categories = new Set(Object.values(eventCatalog).map(event => event.category))
  return Array.from(categories).sort()
}

/**
 * Check if event type is supported (has schema)
 */
export function isEventTypeSupported(eventType: string): boolean {
  return eventType in eventCatalog
}
