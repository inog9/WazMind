import { useState, useCallback, useMemo, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../utils/api'

function RulesScanner() {
  const [scanning, setScanning] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [rules, setRules] = useState([])
  const [statistics, setStatistics] = useState({ total: 0, custom: 0, default: 0, overwritten: 0 })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRule, setSelectedRule] = useState(null)
  const [showXmlViewer, setShowXmlViewer] = useState(false)
  const [conflicts, setConflicts] = useState(null)
  const [loadingConflicts, setLoadingConflicts] = useState(false)
  const [showConflicts, setShowConflicts] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 })
  const itemsPerPage = 20

  // Paths configuration
  const defaultRulesPath = '/var/ossec/ruleset/rules'
  const customRulesPath = '/var/ossec/etc/rules'

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/wazuh/rules/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }, [])

  // Fetch rules
  const fetchRules = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true)
      const params = {
        page,
        limit,
        ...(sourceFilter !== 'all' && { source: sourceFilter }),
        ...(levelFilter !== 'all' && { level: parseInt(levelFilter) }),
        ...(searchQuery && { search: searchQuery })
      }
      
      const response = await apiClient.get('/api/wazuh/rules', { params })
      setRules(response.data.items)
      setPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        total_pages: response.data.total_pages
      })
    } catch (error) {
      console.error('Error fetching rules:', error)
      toast.error('Failed to load rules')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, levelFilter, searchQuery])

  // Initial load
  useEffect(() => {
    fetchStatistics()
    fetchRules(1, itemsPerPage)
  }, [fetchStatistics])

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1)
    fetchRules(1, itemsPerPage)
  }, [sourceFilter, levelFilter, searchQuery, fetchRules])

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchStatistics()
      fetchRules(currentPage, itemsPerPage)
      if (showConflicts) {
        fetchConflicts()
      }
    }, 60000) // Refresh every minute
    
    return () => clearInterval(interval)
  }, [autoRefresh, currentPage, fetchStatistics, fetchRules, showConflicts])

  // Fetch conflicts
  const fetchConflicts = useCallback(async () => {
    setLoadingConflicts(true)
    try {
      const response = await apiClient.get('/api/wazuh/rules/conflicts')
      setConflicts(response.data)
    } catch (error) {
      console.error('Error fetching conflicts:', error)
      toast.error('Failed to load conflicts')
    } finally {
      setLoadingConflicts(false)
    }
  }, [])

  // Load conflicts when section is opened
  useEffect(() => {
    if (showConflicts && !conflicts) {
      fetchConflicts()
    }
  }, [showConflicts, conflicts, fetchConflicts])

  // Get status from rule
  const getRuleStatus = (rule) => {
    if (rule.is_overwritten === 1) return 'overwritten'
    return 'active'
  }

  // Get dependencies count
  const getDependencies = (rule) => {
    const parents = rule.parent_rule_ids ? rule.parent_rule_ids.split(',').filter(Boolean).length : 0
    const children = rule.child_rule_ids ? rule.child_rule_ids.split(',').filter(Boolean).length : 0
    return { parents, children }
  }

  // Filter rules by status (client-side filter for status only, others are server-side)
  const filteredRules = useMemo(() => {
    if (statusFilter === 'all') return rules
    
    return rules.filter(rule => {
      const status = getRuleStatus(rule)
      return status === statusFilter
    })
  }, [rules, statusFilter])

  // Paginated rules (already paginated from server, but apply status filter)
  const paginatedRules = useMemo(() => {
    if (statusFilter === 'all') return rules
    return filteredRules
  }, [rules, filteredRules, statusFilter])

  const totalPages = statusFilter === 'all' ? pagination.total_pages : Math.ceil(filteredRules.length / itemsPerPage)

  const handleScan = useCallback(async () => {
    setScanning(true)
    try {
      const response = await apiClient.post('/api/wazuh/rules/scan')
      toast.success(`Rules scanned successfully: ${response.data.rules_count} rules found`)
      // Refresh data
      await fetchStatistics()
      await fetchRules(1, itemsPerPage)
    } catch (error) {
      console.error('Error scanning rules:', error)
      toast.error(error.response?.data?.detail || 'Failed to scan rules')
    } finally {
      setScanning(false)
    }
  }, [fetchStatistics, fetchRules])

  const handleViewRule = useCallback(async (rule) => {
    setSelectedRule(rule)
    setShowXmlViewer(false)
    
    // Fetch full rule with XML if not already loaded
    if (!rule.rule_xml) {
      try {
        const response = await apiClient.get(`/api/wazuh/rules/${rule.rule_id}`)
        setSelectedRule(response.data)
      } catch (error) {
        console.error('Error fetching full rule:', error)
        toast.error('Failed to load full rule details')
      }
    }
  }, [])

  const getLevelColor = (level) => {
    if (level <= 5) return 'text-gray-400'
    if (level <= 10) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/30">Active</span>
      case 'overwritten':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">Overwritten</span>
      case 'conflict':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Conflict</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">{status}</span>
    }
  }

  const getSourceBadge = (source) => {
    if (source === 'custom') {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Custom</span>
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30">Default</span>
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-blue-100 mb-2">🔍 Server Rules Scanner</h2>
            <p className="text-sm text-blue-200/60">Scan and manage Wazuh rules from your server</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm text-blue-200/80">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-blue-500/50"
              />
              <span>Auto-refresh</span>
            </label>
            <button
              onClick={handleScan}
              disabled={scanning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {scanning ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Scan Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Paths Display */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 rounded-xl border border-blue-700/20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-200">Default Rules</span>
            </div>
            <p className="text-xs text-blue-200/60 font-mono mb-2">{defaultRulesPath}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-400">✅</span>
              <span className="text-xs text-blue-200/80">Scanned: {statistics.default} rules (2 min ago)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-700/20" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-blue-200">Custom Rules</span>
            </div>
            <p className="text-xs text-blue-200/60 font-mono mb-2">{customRulesPath}</p>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-green-400">✅</span>
              <span className="text-xs text-blue-200/80">Scanned: {statistics.custom} rules (2 min ago)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Warning Banner */}
      {statistics.overwritten > 0 && (
        <div className="mb-6 backdrop-blur-sm border border-yellow-700/50 rounded-2xl p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <div className="text-yellow-200 font-semibold">
                  {statistics.overwritten} overwritten rule(s) detected
                </div>
                <div className="text-yellow-200/60 text-sm">
                  Some rules may have conflicts. Review conflicts to ensure proper rule hierarchy.
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setShowConflicts(true)
                if (!conflicts) {
                  fetchConflicts()
                }
              }}
              className="px-4 py-2 rounded-lg bg-yellow-600/20 border border-yellow-500/50 text-yellow-200 hover:bg-yellow-600/30 transition-colors"
            >
              View Conflicts
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-6 rounded-xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent mb-2">
            {statistics.total.toLocaleString()}
          </div>
          <div className="text-xs text-blue-200/60 uppercase tracking-widest font-medium">Total Rules</div>
        </div>

        <div className="p-6 rounded-xl border border-cyan-700/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent mb-2">
            {statistics.custom.toLocaleString()}
          </div>
          <div className="text-xs text-cyan-200/60 uppercase tracking-widest font-medium">Custom Rules</div>
        </div>

        <div className="p-6 rounded-xl border border-indigo-700/30 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 backdrop-blur-sm hover:border-indigo-500/50 transition-all duration-300">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-300 to-indigo-400 bg-clip-text text-transparent mb-2">
            {statistics.default.toLocaleString()}
          </div>
          <div className="text-xs text-indigo-200/60 uppercase tracking-widest font-medium">Default Rules</div>
        </div>

        <div className="p-6 rounded-xl border border-yellow-700/30 bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 backdrop-blur-sm hover:border-yellow-500/50 transition-all duration-300">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent mb-2">
            {statistics.overwritten.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-200/60 uppercase tracking-widest font-medium">Overwritten</div>
        </div>
      </div>

      {/* Conflicts Section */}
      {showConflicts && (
        <div className="backdrop-blur-sm border border-yellow-700/30 rounded-2xl p-6 mb-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-yellow-100 mb-1">Rule Conflicts</h3>
              <p className="text-sm text-yellow-200/60">Detected conflicts and overwritten rules</p>
            </div>
            <button
              onClick={() => setShowConflicts(false)}
              className="text-yellow-200/60 hover:text-yellow-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loadingConflicts ? (
            <div className="py-12 text-center text-yellow-200/60">
              <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-yellow-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading conflicts...
            </div>
          ) : conflicts ? (
            <div className="space-y-4">
              {/* Duplicate IDs */}
              {conflicts.duplicate_ids && conflicts.duplicate_ids.length > 0 && (
                <div className="border border-red-700/30 rounded-xl p-4 bg-red-900/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="text-red-200 font-semibold">Duplicate Rule IDs</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      {conflicts.duplicate_ids.length}
                    </span>
                  </div>
                  <p className="text-sm text-red-200/60 mb-3">
                    The following rule IDs appear in multiple files. This may cause conflicts:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conflicts.duplicate_ids.map((ruleId) => (
                      <button
                        key={ruleId}
                        onClick={() => {
                          // Filter rules by this ID
                          setSearchQuery(ruleId.toString())
                          setShowConflicts(false)
                        }}
                        className="px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-200 hover:bg-red-600/30 font-mono text-sm transition-colors"
                      >
                        ID: {ruleId}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Overwritten Rules */}
              {conflicts.overwritten_count > 0 && (
                <div className="border border-yellow-700/30 rounded-xl p-4 bg-yellow-900/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="text-yellow-200 font-semibold">Overwritten Rules</h4>
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      {conflicts.overwritten_count}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-200/60 mb-3">
                    Rules marked with <code className="px-1 py-0.5 rounded bg-yellow-900/30 text-yellow-300 text-xs">overwrite="yes"</code> will replace default rules:
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {conflicts.overwritten_rules && conflicts.overwritten_rules.length > 0 ? (
                      conflicts.overwritten_rules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3 rounded-lg border border-yellow-700/20 bg-yellow-900/5 hover:bg-yellow-900/10 transition-colors cursor-pointer"
                          onClick={() => handleViewRule(rule)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="px-2 py-1 rounded bg-yellow-600/20 text-yellow-300 font-mono text-sm font-semibold">
                                #{rule.rule_id}
                              </span>
                              <div>
                                <div className="text-yellow-200 font-medium">{rule.description || 'No description'}</div>
                                <div className="text-xs text-yellow-200/60 font-mono">{rule.file_name}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getSourceBadge(rule.source)}
                              {getStatusBadge(getRuleStatus(rule))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-yellow-200/60 italic">No overwritten rules to display</p>
                    )}
                  </div>
                  {conflicts.overwritten_count > 10 && (
                    <p className="text-xs text-yellow-200/60 mt-2 italic">
                      Showing first 10 of {conflicts.overwritten_count} overwritten rules. Use filters to see more.
                    </p>
                  )}
                </div>
              )}

              {/* No Conflicts */}
              {(!conflicts.duplicate_ids || conflicts.duplicate_ids.length === 0) && conflicts.overwritten_count === 0 && (
                <div className="py-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-green-200 font-semibold text-lg mb-2">No Conflicts Detected</p>
                  <p className="text-green-200/60 text-sm">All rules are properly configured with no duplicate IDs or overwrite conflicts.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-yellow-200/60">
              No conflict data available. Click "Scan Now" to scan rules first.
            </div>
          )}
        </div>
      )}

      {/* Search and Filters */}
      <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-blue-200 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID, description, or group..."
              className="w-full px-4 py-2 rounded-lg border border-blue-700/30 bg-slate-900/50 text-blue-200 placeholder-blue-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-blue-700/30 bg-slate-900/50 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="all">All</option>
              <option value="custom">Custom</option>
              <option value="default">Default</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-blue-700/30 bg-slate-900/50 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="all">All</option>
              <option value="0">0</option>
              <option value="3">3</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="15">15</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-blue-200/60">
            Showing {paginatedRules.length} of {filteredRules.length} rules
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-blue-700/30 bg-slate-900/50 text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="overwritten">Overwritten</option>
              <option value="conflict">Conflict</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-700/30">
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Level</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Dependencies</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">File</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-200/80 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-700/20">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-blue-200/60">
                    Loading rules...
                  </td>
                </tr>
              ) : paginatedRules.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-blue-200/60">
                    No rules found. {rules.length === 0 ? 'Click "Scan Now" to scan rules from server.' : 'Try adjusting your filters.'}
                  </td>
                </tr>
              ) : (
                paginatedRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-blue-900/10 transition-colors cursor-pointer"
                    onClick={() => handleViewRule(rule)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-blue-300">{rule.rule_id}</span>
                        {rule.rule_id >= 100000 && (
                          <span className="px-1.5 py-0.5 text-xs rounded bg-blue-500/20 text-blue-400">C</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-semibold ${getLevelColor(rule.level)}`}>
                        {rule.level}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-blue-200 max-w-md truncate" title={rule.description}>
                        {rule.description}
                      </div>
                      <div className="text-xs text-blue-200/50 mt-1">
                        {rule.groups}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(rule.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(getRuleStatus(rule))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-blue-200/70">
                        {(() => {
                          const deps = getDependencies(rule)
                          return (
                            <>
                              <div>↑ {deps.parents}</div>
                              <div>↓ {deps.children}</div>
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-blue-200/60 font-mono max-w-xs truncate" title={rule.file_path}>
                        {rule.file_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewRule(rule)
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-blue-700/30 flex items-center justify-between">
            <div className="text-sm text-blue-200/60">
              Page {pagination.page} of {totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const newPage = Math.max(1, pagination.page - 1)
                  setCurrentPage(newPage)
                  fetchRules(newPage, itemsPerPage)
                }}
                disabled={pagination.page === 1}
                className="px-3 py-1 rounded-lg border border-blue-700/30 text-blue-200 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => {
                  const newPage = Math.min(totalPages, pagination.page + 1)
                  setCurrentPage(newPage)
                  fetchRules(newPage, itemsPerPage)
                }}
                disabled={pagination.page === totalPages}
                className="px-3 py-1 rounded-lg border border-blue-700/30 text-blue-200 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rule Detail Modal (if selected) */}
      {selectedRule && !showXmlViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-100">Rule #{selectedRule.rule_id}</h3>
              <button
                onClick={() => {
                  setShowXmlViewer(false)
                  setSelectedRule(null)
                }}
                className="text-blue-200/60 hover:text-blue-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-200/60 uppercase">Level</label>
                  <div className={`text-lg font-semibold ${getLevelColor(selectedRule.level)}`}>
                    {selectedRule.level}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-blue-200/60 uppercase">Source</label>
                  <div className="mt-1">{getSourceBadge(selectedRule.source)}</div>
                </div>
              </div>

              <div>
                <label className="text-xs text-blue-200/60 uppercase">Description</label>
                <div className="text-blue-200 mt-1">{selectedRule.description}</div>
              </div>

              <div>
                <label className="text-xs text-blue-200/60 uppercase">Groups</label>
                <div className="text-blue-200/80 mt-1 font-mono text-sm">{selectedRule.groups}</div>
              </div>

              <div>
                <label className="text-xs text-blue-200/60 uppercase">File Path</label>
                <div className="text-blue-200/60 mt-1 font-mono text-sm break-all">{selectedRule.file_path}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-blue-200/60 uppercase">Dependencies</label>
                  <div className="text-blue-200 mt-1">
                    {(() => {
                      const deps = getDependencies(selectedRule)
                      return (
                        <>
                          <div>Parents: {deps.parents}</div>
                          <div>Children: {deps.children}</div>
                        </>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-blue-200/60 uppercase">Status</label>
                  <div className="mt-1">{getStatusBadge(getRuleStatus(selectedRule))}</div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowXmlViewer(false)
                  setSelectedRule(null)
                }}
                className="px-4 py-2 rounded-lg border border-blue-700/30 text-blue-200 hover:bg-blue-500/10"
              >
                Close
              </button>
              <button
                onClick={() => setShowXmlViewer(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Full XML
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XML Viewer Modal */}
      {selectedRule && showXmlViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-100">Rule #{selectedRule.rule_id} - Full XML</h3>
              <button
                onClick={() => setShowXmlViewer(false)}
                className="text-blue-200/60 hover:text-blue-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4">
              <div className="border border-blue-700/30 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                {selectedRule.rule_xml ? (
                  <pre className="p-6 overflow-x-auto">
                    <code className="text-sm font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-words">
                      {selectedRule.rule_xml}
                    </code>
                  </pre>
                ) : (
                  <div className="p-12 text-center text-blue-200/60">
                    <p>XML content not available. Rule may need to be re-scanned.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-blue-700/30">
              <button
                onClick={() => {
                  if (selectedRule.rule_xml) {
                    navigator.clipboard.writeText(selectedRule.rule_xml)
                    toast.success('XML copied to clipboard!')
                  }
                }}
                disabled={!selectedRule.rule_xml}
                className="px-4 py-2 rounded-lg border border-blue-700/30 text-blue-200 hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy XML</span>
              </button>
              <button
                onClick={() => setShowXmlViewer(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Back to Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RulesScanner

