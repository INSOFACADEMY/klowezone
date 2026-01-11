import { z } from 'zod'

/**
 * Safe Zod error handling for validation responses
 * Handles Zod v4 where .errors was replaced with .issues
 */
export function zodErrorDetails(err: unknown) {
  if (!(err instanceof z.ZodError)) return null

  return {
    issues: err.issues,             // canonical Zod v4
    flattened: err.flatten(),       // handy for UI error display
  }
}

/**
 * Standardized validation error response for API routes
 * Provides backward compatibility with 'details' field
 */
export function createValidationErrorResponse(err: unknown, statusCode = 400) {
  const details = zodErrorDetails(err)

  if (!details) {
    return {
      error: 'Validation failed',
      message: 'Unknown validation error'
    }
  }

  return {
    error: 'Validation failed',
    details: details.issues,          // backward compatible array
    issues: details.issues,           // explicit canonical field
    flattened: details.flattened      // optional but useful for UI
  }
}


