import { NextRequest, NextResponse } from 'next/server'
import { getPendingJobs, processJob } from '@/lib/automation-services'
import { adminAuthMiddleware, hasAnyPermission } from '@/middleware/admin-auth'
import { getOrgContext, TenantError } from '@/lib/tenant/getOrgContext'

// POST /api/admin/jobs/process - Process pending jobs
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    const authResult = await adminAuthMiddleware(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const user = (authResult as any).user

    // Check permissions: need process access to jobs
    if (!hasAnyPermission(user, ['jobs:process'])) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get organization context (required for multi-tenant)
    let orgContext
    try {
      orgContext = await getOrgContext(request)
    } catch (error) {
      if (error instanceof TenantError) {
        return NextResponse.json(
          { error: `Organization context required: ${error.message}` },
          { status: 400 }
        )
      }
      throw error
    }

    const jobs = await getPendingJobs(orgContext.orgId, 5) // Process up to 5 jobs at a time for the organization
    const results = []

    for (const job of jobs) {
      try {
        const result = await processJob(job.id)
        results.push({
          jobId: job.id,
          success: true,
          result
        })
      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        results.push({
          jobId: job.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('Error processing jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









