'use client'

import { useJobProcessor } from '@/hooks/use-job-processor'

export function JobProcessor() {
  // This component runs in the background and processes automation jobs
  // It doesn't render anything visible to the user
  useJobProcessor(30000) // Process jobs every 30 seconds

  return null
}




