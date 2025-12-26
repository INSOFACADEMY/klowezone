import { NextRequest, NextResponse } from 'next/server'
import { getPendingJobs, processJob } from '@/lib/automation-services'

// POST /api/admin/jobs/process - Process pending jobs
export async function POST(request: NextRequest) {
  try {
    const jobs = await getPendingJobs(5) // Process up to 5 jobs at a time
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




