function LoadingSkeleton({ type = 'default' }) {
  if (type === 'job') {
    return (
      <div className="border rounded-xl p-4 bg-slate-800/30 animate-pulse">
        <div className="flex items-center space-x-3 mb-3">
          <div className="h-6 w-20 bg-slate-700 rounded-lg"></div>
          <div className="h-4 w-16 bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-700 rounded"></div>
          <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (type === 'file') {
    return (
      <div className="border rounded-xl p-5 bg-slate-800/30 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-slate-700 rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 bg-slate-700 rounded"></div>
            <div className="h-4 w-24 bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'rule') {
    return (
      <div className="bg-slate-900/40 backdrop-blur-sm border-2 border-blue-600/40 rounded-3xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-slate-700 rounded"></div>
          <div className="h-4 w-full bg-slate-700 rounded"></div>
          <div className="h-64 w-full bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Default skeleton
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      <div className="h-4 bg-slate-700 rounded w-1/2"></div>
      <div className="h-4 bg-slate-700 rounded w-5/6"></div>
    </div>
  )
}

export default LoadingSkeleton

