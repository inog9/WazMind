import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../utils/api'
import { formatDate } from '../utils/format'

function RulesList({ rules, pagination, onViewRule, onRefresh }) {
  const [selectedRules, setSelectedRules] = useState(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleToggleSelect = useCallback((ruleId) => {
    setSelectedRules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId)
      } else {
        newSet.add(ruleId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedRules.size === rules.length && rules.length > 0) {
      setSelectedRules(new Set())
    } else {
      setSelectedRules(new Set(rules.map(r => r.id)))
    }
  }, [selectedRules.size, rules]) // Only depend on size and rules array reference

  const handleBulkDelete = useCallback(async () => {
    if (selectedRules.size === 0) {
      toast.error('Please select rules to delete')
      return
    }

    setDeleting(true)
    try {
      const response = await apiClient.post('/api/rules/bulk-delete', { 
        rule_ids: Array.from(selectedRules) 
      })
      toast.success(`Deleted ${response.data.deleted_count} rule(s) successfully`)
      setSelectedRules(new Set())
      setIsSelectMode(false)
      if (onRefresh) onRefresh(pagination.page)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting rules')
    } finally {
      setDeleting(false)
    }
  }, [selectedRules, onRefresh])

  const handleBulkExport = useCallback(async () => {
    if (selectedRules.size === 0) {
      toast.error('Please select rules to export')
      return
    }

    setExporting(true)
    try {
      const ruleIds = Array.from(selectedRules)
      const response = await apiClient.get('/api/rules/bulk-export', {
        params: { rule_ids: ruleIds },
        responseType: 'blob'
      })
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `wazuh_rules_${new Date().toISOString().split('T')[0]}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success(`Exported ${ruleIds.length} rule(s) successfully`)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error exporting rules')
    } finally {
      setExporting(false)
    }
  }, [selectedRules])

  if (!rules || rules.length === 0) {
    return null
  }

  return (
    <div className="backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-blue-700/30" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-xl">📋</span>
          </div>
          <h2 className="text-2xl font-bold text-blue-400">Generated Rules</h2>
          <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold border border-blue-600/50">
            {pagination?.total || rules.length}
          </span>
          {isSelectMode && selectedRules.size > 0 && (
            <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm font-semibold border border-green-600/50">
              {selectedRules.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {isSelectMode ? (
            <>
              <button
                onClick={handleSelectAll}
                className="px-3 py-1.5 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                {selectedRules.size === rules.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleBulkExport}
                disabled={selectedRules.size === 0 || exporting}
                className="px-3 py-1.5 border border-green-500/50 text-green-200 hover:bg-green-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                {exporting ? 'Exporting...' : `Export (${selectedRules.size})`}
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedRules.size === 0 || deleting}
                className="px-3 py-1.5 border border-red-500/50 text-red-200 hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                {deleting ? 'Deleting...' : `Delete (${selectedRules.size})`}
              </button>
              <button
                onClick={() => {
                  setIsSelectMode(false)
                  setSelectedRules(new Set())
                }}
                className="px-3 py-1.5 border border-gray-500/50 text-gray-200 hover:bg-gray-900/50 rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSelectMode(true)}
              className="px-3 py-1.5 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              Select Rules
            </button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 border-2 rounded-xl transition-all duration-200 ${
              isSelectMode && selectedRules.has(rule.id) 
                ? 'ring-2 ring-blue-500 bg-blue-900/30 border-blue-500' 
                : 'border-blue-700/30 hover:border-blue-500/60'
            }`}
            style={{ backgroundColor: 'var(--bg-primary)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                {isSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedRules.has(rule.id)}
                    onChange={() => handleToggleSelect(rule.id)}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                )}
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Rule #{rule.id}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Job #{rule.job_id}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Updated: {formatDate(rule.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
              {!isSelectMode && (
                <button
                  onClick={() => onViewRule(rule.job_id)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 text-sm font-semibold transition-all"
                >
                  View Rule
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Controls */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-blue-700/30">
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} rules
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
  )
}

export default RulesList

