import { useState, useEffect, useMemo, useRef } from 'react'
import { getStatusColor, getStatusIcon } from '../utils/jobStatus'
import { formatDate } from '../utils/format'

function JobList({ jobs, pagination, onRefresh, onViewRule }) {
  const [completedJobIds, setCompletedJobIds] = useState(new Set())
  const [showToast, setShowToast] = useState(null)
  const previousJobsRef = useRef([])
  const intervalRef = useRef(null)

  const hasActiveJobs = useMemo(() => {
    return jobs.some(
      (job) => job.status === 'pending' || job.status === 'processing'
    )
  }, [jobs])

  // Detect newly completed jobs - optimized
  useEffect(() => {
    if (previousJobsRef.current.length === 0) {
      previousJobsRef.current = jobs
      return
    }
    
    // Create maps for faster lookup
    const previousJobMap = new Map(previousJobsRef.current.map(j => [j.id, j]))
    
    // Find newly completed jobs
    const newlyCompleted = jobs.filter(job => {
      const previousJob = previousJobMap.get(job.id)
      if (!previousJob) return false
      
      const wasActive = previousJob.status === 'pending' || previousJob.status === 'processing'
      const isCompleted = job.status === 'completed'
      return wasActive && isCompleted && !completedJobIds.has(job.id)
    })

    if (newlyCompleted.length > 0) {
      // Add to completed set
      setCompletedJobIds(prev => {
        const newSet = new Set(prev)
        newlyCompleted.forEach(job => newSet.add(job.id))
        return newSet
      })
      
      // Show notification
      newlyCompleted.forEach(job => {
        // Create browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Rule Generated!', {
            body: `Job #${job.id} has completed successfully. Click to view the rule.`,
            icon: '/favicon.ico',
            tag: `job-${job.id}`
          })
        }
        
        // Show toast notification as fallback
        setShowToast({
          message: `✅ Rule generated successfully for Job #${job.id}!`,
          jobId: job.id
        })
        
        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setShowToast(null)
        }, 5000)
      })
    }

    previousJobsRef.current = jobs
  }, [jobs, completedJobIds])

  // Polling mechanism
  useEffect(() => {
    if (hasActiveJobs) {
      // Start polling
      if (intervalRef.current === null) {
        intervalRef.current = setInterval(() => {
          onRefresh(pagination?.page || 1)
        }, 2000) // Poll every 2 seconds for faster updates
      }
    } else {
      // Stop polling when no active jobs
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasActiveJobs, onRefresh])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return (
    <div className="relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-600/90 backdrop-blur-sm border-2 border-green-400 rounded-xl p-4 shadow-2xl shadow-green-500/30 min-w-[300px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-100 text-sm">{showToast.message}</p>
                    <button
                    onClick={async () => {
                      try {
                        await onViewRule(showToast.jobId)
                        setShowToast(null)
                      } catch (error) {
                        // Error already handled in onViewRule
                        console.error('Error viewing rule:', error)
                      }
                    }}
                    className="text-xs text-green-200 hover:text-green-100 underline mt-1"
                  >
                    View Rule →
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowToast(null)}
                className="text-green-200 hover:text-green-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="backdrop-blur-sm border-2 border-blue-600/40 rounded-3xl transition-all duration-300 hover:border-blue-500/60 min-h-[400px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30 backdrop-blur-sm rounded-t-3xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400">Generation Jobs</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                  {hasActiveJobs ? '⏳ Processing...' : 'Track your rule generation progress'}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-blue-900/40 border border-blue-600/40 rounded-lg text-xs text-blue-300 font-semibold">
                {pagination?.total || jobs.length}
              </div>
            </div>
                <button
                  onClick={() => onRefresh(pagination?.page || 1)}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 transition-all duration-200"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium">Refresh</span>
                </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-blue-200 mb-2">No jobs yet</p>
              <p className="text-sm text-gray-400">Upload a file and generate a rule to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const isNewlyCompleted = completedJobIds.has(job.id) && job.status === 'completed'
                return (
                <div
                  key={job.id}
                  className={`border rounded-xl p-4 transition-all duration-300 ${
                    isNewlyCompleted
                      ? 'border-green-500/60 bg-green-900/20 shadow-lg shadow-green-500/20 animate-pulse'
                      : 'border-blue-700/30 hover:border-blue-500/60 hover:bg-slate-800/50 bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusColor(job.status)} flex items-center space-x-1.5`}>
                          <span>{getStatusIcon(job.status)}</span>
                          <span>{job.status.toUpperCase()}</span>
                        </span>
                        <span className="text-sm text-gray-300 font-medium">
                          Job #{job.id}
                        </span>
                        <span className="text-xs text-gray-500">•</span>
                        <span className="text-sm text-gray-400">
                          Log File #{job.log_file_id}
                        </span>
                      </div>
                      <div className="space-y-1.5 ml-1">
                        <p className="text-xs text-gray-400 flex items-center space-x-2">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Created: {formatDate(job.created_at)}</span>
                        </p>
                        {job.completed_at && (
                          <p className="text-xs text-gray-400 flex items-center space-x-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Completed: {formatDate(job.completed_at)}</span>
                          </p>
                        )}
                        {job.error_message && (
                          <div className="mt-2 p-2.5 bg-red-900/30 border-l-2 border-red-500 rounded-lg">
                            <p className="text-xs text-red-300 font-medium flex items-center space-x-2">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <span>{job.error_message}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {job.status === 'completed' && (
                      <button
                        onClick={() => {
                          setCompletedJobIds(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(job.id) // Remove from newly completed after viewing
                            return newSet
                          })
                          if (job.status === 'completed') {
                            onViewRule(job.id)
                          } else {
                            // Show helpful message
                            alert(`Job #${job.id} is still ${job.status}. Please wait for it to complete.`)
                          }
                        }}
                        className={`ml-4 flex items-center space-x-2 px-4 py-2 rounded-xl text-white text-sm font-medium shadow-lg transition-all duration-200 ${
                          isNewlyCompleted
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-600/30 animate-bounce'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-600/30'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{isNewlyCompleted ? '✨ View Rule' : 'View Rule'}</span>
                      </button>
                    )}
                    {job.status === 'processing' && (
                      <div className="ml-4 flex items-center space-x-2 px-4 py-2 text-blue-300">
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
          
          {/* Pagination Controls */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-blue-700/30">
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} jobs
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onRefresh(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  Previous
                </button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let pageNum
                    if (pagination.total_pages <= 5) {
                      pageNum = i + 1
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1
                    } else if (pagination.page >= pagination.total_pages - 2) {
                      pageNum = pagination.total_pages - 4 + i
                    } else {
                      pageNum = pagination.page - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => onRefresh(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'border border-blue-500/50 text-blue-200 hover:bg-blue-900/50'
                        }`}
                        style={pagination.page !== pageNum ? { backgroundColor: 'var(--bg-primary)' } : {}}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => onRefresh(pagination.page + 1)}
                  disabled={pagination.page >= pagination.total_pages}
                  className="px-4 py-2 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobList


