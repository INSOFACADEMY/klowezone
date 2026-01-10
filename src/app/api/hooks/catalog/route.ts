import { NextRequest, NextResponse } from 'next/server'
import {
  EVENT_CATALOG,
  getSupportedEventTypes,
  getEventCategories,
  getEventsByCategory,
  getEventDefinition
} from '@/lib/events/catalog'

// Force dynamic rendering for runtime API routes
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/hooks/catalog - Get webhook events catalog
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const eventType = searchParams.get('eventType')

    if (eventType) {
      // Get specific event definition
      const definition = getEventDefinition(eventType)
      if (!definition) {
        return NextResponse.json(
          { error: 'Event type not found', code: 'EVENT_TYPE_NOT_FOUND' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: definition
      })
    }

    if (category) {
      // Get events by category
      const events = getEventsByCategory(category)
      return NextResponse.json({
        success: true,
        data: {
          category,
          events,
          count: events.length
        }
      })
    }

    // Get full catalog
    const categories = getEventCategories()
    const supportedTypes = getSupportedEventTypes()

    const catalog = categories.map(cat => ({
      category: cat,
      events: getEventsByCategory(cat).map(event => ({
        name: event.name,
        description: event.description,
        example: event.example
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        categories,
        supportedEventTypes: supportedTypes,
        catalog,
        totalEventTypes: supportedTypes.length
      }
    })

  } catch (error) {
    console.error('Webhook catalog error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}







