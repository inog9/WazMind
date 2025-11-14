/**
 * Get status color classes for job status
 */
export const getStatusColor = (status) => {
  const statusColors = {
    completed: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg',
    failed: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg',
    processing: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg animate-pulse',
    pending: 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-lg',
  }
  return statusColors[status] || statusColors.pending
}

/**
 * Get status icon for job status
 */
export const getStatusIcon = (status) => {
  const statusIcons = {
    completed: '✅',
    failed: '❌',
    processing: '⏳',
    pending: '⏸️',
  }
  return statusIcons[status] || '📋'
}

