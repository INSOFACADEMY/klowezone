import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Simple database test
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      database: 'connected',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Database connection failed:', error.message)

    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      database: 'disconnected',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
