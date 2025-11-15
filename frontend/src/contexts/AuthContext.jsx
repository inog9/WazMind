import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

// AuthProvider that uses Auth0 (must be inside Auth0Provider)
function Auth0AuthProvider({ children }) {
  const auth0 = useAuth0()
  
  // Map Auth0 user to our user format
  const user = auth0.user ? {
    ...auth0.user,
    picture: auth0.user.picture,
    name: auth0.user.name,
    email: auth0.user.email,
  } : null

  const login = () => {
    auth0.loginWithRedirect()
  }

  const logout = () => {
    auth0.logout({
      logoutParams: {
        returnTo: window.location.origin,
        federated: false
      }
    })
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    isAuthenticated: auth0.isAuthenticated,
    loading: auth0.isLoading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Fallback AuthProvider when Auth0 is not configured
export function FallbackAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('wazmind_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (e) {
        localStorage.removeItem('wazmind_user')
      }
    }
    setLoading(false)
  }, [])

  const login = () => {
    toast.error('Auth0 is not configured. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env file.')
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('wazmind_user')
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Main AuthProvider - exports the appropriate one
export const AuthProvider = Auth0AuthProvider

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

