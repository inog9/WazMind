import { useAuth } from '../contexts/AuthContext'

function LoginButton({ className = '' }) {
  const { login, isAuthenticated, user, logout } = useAuth()

  if (isAuthenticated) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-2">
          {user?.picture && (
            <img 
              src={user.picture} 
              alt={user.name || user.email} 
              className="w-8 h-8 rounded-full border-2 border-blue-400/50"
            />
          )}
          <span className="text-sm text-blue-200 hidden sm:block">
            {user?.name || user?.email}
          </span>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-900/30 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={login}
      className={`group px-6 py-2.5 border border-blue-500/50 text-blue-200 rounded-full font-medium hover:bg-blue-500/10 hover:border-blue-400/70 transition-all duration-200 flex items-center space-x-2 ${className}`}
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>Sign In</span>
    </button>
  )
}

export default LoginButton

