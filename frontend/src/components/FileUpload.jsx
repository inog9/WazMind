import { useState } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function FileUpload({ onUpload, onJobCreated, files }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [uploadSuccess, setUploadSuccess] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadError(null)
      setUploadSuccess(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
      setUploadError(null)
      setUploadSuccess(null)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a file')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setUploadSuccess(`File uploaded successfully! File ID: ${response.data.id}`)
      setFile(null)
      document.getElementById('file-input').value = ''
      onUpload()
    } catch (error) {
      setUploadError(
        error.response?.data?.detail || 'Error uploading file'
      )
    } finally {
      setUploading(false)
    }
  }

  const handleGenerate = async (fileId) => {
    setGenerating(true)
    try {
      await axios.post(`${API_BASE_URL}/api/jobs/generate`, {
        log_file_id: fileId,
      })
      setUploadSuccess('Rule generation job created! Check Jobs tab for status.')
      onJobCreated()
    } catch (error) {
      setUploadError(
        error.response?.data?.detail || 'Error creating generation job'
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (fileId, filename) => {
    setDeletingId(fileId)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      await axios.delete(`${API_BASE_URL}/api/upload/${fileId}`)
      setUploadSuccess(`File "${filename}" deleted.`)
      onUpload()
    } catch (error) {
      setUploadError(
        error.response?.data?.detail || 'Error deleting file'
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Modern Upload Box */}
      <div className="relative">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative bg-slate-900/80 backdrop-blur-xl border-2 rounded-3xl transition-all duration-300 ${
            isDragging
              ? 'border-blue-400 shadow-2xl shadow-blue-500/30 scale-[1.01]'
              : 'border-blue-600/40 hover:border-blue-500/60'
          } ${file ? 'min-h-[400px]' : 'min-h-[350px]'}`}
        >
          {/* Main Content Area */}
          <div 
            className="p-8 cursor-pointer"
            onClick={() => !file && document.getElementById('file-input').click()}
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
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      document.getElementById('file-input').value = ''
                    }}
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
              id="file-input"
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".log,.txt,.json,.csv"
            />
          </div>

          {/* Bottom Action Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700/30 bg-slate-900/60 backdrop-blur-sm rounded-b-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <label
                  htmlFor="file-input"
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-800/80 border border-blue-600/40 rounded-xl text-blue-300 hover:bg-slate-700/80 hover:border-blue-500/60 cursor-pointer transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm font-medium">Upload</span>
                </label>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg shadow-blue-600/30"
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
                <div className="px-3 py-1.5 bg-blue-900/40 border border-blue-600/40 rounded-lg text-xs text-blue-300">
                  Log Files
                </div>
                <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
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
        <div className="bg-slate-800/90 backdrop-blur-sm shadow-2xl rounded-2xl p-8 border border-blue-700/30 hover:shadow-blue-900/50 transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-xl">📁</span>
            </div>
            <h2 className="text-2xl font-bold text-blue-400">
              Uploaded Files
            </h2>
            <span className="bg-blue-900/50 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold border border-blue-600/50">
              {files.length}
            </span>
          </div>
          <div className="space-y-4">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-5 border-2 border-blue-700/30 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-slate-700/50 to-slate-800/50"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-200 text-lg">{f.original_filename}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        <span>💾</span>
                        <span>{(f.file_size / 1024).toFixed(2)} KB</span>
                      </p>
                      <p className="text-sm text-gray-400 flex items-center space-x-1">
                        <span>🕒</span>
                        <span>{new Date(f.uploaded_at).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <button
                    onClick={() => handleDelete(f.id, f.original_filename)}
                    disabled={deletingId === f.id}
                    className="flex items-center space-x-2 px-4 py-2 border border-red-500/40 text-red-300 hover:bg-red-900/40 rounded-xl transition-all duration-200 text-sm font-semibold disabled:opacity-50"
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
                  <button
                    onClick={() => handleGenerate(f.id)}
                    disabled={generating || deletingId === f.id}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-sm font-semibold shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2"
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload

