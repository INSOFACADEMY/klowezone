import { useEffect, useRef } from 'react'

export function useJobProcessor(interval: number = 30000) { // 30 seconds default
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef(false)

  const processJobs = async () => {
    if (isProcessingRef.current) return

    try {
      isProcessingRef.current = true

      // Get pending jobs from API
      const response = await fetch('/api/admin/jobs/process', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        if (result.processed > 0) {
          console.log(`Processed ${result.processed} automation jobs`)
        }
      } else {
        console.error('Error processing jobs:', response.statusText)
      }
    } catch (error) {
      console.error('Error in job processing cycle:', error)
    } finally {
      isProcessingRef.current = false
    }
  }

  useEffect(() => {
    // Start processing immediately
    processJobs()

    // Set up interval for continuous processing
    intervalRef.current = setInterval(processJobs, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval])

  // Manual trigger function
  const triggerProcessing = async () => {
    if (isProcessingRef.current) return
    await processJobs()
  }

  return {
    triggerProcessing,
    isProcessing: isProcessingRef.current
  }
}


