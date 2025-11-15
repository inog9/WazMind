import { useState, useEffect, useCallback, useRef, memo } from 'react'
import { detectPatterns } from '../utils/patternDetector'
import { apiClient } from '../utils/api'

function PatternDetector({ fileId, filePath, onPatternsDetected }) {
  const [patterns, setPatterns] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedPattern, setExpandedPattern] = useState(null)
  const loadedFileIdRef = useRef(null)

  const loadPatterns = useCallback(async () => {
    // Prevent duplicate loads for same file
    if (loadedFileIdRef.current === fileId && patterns) {
      return
    }
    setLoading(true)
    setError(null)
    
    try {
      // Fetch log sample from backend
      const sampleResponse = await apiClient.get(`/api/upload/${fileId}/sample`, {
        params: { max_lines: 100 }
      })

      const logLines = sampleResponse?.data?.lines || []
      
      if (logLines.length === 0) {
        setError('Could not read log file for pattern detection')
        setLoading(false)
        return
      }

      const detected = detectPatterns(logLines)
      setPatterns(detected)
      loadedFileIdRef.current = fileId
      
      // Notify parent component
      if (onPatternsDetected) {
        onPatternsDetected(detected)
      }
    } catch (err) {
      console.error('Error detecting patterns:', err)
      setError('Failed to detect patterns in log file')
    } finally {
      setLoading(false)
    }
  }, [fileId, onPatternsDetected])

  useEffect(() => {
    if (fileId && fileId !== loadedFileIdRef.current) {
      loadPatterns()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileId]) // Only depend on fileId to prevent unnecessary re-runs

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500/20 border-blue-500/40 text-blue-300',
      red: 'bg-red-500/20 border-red-500/40 text-red-300',
      green: 'bg-green-500/20 border-green-500/40 text-green-300',
      yellow: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300',
      purple: 'bg-purple-500/20 border-purple-500/40 text-purple-300',
      indigo: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300',
      cyan: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300',
      pink: 'bg-pink-500/20 border-pink-500/40 text-pink-300',
      orange: 'bg-orange-500/20 border-orange-500/40 text-orange-300',
      gray: 'bg-gray-500/20 border-gray-500/40 text-gray-300',
    }
    return colors[color] || colors.gray
  }

  if (loading) {
    return (
      <div className="bg-slate-800/40 border border-blue-600/40 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-300">Analyzing log patterns...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4">
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    )
  }

  if (!patterns || patterns.patterns.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-blue-600/40 rounded-xl p-4">
        <p className="text-gray-400 text-sm">No patterns detected in log file</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800/40 border border-blue-600/40 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center">
            <span className="text-xl">🔍</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-blue-400">Detected Patterns</h3>
            <p className="text-xs text-gray-400">{patterns.summary}</p>
          </div>
        </div>
        <button
          onClick={loadPatterns}
          className="px-3 py-1.5 bg-slate-700/50 border border-blue-600/40 rounded-lg text-blue-300 hover:bg-slate-700/80 text-xs font-medium transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Statistics */}
      {patterns.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Lines</p>
            <p className="text-lg font-bold text-blue-300">{patterns.statistics.totalLines}</p>
          </div>
          <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-3">
            <p className="text-xs text-gray-400">Avg Line Length</p>
            <p className="text-lg font-bold text-blue-300">{patterns.statistics.averageLineLength} chars</p>
          </div>
          {patterns.statistics.uniqueIPs && (
            <div className="bg-slate-900/50 border border-blue-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Unique IPs</p>
              <p className="text-lg font-bold text-blue-300">{patterns.statistics.uniqueIPs}</p>
            </div>
          )}
          {patterns.statistics.errorCount && (
            <div className="bg-slate-900/50 border border-red-700/30 rounded-lg p-3">
              <p className="text-xs text-gray-400">Error Keywords</p>
              <p className="text-lg font-bold text-red-300">{patterns.statistics.errorCount}</p>
            </div>
          )}
        </div>
      )}

      {/* Pattern Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {patterns.patterns.map((pattern, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              expandedPattern === index ? 'border-blue-500/60' : ''
            } ${getColorClasses(pattern.color)}`}
            onClick={() => setExpandedPattern(expandedPattern === index ? null : index)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <span className="text-2xl">{pattern.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-sm">{pattern.name}</h4>
                    {pattern.count > 0 && (
                      <span className="px-2 py-0.5 bg-slate-900/50 rounded text-xs font-bold">
                        {pattern.count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs mt-1 opacity-80">{pattern.description}</p>
                </div>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${expandedPattern === index ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {expandedPattern === index && (
              <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
                {pattern.samples && pattern.samples.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Samples:</p>
                    <div className="space-y-1">
                      {pattern.samples.map((sample, i) => (
                        <div
                          key={i}
                          className="bg-slate-900/50 rounded p-2 text-xs font-mono break-all"
                        >
                          {sample}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pattern.details && (
                  <div>
                    <p className="text-xs font-semibold mb-1">Details:</p>
                    <div className="space-y-1">
                      {Object.entries(pattern.details).map(([key, value]) => (
                        <div key={key} className="text-xs">
                          <span className="font-semibold">{key}:</span> {value}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default PatternDetector

