import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from './utils/api'
import { useAuth } from './contexts/AuthContext'
import FileUpload from './components/FileUpload'
import JobList from './components/JobList'
import RuleViewer from './components/RuleViewer'
import RulesList from './components/RulesList'
import RulesScanner from './components/RulesScanner'
import HeatmapView from './components/HeatmapView'
import ThemeToggle from './components/ThemeToggle'
import LoadingSkeleton from './components/LoadingSkeleton'
import LoginButton from './components/LoginButton'
import ProtectedSection from './components/ProtectedSection'
import './App.css'

// Memoized homepage background with particles
const HomepageBackground = memo(() => {
  // Generate stable particle positions using useMemo
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      // Use a seed based on index for consistent randomness
      const seed = i * 0.618033988749895 // Golden ratio for better distribution
      return {
        left: (Math.sin(seed * 100) * 0.5 + 0.5) * 100,
        top: (Math.cos(seed * 200) * 0.5 + 0.5) * 100,
        size: (Math.sin(seed * 300) * 0.5 + 0.5) * 4 + 2,
        duration: (Math.sin(seed * 400) * 0.5 + 0.5) * 10 + 10,
        delay: (Math.sin(seed * 500) * 0.5 + 0.5) * 5,
      }
    })
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[0]">
      {/* Enhanced Animated Gradient Orbs with more visibility */}
      <div className="absolute top-20 left-10 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/30 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-40 right-20 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-cyan-500/35 to-indigo-500/25 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      <div className="absolute bottom-20 left-1/3 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/20 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/25 to-cyan-400/15 blur-2xl animate-pulse" style={{ animationDuration: '7s', animationDelay: '0.5s' }} />
      
      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400/20"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s infinite ease-in-out`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Decorative Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" style={{ zIndex: -1 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="50%" stopColor="rgba(6, 182, 212, 0.2)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
          </linearGradient>
        </defs>
        <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#lineGradient)" strokeWidth="1" />
        <line x1="0" y1="50%" x2="100%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1" />
        <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#lineGradient)" strokeWidth="1" />
      </svg>

      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  )
})
HomepageBackground.displayName = 'HomepageBackground'

// Memoized background component to prevent re-renders
const MemoizedBackground = memo(() => (
  <div className="pointer-events-none fixed inset-0 overflow-hidden z-[-1]">
    {/* Base texture layer - dots and lines (most visible) */}
    <div className="absolute inset-0" style={{
      backgroundImage: `
        radial-gradient(circle, rgba(59, 130, 246, 0.35) 1px, transparent 1px),
        repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(59, 130, 246, 0.18) 8px, rgba(59, 130, 246, 0.18) 16px),
        repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(6, 182, 212, 0.15) 8px, rgba(6, 182, 212, 0.15) 16px)
      `,
      backgroundSize: '24px 24px, 100% 100%, 100% 100%',
      backgroundPosition: '0 0, 0 0, 0 0',
      opacity: 'var(--texture-opacity, 0.45)'
    }} />
    
    {/* Grid Pattern with texture */}
    <div className="absolute inset-0" style={{
      backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.15) 1px, transparent 1px)',
      backgroundSize: '50px 50px',
      opacity: 'calc(var(--texture-opacity, 0.45) * 0.6)'
    }} />
    
    {/* Mesh gradient texture */}
    <div className="absolute inset-0" style={{
      background: `
        radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.12) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
        radial-gradient(at 0% 100%, rgba(6, 182, 212, 0.12) 0px, transparent 50%)
      `
    }} />
    
    {/* Gradient Orbs with better visibility (behind texture) */}
    <div className="absolute -top-48 -left-48 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-600/25 to-cyan-600/15 blur-3xl [&[data-theme='light']]:from-blue-400/10 [&[data-theme='light']]:to-cyan-400/8" />
    <div className="absolute top-1/2 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-cyan-600/22 to-blue-500/12 blur-3xl [&[data-theme='light']]:from-cyan-400/10 [&[data-theme='light']]:to-blue-400/8" />
    <div className="absolute bottom-[-8rem] left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-600/18 to-blue-600/10 blur-3xl [&[data-theme='light']]:from-indigo-400/8 [&[data-theme='light']]:to-blue-400/6" />
    
    {/* Subtle radial gradients */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08),_transparent_60%)] [&[data-theme='light']]:bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.04),_transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.06),_transparent_60%)] [&[data-theme='light']]:bg-[radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.03),_transparent_60%)]" />
  </div>
))
MemoizedBackground.displayName = 'MemoizedBackground'

function App() {
  const { isAuthenticated, user, logout, login } = useAuth()
  const [files, setFiles] = useState([])
  const [jobs, setJobs] = useState([])
  const [rules, setRules] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const rulesSectionRef = useRef(null)
  const [activeTab, setActiveTab] = useState('generator') // 'generator', 'scanner', or 'heatmap'

  const [loading, setLoading] = useState(true)

  const [filesPagination, setFilesPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })
  const [jobsPagination, setJobsPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })

  const fetchFiles = useCallback(async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/api/upload', {
        params: { page, limit }
      })
      setFiles(response.data.items)
      setFilesPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        total_pages: response.data.total_pages
      })
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to load files. Please try again.')
    }
  }, [])

  const fetchJobs = useCallback(async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/api/jobs', {
        params: { page, limit }
      })
      setJobs(response.data.items)
      setJobsPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        total_pages: response.data.total_pages
      })
    } catch (error) {
      console.error('Error fetching jobs:', error)
      toast.error('Failed to load jobs. Please try again.')
    }
  }, [])

  const [rulesPagination, setRulesPagination] = useState({ page: 1, limit: 10, total: 0, total_pages: 0 })

  const fetchRules = useCallback(async (page = 1, limit = 10) => {
    try {
      const response = await apiClient.get('/api/rules', {
        params: { page, limit }
      })
      setRules(response.data.items)
      setRulesPagination({
        page: response.data.page,
        limit: response.data.limit,
        total: response.data.total,
        total_pages: response.data.total_pages
      })
    } catch (error) {
      console.error('Error fetching rules:', error)
      toast.error('Failed to load rules. Please try again.')
    }
  }, [])

  // Load data only once on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const loadData = async () => {
        setLoading(true)
        try {
          await Promise.all([fetchFiles(1, 10), fetchJobs(1, 10), fetchRules(1, 10)])
        } finally {
          setLoading(false)
        }
      }
      loadData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // Run when authentication status changes

  const handleFileUpload = useCallback(() => {
    fetchFiles(filesPagination.page, filesPagination.limit)
  }, [fetchFiles, filesPagination.page, filesPagination.limit])

  const handleJobCreated = useCallback(() => {
    fetchJobs(jobsPagination.page, jobsPagination.limit)
  }, [fetchJobs, jobsPagination.page, jobsPagination.limit])

  const handleViewRule = useCallback(async (jobId) => {
    try {
      setSelectedRule(null)
      toast.loading('Loading rule...', { id: 'loading-rule' })
      
      // First check job status to provide better feedback
      try {
        const jobResponse = await apiClient.get(`/api/jobs/${jobId}`)
        const job = jobResponse.data
        
        if (job.status === 'pending' || job.status === 'processing') {
          toast.error(`Job #${jobId} is still ${job.status}. Please wait for it to complete.`, { id: 'loading-rule', duration: 5000 })
          setSelectedRule(null)
          return
        }
        
        if (job.status === 'failed') {
          const errorMsg = job.error_message || 'Unknown error'
          toast.error(`Job #${jobId} failed: ${errorMsg}`, { id: 'loading-rule', duration: 5000 })
          setSelectedRule(null)
          return
        }
      } catch (jobError) {
        // If job endpoint fails, continue to try rule endpoint
        console.warn('Could not check job status:', jobError)
      }
      
      const response = await apiClient.get(`/api/rules/job/${jobId}`)
      
      setSelectedRule(response.data)
      toast.success('Rule loaded successfully', { id: 'loading-rule' })
      
      await new Promise(resolve => setTimeout(resolve, 50))
      
      setTimeout(() => {
        if (rulesSectionRef.current) {
          rulesSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 200)
    } catch (error) {
      console.error('Error fetching rule:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Rule not found or not yet generated'
      toast.error(errorMessage, { id: 'loading-rule', duration: 5000 })
      setSelectedRule(null)
      throw error // Re-throw so caller knows it failed
    }
  }, [])

  const pendingJobsCount = useMemo(() => {
    return jobs.filter((job) => job.status === 'pending' || job.status === 'processing').length
  }, [jobs])

  // Memoize onUpdate callback for RuleViewer
  const handleRuleUpdate = useCallback(() => {
    fetchJobs(jobsPagination.page, jobsPagination.limit)
    fetchRules(rulesPagination.page, rulesPagination.limit)
  }, [fetchJobs, fetchRules, jobsPagination.page, jobsPagination.limit, rulesPagination.page, rulesPagination.limit])

  const scrollToFeatures = useCallback(() => {
    const mainFeaturesSection = document.querySelector('[data-section="main-features"]')
    if (mainFeaturesSection) {
      mainFeaturesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="relative w-full text-gray-100" style={{ 
      minHeight: '100vh',
      background: 'transparent'
    }}>
      {/* Static Background Elements with Texture - Theme Aware - Memoized */}
      <MemoizedBackground />

      {/* Navigation Bar */}
      <nav className="relative z-30 backdrop-blur-md bg-slate-900/30 border-b border-blue-700/30 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-blue-700/30 ring-2 ring-blue-400/40 overflow-hidden">
                <img src="/wazmind.svg" alt="WazMind Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-bold text-blue-100">WazMind</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden md:flex items-center space-x-3">
                    {user?.picture && (
                      <img 
                        src={user.picture} 
                        alt={user.name || user.email} 
                        className="w-8 h-8 rounded-full border-2 border-blue-400/50"
                      />
                    )}
                    <span className="text-sm text-blue-200">
                      {user?.name || user?.email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-blue-200 hover:text-blue-100 transition-colors text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <LoginButton />
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Only show when not authenticated */}
      {!isAuthenticated && (
        <>
          {/* Enhanced Background Elements for Homepage */}
          <HomepageBackground />

          <header className="relative z-20 pt-32 pb-24">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center space-y-12">
                {/* Main Heading with Gradient Effect */}
                <div className="space-y-6">
                  <div className="relative inline-block">
                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight bg-gradient-to-r from-blue-100 via-cyan-100 to-indigo-100 bg-clip-text text-transparent drop-shadow-2xl">
                      WazMind
                    </h1>
                    {/* Glow effect behind text */}
                    <div className="absolute inset-0 text-6xl sm:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight text-blue-400/20 blur-xl -z-10">
                      WazMind
                    </div>
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl text-blue-200/80 leading-relaxed font-light max-w-3xl mx-auto">
                    AI-powered log intelligence for automated Wazuh rule generation
                  </p>
                </div>

                {/* CTA Buttons with Enhanced Styling */}
                <div className="flex items-center justify-center pt-6">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                    <button
                      onClick={login}
                      className="px-10 py-4 text-base relative border border-blue-500/50 text-blue-200 rounded-full font-medium hover:bg-blue-500/10 hover:border-blue-400/70 transition-all duration-200 flex items-center space-x-2"
                      style={{ backgroundColor: 'var(--bg-primary)' }}
                    >
                      <span>Get Started</span>
                    </button>
                  </div>
                </div>

                {/* Enhanced Stats with Cards */}
                <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-16">
                  <div className="p-6 rounded-2xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-blue-800/10 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 group">
                    <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-blue-300 to-blue-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                      AI
                    </div>
                    <div className="text-xs text-blue-200/60 uppercase tracking-widest font-medium">Powered</div>
                  </div>
                  <div className="p-6 rounded-2xl border border-cyan-700/30 bg-gradient-to-br from-cyan-900/20 to-cyan-800/10 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 group">
                    <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-cyan-300 to-cyan-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                      &lt;1s
                    </div>
                    <div className="text-xs text-cyan-200/60 uppercase tracking-widest font-medium">Fast</div>
                  </div>
                  <div className="p-6 rounded-2xl border border-indigo-700/30 bg-gradient-to-br from-indigo-900/20 to-indigo-800/10 backdrop-blur-sm hover:border-indigo-500/50 transition-all duration-300 group">
                    <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-300 to-indigo-400 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                      100%
                    </div>
                    <div className="text-xs text-indigo-200/60 uppercase tracking-widest font-medium">Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* About/Background Section */}
          <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-3xl sm:text-4xl font-bold text-blue-100 mb-3 tracking-tight">
                  Why WazMind?
                </h2>
                <p className="text-lg text-blue-200/60 max-w-2xl mx-auto font-light">
                  Transforming security operations through intelligent automation
                </p>
              </div>
              
              <div className="space-y-8">
                <div className="p-8 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-base text-blue-200/80 leading-relaxed font-light">
                    Security teams spend countless hours manually analyzing log files to create Wazuh detection rules. 
                    This process is time-consuming, error-prone, and doesn't scale with the volume of security events 
                    in modern infrastructure.
                  </p>
                </div>

                <div className="p-8 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-base text-blue-200/80 leading-relaxed font-light">
                    <span className="font-semibold text-cyan-300">WazMind</span> solves this challenge by leveraging 
                    advanced AI to automatically analyze log patterns, detect security-relevant events, and generate 
                    production-ready Wazuh rules in seconds. What used to take hours of manual work can now be done 
                    with a simple file upload.
                  </p>
                </div>

                <div className="p-8 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <p className="text-base text-blue-200/80 leading-relaxed font-light">
                    Built for security professionals who value both speed and accuracy, WazMind ensures that your 
                    detection rules are not only generated quickly but also follow best practices and reference 
                    existing rule patterns from the Wazuh community.
                  </p>
                </div>
              </div>

              {/* Key Benefits */}
              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="p-8 rounded-xl border border-blue-700/20 text-left hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <h3 className="text-xl font-semibold text-blue-100 mb-3">Save Time</h3>
                  <p className="text-sm text-blue-200/70 font-light leading-relaxed">
                    Generate rules in seconds instead of hours
                  </p>
                </div>
                <div className="p-8 rounded-xl border border-blue-700/20 text-left hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <h3 className="text-xl font-semibold text-blue-100 mb-3">Improve Accuracy</h3>
                  <p className="text-sm text-blue-200/70 font-light leading-relaxed">
                    AI-powered pattern detection reduces human error
                  </p>
                </div>
                <div className="p-8 rounded-xl border border-blue-700/20 text-left hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <h3 className="text-xl font-semibold text-blue-100 mb-3">Stay Secure</h3>
                  <p className="text-sm text-blue-200/70 font-light leading-relaxed">
                    Faster rule generation means faster threat detection
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section - Only show when not authenticated */}
          <section data-section="features" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-blue-100 mb-3 tracking-tight">
                Features
              </h2>
              <p className="text-base text-blue-200/60 max-w-xl mx-auto font-light">
                Transform logs into actionable security rules
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Smart Upload</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Drag & drop or browse to upload log files. Supports .log, .txt, .json, and .csv formats.
                </p>
              </div>
              {/* Feature 2 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Pattern Detection</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Automatically detects IP addresses, timestamps, errors, and security patterns in your logs.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">AI Rule Generation</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Powered by advanced AI models to generate accurate, production-ready Wazuh rules in seconds.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Edit & Customize</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Review and edit generated rules before deployment. Full XML editing support with validation.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Bulk Export</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Export multiple rules as ZIP files. Perfect for batch deployment to your Wazuh infrastructure.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="p-6 rounded-xl border border-blue-700/20 hover:border-blue-500/40 transition-all duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <h3 className="text-lg font-semibold text-blue-100 mb-3">Secure by Default</h3>
                <p className="text-blue-200/70 text-sm leading-relaxed font-light">
                  Built with security in mind. XSS protection, input validation, and secure file handling.
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Main Features Section - Protected */}
      <ProtectedSection>
        <main data-section="main-features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-10 pt-20" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 border-b border-blue-700/30 mb-6">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'generator'
                ? 'text-blue-200'
                : 'text-blue-200/60 hover:text-blue-200/80'
            }`}
          >
            Rule Generator
            {activeTab === 'generator' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'scanner'
                ? 'text-blue-200'
                : 'text-blue-200/60 hover:text-blue-200/80'
            }`}
          >
            Server Rules
            {activeTab === 'scanner' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'heatmap'
                ? 'text-blue-200'
                : 'text-blue-200/60 hover:text-blue-200/80'
            }`}
          >
            Heatmap
            {activeTab === 'heatmap' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"></span>
            )}
          </button>
        </div>

          {loading ? (
            <div className="space-y-10">
              <LoadingSkeleton type="file" />
              <LoadingSkeleton type="job" />
              <LoadingSkeleton type="rule" />
            </div>
        ) : activeTab === 'scanner' ? (
          /* Server Rules Scanner Tab */
          <RulesScanner />
        ) : activeTab === 'heatmap' ? (
          /* Heatmap Tab */
          <HeatmapView />
        ) : (
            /* Rule Generator Tab (Existing) */
            <>
              {/* Upload Section */}
              <section>
                <FileUpload
                  onUpload={handleFileUpload}
                  onJobCreated={handleJobCreated}
                  files={files}
                  pagination={filesPagination}
                  onPageChange={(page) => fetchFiles(page, filesPagination.limit)}
                />
              </section>

              {/* Jobs Section */}
              <section data-section="jobs">
                <JobList
                  jobs={jobs}
                  pagination={jobsPagination}
                  onRefresh={(page) => fetchJobs(page, jobsPagination.limit)}
                  onViewRule={handleViewRule}
                />
              </section>

              {/* Rules List Section */}
              {rules.length > 0 && (
                <section>
                  <RulesList
                    rules={rules}
                    pagination={rulesPagination}
                    onViewRule={handleViewRule}
                    onRefresh={(page) => fetchRules(page, rulesPagination.limit)}
                  />
                </section>
              )}

              {/* Rules Section */}
              <section ref={rulesSectionRef}>
                <RuleViewer
                  key={selectedRule?.id || 'no-rule'}
                  rule={selectedRule}
                  onUpdate={handleRuleUpdate}
                />
              </section>
            </>
          )}
        </main>
      </ProtectedSection>
    </div>
  )
}

export default App

