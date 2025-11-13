import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import FileUpload from './components/FileUpload'
import JobList from './components/JobList'
import RuleViewer from './components/RuleViewer'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [files, setFiles] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedRule, setSelectedRule] = useState(null)
  const rulesSectionRef = useRef(null)

  useEffect(() => {
    fetchFiles()
    fetchJobs()
  }, [])

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/upload`)
      setFiles(response.data)
    } catch (error) {
      console.error('Error fetching files:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/jobs`)
      setJobs(response.data)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const handleFileUpload = () => {
    fetchFiles()
  }

  const handleJobCreated = () => {
    fetchJobs()
  }

  const handleViewRule = async (jobId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/rules/job/${jobId}`)
      setSelectedRule(response.data)
      // Scroll to rules section
      setTimeout(() => {
        rulesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (error) {
      console.error('Error fetching rule:', error)
      alert('Rule not found or not yet generated')
    }
  }

  return (
    <div className="relative w-full text-gray-100" style={{ 
      minHeight: '100vh',
      background: 'transparent'
    }}>
      {/* Static Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-[-1]">
        {/* Gradient Orbs with better visibility */}
        <div className="absolute -top-48 -left-48 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-blue-600/25 to-cyan-600/15 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-cyan-600/22 to-blue-500/12 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/2 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-indigo-600/18 to-blue-600/10 blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-12" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        
        {/* Subtle radial gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,_rgba(6,182,212,0.06),_transparent_60%)]" />
      </div>

      <header className="relative z-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-700/30 ring-2 ring-blue-400/40">
                <span className="text-2xl">🧠</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-blue-300/70">WazMind</p>
                <h1 className="text-4xl sm:text-5xl font-bold text-blue-100 drop-shadow-[0_0_35px_rgba(59,130,246,0.35)]">
                  AI-Powered Wazuh Intelligence
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-blue-200/80">
              <div className="text-right">
                <p className="font-semibold text-blue-100">Milliseconds</p>
                <p className="text-xs text-blue-300/70">Log ingestion latency</p>
              </div>
              <div className="h-10 w-px bg-gradient-to-b from-blue-500/40 to-blue-300/20" />
              <div className="text-right">
                <p className="font-semibold text-blue-100">AI Engine</p>
                <p className="text-xs text-blue-300/70">Rule synthesis engine</p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.8fr,1fr] items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold text-blue-100">
                Transform your raw logs into high-fidelity Wazuh detection rules powered by AI.
              </h2>
              <p className="text-blue-200/80 leading-relaxed max-w-2xl">
                Unggah log, biarkan WazMind menganalisis pola, dan dapatkan ruleset siap pakai yang bisa kamu review, modifikasi,
                dan deploy ke lingkungan produksi dengan percaya diri.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  🔒 Secure-by-default
                </span>
                <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  ⚡ Fast AI inference
                </span>
                <span className="px-4 py-2 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  🧠 Assisted Rule Editing
                </span>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-blue-700/40 rounded-2xl p-6 shadow-2xl shadow-blue-900/30 backdrop-blur-md">
              <p className="text-sm uppercase tracking-[0.35em] text-blue-300/70 mb-4">Quick Insight</p>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/80 text-sm">Last generated rule</span>
                  <span className="text-blue-100 font-semibold">
                    {selectedRule ? `#${selectedRule.id}` : 'Belum ada'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/80 text-sm">Total uploads</span>
                  <span className="text-blue-100 font-semibold">{files.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-200/80 text-sm">Pending jobs</span>
                  <span className="text-blue-100 font-semibold">
                    {jobs.filter((job) => job.status === 'pending' || job.status === 'processing').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-10 pt-8" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Upload Section */}
        <section>
          <FileUpload
            onUpload={handleFileUpload}
            onJobCreated={handleJobCreated}
            files={files}
          />
        </section>

        {/* Jobs Section */}
        <section>
          <JobList
            jobs={jobs}
            onRefresh={fetchJobs}
            onViewRule={handleViewRule}
          />
        </section>

        {/* Rules Section */}
        <section ref={rulesSectionRef}>
          <RuleViewer
            rule={selectedRule}
            onUpdate={fetchJobs}
          />
        </section>
      </main>
    </div>
  )
}

export default App

