import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider, FallbackAuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
import './index.css'

// Get Auth0 configuration from environment variables
const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN || ''
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID || ''

// Show warning if Auth0 is not configured
if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
  console.warn('⚠️ Auth0 is not configured. Please set VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in .env file.')
  console.warn('See AUTH0_SETUP.md for instructions.')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {AUTH0_DOMAIN && AUTH0_CLIENT_ID ? (
        <Auth0Provider
          domain={AUTH0_DOMAIN}
          clientId={AUTH0_CLIENT_ID}
          authorizationParams={{
            redirect_uri: window.location.origin,
            audience: undefined,
            scope: 'openid profile email'
          }}
          useRefreshTokens={true}
          cacheLocation="localstorage"
        >
          <ThemeProvider>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(37, 99, 235, 0.4)',
                  },
                  success: {
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </Auth0Provider>
      ) : (
        <ThemeProvider>
          <FallbackAuthProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </FallbackAuthProvider>
        </ThemeProvider>
      )}
    </ErrorBoundary>
  </React.StrictMode>,
)

