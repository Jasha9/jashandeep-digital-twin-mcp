'use client'

import { useState } from 'react'

interface UploadResult {
  success: boolean
  message: string
  uploaded?: number
}

export default function AdminUpload() {
  const [isUploading, setIsUploading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)

  const handleUpload = async () => {
    setIsUploading(true)
    setResult(null)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upload' })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all digital twin data?')) {
      return
    }

    setIsClearing(true)
    setResult(null)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Clear failed'
      })
    } finally {
      setIsClearing(false)
    }
  }



  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={handleUpload}
            disabled={isUploading || isClearing}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? '⏳ Uploading...' : '📤 Upload Digital Twin Data'}
          </button>
          
          <button
            onClick={handleClear}
            disabled={isUploading || isClearing}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isClearing ? '⏳ Clearing...' : '🗑️ Clear Data'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {result.success ? '✅' : '❌'}
              </span>
              <span>{result.message}</span>
            </div>
            {result.uploaded && (
              <div className="mt-2 text-sm">
                Successfully uploaded {result.uploaded} content chunks
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Make sure digitaltwin.json exists in the workspace root</li>
          <li>• Upload will add/update your digital twin data in the vector database</li>
          <li>• Clear will remove all digital twin vectors (dt- prefix)</li>
          <li>• Test the connection using the chat interface after uploading</li>
        </ul>
      </div>
    </div>
  )
}