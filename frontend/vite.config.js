import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  // Load env from root directory (parent of frontend/)
  // This allows frontend to read VITE_* variables from root .env file
  const rootEnvDir = resolve(__dirname, '..')
  
  // Load environment variables from root directory
  // Vite will automatically expose VITE_* prefixed variables to the app
  const env = loadEnv(mode, rootEnvDir, 'VITE_')
  
  // Optional dev HTTPS for Auth0 secure-origin requirement.
  // Enable by setting VITE_DEV_HTTPS=true and placing cert/key in certs/dev-cert.pem and certs/dev-key.pem
  const devHttps =
    env.VITE_DEV_HTTPS === 'true' &&
    fs.existsSync(resolve(__dirname, 'certs/dev-key.pem')) &&
    fs.existsSync(resolve(__dirname, 'certs/dev-cert.pem'))
      ? {
          key: fs.readFileSync(resolve(__dirname, 'certs/dev-key.pem')),
          cert: fs.readFileSync(resolve(__dirname, 'certs/dev-cert.pem')),
        }
      : undefined

  return {
    plugins: [react()],
    // Tell Vite to look for .env files in the root directory
    envDir: rootEnvDir,
    envPrefix: 'VITE_',
    server: {
      host: '0.0.0.0',
      port: 5173,
      https: devHttps,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  }
})

