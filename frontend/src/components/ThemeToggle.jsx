import { useTheme } from '../contexts/ThemeContext'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full bg-slate-700 border-2 border-blue-600/40 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Toggle Circle */}
      <div
        className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 shadow-lg transition-transform duration-300 flex items-center justify-center ${
          theme === 'light' ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        {theme === 'dark' ? (
          <svg className="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
      </div>
      
      {/* Background gradient based on theme */}
      <div
        className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          theme === 'light'
            ? 'bg-gradient-to-r from-yellow-400/20 to-orange-400/20 opacity-100'
            : 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 opacity-100'
        }`}
      />
    </button>
  )
}

export default ThemeToggle

