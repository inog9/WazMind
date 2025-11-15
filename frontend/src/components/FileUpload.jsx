import { useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiClient } from '../utils/api'
import { formatFileSize, formatDate } from '../utils/format'
import PatternDetector from './PatternDetector'

function FileUpload({ onUpload, onJobCreated, files }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [detectedPatterns, setDetectedPatterns] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [reorderedFiles, setReorderedFiles] = useState(null)
  const fileInputRef = useRef(null)

  const clearMessages = useCallback(() => {
    setUploadError(null)
    setUploadSuccess(null)
  }, [])

  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      clearMessages()
    }
  }, [clearMessages])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      clearMessages()
    }
  }, [clearMessages])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) {
      setUploadError('Please select a file')
      return
    }

    setUploading(true)
    clearMessages()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await apiClient.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success(`File uploaded successfully! File ID: ${response.data.id}`)
      setUploadSuccess(`File uploaded successfully! File ID: ${response.data.id}`)
      setSelectedFileId(response.data.id) // Show pattern detector for newly uploaded file
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUpload()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error uploading file'
      setUploadError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setUploading(false)
    }
  }, [file, clearMessages, onUpload])

  const handleGenerate = useCallback(async (fileId) => {
    setGenerating(true)
    clearMessages()
    try {
      const response = await apiClient.post('/api/jobs/generate', {
        log_file_id: fileId,
      })
      toast.success(`Rule generation job #${response.data.id} created! Processing in background...`)
      onJobCreated()
      
      // Auto-scroll to jobs section after a short delay
      setTimeout(() => {
        const jobsSection = document.querySelector('[data-section="jobs"]')
        if (jobsSection) {
          jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 500)
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error creating generation job'
      setUploadError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setGenerating(false)
    }
  }, [clearMessages, onJobCreated])

  const handleDelete = useCallback(async (fileId, filename) => {
    setDeletingId(fileId)
    clearMessages()

    try {
      await apiClient.delete(`/api/upload/${fileId}`)
      toast.success(`File "${filename}" deleted successfully`)
      onUpload()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error deleting file'
      setUploadError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setDeletingId(null)
    }
  }, [clearMessages, onUpload])

  const handleBulkDelete = useCallback(async () => {
    if (selectedFiles.size === 0) {
      toast.error('Please select files to delete')
      return
    }

    const fileIds = Array.from(selectedFiles)
    clearMessages()

    try {
      const response = await apiClient.post('/api/upload/bulk-delete', { file_ids: fileIds })
      toast.success(`Deleted ${response.data.deleted_count} file(s) successfully`)
      setSelectedFiles(new Set())
      setIsSelectMode(false)
      onUpload()
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Error deleting files'
      toast.error(errorMsg)
    }
  }, [selectedFiles, clearMessages, onUpload])

  const handleToggleSelect = useCallback((fileId) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)))
    }
  }, [selectedFiles, files])

  // Drag and drop handlers for file reordering
  const handleFileDragStart = useCallback((index) => {
    setDraggedIndex(index)
  }, [])

  const handleFileDragOver = useCallback((e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleFileDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleFileDrop = useCallback((e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const currentFiles = reorderedFiles || files
    const newFiles = [...currentFiles]
    const [draggedFile] = newFiles.splice(draggedIndex, 1)
    newFiles.splice(dropIndex, 0, draggedFile)
    
    setReorderedFiles(newFiles)
    setDraggedIndex(null)
    setDragOverIndex(null)
    toast.success('Files reordered')
  }, [draggedIndex, files, reorderedFiles])

  const handleFileInputClick = useCallback(() => {
    if (!file && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [file])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Modern Upload Box */}
      <div className="relative">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative backdrop-blur-sm border-2 rounded-3xl transition-all duration-300 ${
                isDragging
                  ? 'border-blue-400 shadow-2xl shadow-blue-500/30 scale-[1.01]'
                  : 'border-blue-600/40 hover:border-blue-500/60'
              } ${file ? 'min-h-[400px]' : 'min-h-[350px]'}`}
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
          {/* Main Content Area */}
          <div 
            className="p-8 cursor-pointer"
            onClick={handleFileInputClick}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-center space-y-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-blue-200 mb-2">
                    {isDragging ? 'Drop your log file here' : 'Upload Log File'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Supports: .log, .txt, .json, .csv
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-blue-900/30 border border-blue-600/40 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-200 text-lg">{file.name}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".log,.txt,.json,.csv"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700/30 backdrop-blur-sm rounded-b-3xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label
                  onClick={handleFileInputClick}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 cursor-pointer transition-all duration-200"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium">Upload</span>
                </label>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="flex items-center space-x-2 px-4 py-2 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Process</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="px-3 py-1.5 bg-blue-900/40 border border-blue-600/40 rounded-lg text-xs text-blue-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  Log Files
                </div>
                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {uploadError && (
          <div className="mt-4 bg-red-900/50 border-l-4 border-red-500 text-red-300 px-4 py-3 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-xl">❌</span>
              <p className="font-medium">{uploadError}</p>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 bg-green-900/50 border-l-4 border-green-500 text-green-300 px-4 py-3 rounded-lg shadow-md animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="text-xl">✅</span>
              <p className="font-medium">{uploadSuccess}</p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-blue-700/30 hover:shadow-blue-900/50 transition-shadow duration-300" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <span className="text-xl">📁</span>
              </div>
              <h2 className="text-2xl font-bold text-blue-400">
                Uploaded Files
              </h2>
              <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold border border-blue-600/50">
                {files.length}
              </span>
              {isSelectMode && selectedFiles.size > 0 && (
                <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm font-semibold border border-green-600/50">
                  {selectedFiles.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isSelectMode ? (
                <>
                  <button
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedFiles.size === 0}
                    className="px-3 py-1.5 border border-red-500/50 text-red-200 hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    Delete Selected ({selectedFiles.size})
                  </button>
                  <button
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedFiles(new Set())
                    }}
                    className="px-3 py-1.5 border border-gray-500/50 text-gray-200 hover:bg-gray-900/50 rounded-lg text-sm font-medium transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsSelectMode(true)}
                  className="px-3 py-1.5 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                >
                  Select Files
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
                 {(reorderedFiles || files).map((f, index) => (
                   <div 
                     key={f.id} 
                     className="space-y-3"
                     draggable={!isSelectMode}
                     onDragStart={() => handleFileDragStart(index)}
                     onDragOver={(e) => handleFileDragOver(e, index)}
                     onDragLeave={handleFileDragLeave}
                     onDrop={(e) => handleFileDrop(e, index)}
                   >
                     <div
                       className={`flex items-center justify-between p-5 border-2 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                         dragOverIndex === index ? 'border-blue-500 border-4 scale-105' : 'border-blue-700/30 hover:border-blue-500/60'
                       } ${draggedIndex === index ? 'opacity-50' : ''} ${isSelectMode && selectedFiles.has(f.id) ? 'ring-2 ring-blue-500 bg-blue-900/30' : ''}`}
                       style={{ backgroundColor: 'var(--bg-primary)' }}
                     >
                <div className="flex items-center space-x-4 flex-1">
                  {isSelectMode && (
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(f.id)}
                      onChange={() => handleToggleSelect(f.id)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                  )}
                  {!isSelectMode && (
                    <div className="cursor-move text-gray-400 hover:text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                    </div>
                  )}
                 <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30">
                   <span className="text-2xl">📄</span>
                 </div>
                  <div className="flex-1">
                      <p className="font-bold text-gray-100 text-lg" style={{ color: 'var(--text-primary)' }}>{f.original_filename}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-sm text-gray-300 flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                           <span>💾</span>
                           <span>{formatFileSize(f.file_size)}</span>
                         </p>
                        <p className="text-sm text-gray-300 flex items-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
                          <span>🕒</span>
                          <span>{formatDate(f.uploaded_at)}</span>
                        </p>
                       </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <div className="flex items-center space-x-3">
                     <button
                       onClick={() => setSelectedFileId(selectedFileId === f.id ? null : f.id)}
                       className="flex items-center space-x-2 px-4 py-2 border border-blue-500/50 text-blue-200 hover:bg-blue-900/50 hover:border-blue-400/70 rounded-xl transition-all duration-200 text-sm font-semibold shadow-sm"
                     >
                       <span>🔍</span>
                       <span>{selectedFileId === f.id ? 'Hide' : 'Analyze'} Patterns</span>
                     </button>
                     <button
                       onClick={() => handleDelete(f.id, f.original_filename)}
                       disabled={deletingId === f.id}
                       className="flex items-center space-x-2 px-4 py-2 border border-red-500/50 text-red-200 hover:bg-red-900/50 hover:border-red-400/70 rounded-xl transition-all duration-200 text-sm font-semibold disabled:opacity-50 shadow-sm"
                     >
                      {deletingId === f.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                   <button
                     onClick={() => handleGenerate(f.id)}
                     disabled={generating || deletingId === f.id}
                     className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-sm font-semibold shadow-lg shadow-blue-600/30 transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2"
                   >
                    {generating ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate Rule</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
                     
              {/* Pattern Detector */}
              {selectedFileId === f.id && (
                <div className="mt-3">
                  <PatternDetector
                    fileId={f.id}
                    filePath={f.file_path}
                    onPatternsDetected={(patterns) => {
                      setDetectedPatterns(patterns)
                      setSelectedFileId(f.id) // Keep selected
                    }}
                  />
                </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload

