import { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function JobList({ jobs, onRefresh, onViewRule }) {
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    // Poll for job updates if there are pending/processing jobs
    const hasActiveJobs = jobs.some(
      (job) => job.status === 'pending' || job.status === 'processing'
    )

    if (hasActiveJobs && !polling) {
      setPolling(true)
      const interval = setInterval(() => {
        onRefresh()
      }, 3000) // Poll every 3 seconds

      return () => {
        clearInterval(interval)
        setPolling(false)
      }
    }
  }, [jobs, polling, onRefresh])

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg'
      case 'failed':
        return 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg'
      case 'processing':
        return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg animate-pulse'
      case 'pending':
        return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg'
      default:
        return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✅'
      case 'failed':
        return '❌'
      case 'processing':
        return '⏳'
      case 'pending':
        return '⏸️'
      default:
        return '📋'
    }
  }

  return (
    <div className="relative">
      <div className="bg-slate-900/80 backdrop-blur-xl border-2 border-blue-600/40 rounded-3xl transition-all duration-300 hover:border-blue-500/60 min-h-[400px]">
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30 bg-slate-900/60 backdrop-blur-sm rounded-t-3xl">
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
                <p className="text-sm text-gray-400 mt-0.5">Track your rule generation progress</p>
              </div>
              <div className="px-3 py-1.5 bg-blue-900/40 border border-blue-600/40 rounded-lg text-xs text-blue-300 font-semibold">
                {jobs.length}
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800/80 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 transition-all duration-200"
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
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-blue-700/30 rounded-xl p-4 hover:border-blue-500/60 hover:bg-slate-800/50 transition-all duration-200 bg-slate-800/30"
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
                          <span>Created: {new Date(job.created_at).toLocaleString()}</span>
                        </p>
                        {job.completed_at && (
                          <p className="text-xs text-gray-400 flex items-center space-x-2">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Completed: {new Date(job.completed_at).toLocaleString()}</span>
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
                        onClick={() => onViewRule(job.id)}
                        className="ml-4 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 text-sm font-medium shadow-lg shadow-blue-600/30 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View Rule</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JobList

