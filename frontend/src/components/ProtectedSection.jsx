import { useAuth } from '../contexts/AuthContext'
import LoginButton from './LoginButton'

function ProtectedSection({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // If Auth0 is not configured, show setup instructions
  if (!auth0Domain || !auth0ClientId) {
    return (
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-yellow-300 mb-2">Auth0 Setup Required</h2>
            <p className="text-yellow-200/70 mb-6">
              Please configure Auth0 to enable authentication.
            </p>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6 text-left space-y-4">
            <h3 className="text-lg font-semibold text-yellow-300 mb-3">Setup Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-200/80 text-sm">
              <li>Create <code className="bg-yellow-900/50 px-1 rounded">.env</code> file in <code className="bg-yellow-900/50 px-1 rounded">frontend/</code> directory</li>
              <li>Add: <code className="bg-yellow-900/50 px-1 rounded">VITE_AUTH0_DOMAIN=your-domain</code></li>
              <li>Add: <code className="bg-yellow-900/50 px-1 rounded">VITE_AUTH0_CLIENT_ID=your-client-id</code></li>
              <li>Get credentials from <a href="https://manage.auth0.com/" target="_blank" rel="noopener noreferrer" className="text-yellow-300 underline">Auth0 Dashboard</a></li>
              <li>Restart development server</li>
            </ol>
            <p className="text-xs text-yellow-200/60 mt-4">
              See <code className="bg-yellow-900/50 px-1 rounded">AUTH0_SETUP.md</code> for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Return empty div - authentication prompt removed from homepage
    return null
  }

  return <>{children}</>
}

export default ProtectedSection

