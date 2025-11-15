import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../utils/api'
import { formatDate } from '../utils/format'

function RuleViewer({ rule, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [ruleXml, setRuleXml] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Sync ruleXml state when rule prop changes
  useEffect(() => {
    if (rule && rule.rule_xml) {
      setRuleXml(rule.rule_xml)
      setEditing(false) // Reset editing state when new rule is loaded
      setError(null)
      setSuccess(null)
    } else {
      // Reset when rule is cleared or doesn't have rule_xml
      setRuleXml('')
      setEditing(false)
      setError(null)
      setSuccess(null)
    }
  }, [rule])

  // Show empty state if no rule or rule has no content
  if (!rule || !rule.rule_xml) {
    return (
      <div className="relative">
        <div className="backdrop-blur-sm border-2 border-blue-600/40 rounded-3xl transition-all duration-300 hover:border-blue-500/60 min-h-[400px]" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xl font-semibold text-blue-200 mb-2">No rule selected</p>
            <p className="text-sm text-gray-400">Generate a rule from a completed job to view it here</p>
          </div>
        </div>
      </div>
    )
  }

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const handleEdit = useCallback(() => {
    setEditing(true)
    setRuleXml(rule.rule_xml)
    clearMessages()
  }, [rule?.rule_xml, clearMessages])

  const handleCancel = useCallback(() => {
    setEditing(false)
    setRuleXml(rule.rule_xml)
    clearMessages()
  }, [rule?.rule_xml, clearMessages])

  const handleSave = useCallback(async () => {
    if (!rule || !rule.id) {
      setError('No rule selected to save')
      return
    }
    
    setSaving(true)
    clearMessages()

    try {
      await apiClient.put(`/api/rules/${rule.id}`, {
        rule_xml: ruleXml,
      })
      toast.success('Rule updated successfully')
      setSuccess('Rule updated successfully!')
      setEditing(false)
      onUpdate()
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Error updating rule'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setSaving(false)
    }
  }, [rule, ruleXml, clearMessages, onUpdate])

  const handleDownload = useCallback(() => {
    const xmlToDownload = ruleXml || rule?.rule_xml
    if (!xmlToDownload || !rule?.id) {
      setError('No rule content to download')
      return
    }
    
    const blob = new Blob([xmlToDownload], { type: 'application/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wazuh_rule_${rule.id}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [ruleXml, rule])

  const handleCopy = useCallback(async () => {
    const xmlToCopy = ruleXml || rule?.rule_xml
    if (!xmlToCopy) {
      setError('No rule content to copy')
      return
    }
    
    try {
      await navigator.clipboard.writeText(xmlToCopy)
      setSuccess('Rule XML copied to clipboard!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to copy to clipboard')
    }
  }, [ruleXml, rule])

  return (
    <div className="relative">
      <div className="backdrop-blur-sm border-2 border-blue-600/40 rounded-3xl transition-all duration-300 hover:border-blue-500/60" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="p-6 border-b border-blue-700/30 backdrop-blur-sm rounded-t-3xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-blue-400">Wazuh Rule</h2>
                <p className="text-sm text-gray-400 mt-0.5">Review and edit your generated rule</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
                  {!editing ? (
                    <>
                      <button
                        onClick={handleEdit}
                        className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 transition-all duration-200"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      <button
                        onClick={handleCopy}
                        className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 transition-all duration-200"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium">Copy</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 text-sm font-medium shadow-lg shadow-blue-600/30 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download</span>
                  </button>
                </>
              ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 transition-all duration-200"
                        style={{ backgroundColor: 'var(--bg-primary)' }}
                      >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-sm font-medium">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-sm font-medium shadow-lg shadow-blue-600/30 transition-all duration-200"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

          <div className="mb-6 p-4 bg-slate-800/30 border border-blue-600/30 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-600/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Rule ID</p>
                  <p className="text-sm font-semibold text-blue-300">#{rule.id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-600/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Job ID</p>
                  <p className="text-sm font-semibold text-blue-300">#{rule.job_id}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-600/40 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Updated</p>
                  <p className="text-sm font-semibold text-blue-300">{formatDate(rule.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-900/30 border-l-2 border-red-500 text-red-300 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-900/30 border-l-2 border-green-500 text-green-300 px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">{success}</p>
              </div>
            </div>
          )}

          <div className="border border-blue-700/30 rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {editing ? (
              <textarea
                value={ruleXml}
                onChange={(e) => setRuleXml(e.target.value)}
                className="w-full h-96 p-6 font-mono text-sm border-0 focus:ring-2 focus:ring-blue-500 bg-slate-900 text-gray-200 focus:bg-slate-800 transition-colors"
                style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                spellCheck={false}
              />
            ) : (
              <pre className="p-6 bg-slate-900 overflow-x-auto" style={{ backgroundColor: 'var(--bg-primary)' }}>
                <code className="text-sm font-mono text-blue-300 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                  {ruleXml || (rule && rule.rule_xml) || 'Loading rule...'}
                </code>
              </pre>
            )}
          </div>

          <div className="mt-6 p-4 bg-yellow-900/20 border-l-2 border-yellow-500/60 rounded-xl">
            <p className="text-sm text-yellow-300 flex items-start space-x-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>
                <strong>Security Note:</strong> Please review this rule carefully before applying it to your Wazuh installation. 
                AI-generated rules should always be validated by a security engineer.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RuleViewer

