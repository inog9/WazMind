import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load env from root directory (parent of frontend/)
  // This allows frontend to read VITE_* variables from root .env file
  const rootEnvDir = resolve(__dirname, '..')
  
  // Load environment variables from root directory
  // Vite will automatically expose VITE_* prefixed variables to the app
  const env = loadEnv(mode, rootEnvDir, 'VITE_')
  
  return {
    plugins: [react()],
    // Tell Vite to look for .env files in the root directory
    envDir: rootEnvDir,
    envPrefix: 'VITE_',
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})

