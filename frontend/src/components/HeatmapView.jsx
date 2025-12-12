import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../utils/api'

function HeatmapView() {
  const [heatmapData, setHeatmapData] = useState(null)
  const [loadingHeatmap, setLoadingHeatmap] = useState(true)
  const [statistics, setStatistics] = useState({ total: 0, custom: 0, default: 0, overwritten: 0 })

  // Fetch statistics
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/wazuh/rules/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }, [])

  // Fetch heatmap data
  const fetchHeatmap = useCallback(async () => {
    setLoadingHeatmap(true)
    try {
      const response = await apiClient.get('/api/wazuh/rules/heatmap', {
        params: { range_size: 1000 }
      })
      setHeatmapData(response.data)
    } catch (error) {
      console.error('Error fetching heatmap:', error)
      toast.error('Failed to load heatmap data')
    } finally {
      setLoadingHeatmap(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchStatistics()
    fetchHeatmap()
  }, [fetchStatistics, fetchHeatmap])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="backdrop-blur-sm border border-blue-700/30 rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-100 mb-2">Rule ID Heatmap</h2>
            <p className="text-sm text-blue-200/60">Visualization of rule ID distribution (0 - 120,000)</p>
          </div>
          {heatmapData && (
            <div className="text-xs text-blue-200/60">
              Range size: {heatmapData.range_size?.toLocaleString() || '1,000'}
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent mb-1">
              {statistics.total.toLocaleString()}
            </div>
            <div className="text-xs text-blue-200/60 uppercase tracking-widest font-medium">Total Rules</div>
          </div>
          <div className="p-4 rounded-xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent mb-1">
              {statistics.default.toLocaleString()}
            </div>
            <div className="text-xs text-blue-200/60 uppercase tracking-widest font-medium">Default</div>
          </div>
          <div className="p-4 rounded-xl border border-cyan-700/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent mb-1">
              {statistics.custom.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-200/60 uppercase tracking-widest font-medium">Custom</div>
          </div>
          <div className="p-4 rounded-xl border border-green-700/30 bg-gradient-to-br from-green-900/20 to-green-800/10">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-green-300 to-green-400 bg-clip-text text-transparent mb-1">
              {(20000 - statistics.custom).toLocaleString()}
            </div>
            <div className="text-xs text-green-200/60 uppercase tracking-widest font-medium">Available IDs</div>
          </div>
        </div>

        {loadingHeatmap ? (
          <div className="py-12 text-center text-blue-200/60">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading heatmap...
          </div>
        ) : heatmapData ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-700/50 border border-gray-600"></div>
                  <span className="text-blue-200/60">Empty</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-blue-600/30 border border-blue-500/50"></div>
                  <span className="text-blue-200/60">Low density</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-600/50 border border-yellow-500/50"></div>
                  <span className="text-blue-200/60">Medium</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-red-600/70 border border-red-500/50"></div>
                  <span className="text-blue-200/60">High density</span>
                </div>
              </div>
              <div className="text-blue-200/60">
                Custom range: <span className="text-cyan-400 font-semibold">100,000 - 120,000</span>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className="grid grid-cols-12 gap-1">
              {heatmapData.ranges?.map((range, index) => {
                // Calculate color based on density
                let bgColor = 'bg-gray-700/30'
                let borderColor = 'border-gray-600/30'
                
                if (range.count > 0) {
                  if (range.density < 0.1) {
                    bgColor = 'bg-blue-600/20'
                    borderColor = 'border-blue-500/30'
                  } else if (range.density < 0.3) {
                    bgColor = 'bg-blue-600/40'
                    borderColor = 'border-blue-500/50'
                  } else if (range.density < 0.5) {
                    bgColor = 'bg-yellow-600/40'
                    borderColor = 'border-yellow-500/50'
                  } else {
                    bgColor = 'bg-red-600/50'
                    borderColor = 'border-red-500/50'
                  }
                }

                // Highlight custom range
                if (range.is_custom_range) {
                  borderColor = 'border-cyan-500/50'
                }

                return (
                  <div
                    key={index}
                    className={`${bgColor} ${borderColor} border rounded p-2 cursor-pointer hover:opacity-80 transition-opacity group relative`}
                    title={`ID Range: ${range.start.toLocaleString()} - ${range.end.toLocaleString()}\nRules: ${range.count}\nDensity: ${(range.density * 100).toFixed(1)}%`}
                  >
                    <div className="text-[8px] text-blue-200/40 font-mono leading-tight">
                      {range.start >= 100000 ? (
                        <span className="text-cyan-400">{Math.floor(range.start / 1000)}k</span>
                      ) : (
                        <span>{Math.floor(range.start / 1000)}k</span>
                      )}
                    </div>
                    {range.count > 0 && (
                      <div className="text-[10px] text-blue-200/60 font-semibold mt-1">
                        {range.count}
                      </div>
                    )}
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-slate-800 border border-blue-500/50 rounded-lg p-2 text-xs text-blue-200 shadow-lg whitespace-nowrap">
                        <div>Range: {range.start.toLocaleString()} - {range.end.toLocaleString()}</div>
                        <div>Rules: {range.count}</div>
                        <div>Density: {(range.density * 100).toFixed(1)}%</div>
                        {range.is_custom_range && <div className="text-cyan-400 mt-1">Custom Range</div>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Additional Statistics */}
            {heatmapData.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-blue-700/30">
                <div>
                  <div className="text-xs text-blue-200/60 uppercase mb-1">Total Rules</div>
                  <div className="text-lg font-semibold text-blue-200">{heatmapData.statistics.total_rules.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-200/60 uppercase mb-1">Default Range</div>
                  <div className="text-lg font-semibold text-blue-200">{heatmapData.statistics.default_range_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-200/60 uppercase mb-1">Custom Range</div>
                  <div className="text-lg font-semibold text-cyan-400">{heatmapData.statistics.custom_range_count.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-blue-200/60 uppercase mb-1">Available IDs</div>
                  <div className="text-lg font-semibold text-green-400">{heatmapData.statistics.available_custom_ids.toLocaleString()}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-blue-200/60">
            <p className="mb-4">No heatmap data available.</p>
            <p className="text-sm">Go to "Server Rules" tab and click "Scan Now" to scan rules first.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default HeatmapView

