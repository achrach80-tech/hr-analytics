'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, 
  Zap, Clock, Activity, AlertTriangle, RefreshCw
} from 'lucide-react'

interface ImportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  current_phase: string
  current_message: string
  current_detail?: string
  file_name: string
  created_at: string
  result?: any
  error_message?: string
}

export default function OptimizedImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [currentJob, setCurrentJob] = useState<ImportJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [establishment, setEstablishment] = useState<any>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Load establishment and recent jobs
  useEffect(() => {
    loadInitialData()
  }, [])

  // Real-time job updates
  useEffect(() => {
    if (!currentJob) return
    
    const channel = supabase
      .channel(`import-job-${currentJob.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'import_jobs',
        filter: `id=eq.${currentJob.id}`
      }, (payload) => {
        const updatedJob = payload.new as ImportJob
        setCurrentJob(updatedJob)
        
        // Auto-redirect on completion
        if (updatedJob.status === 'completed') {
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentJob?.id])

  const loadInitialData = async () => {
    try {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)
      
      const { data: companyData } = await supabase
        .from('entreprises')
        .select(`*, etablissements (*)`)
        .eq('id', session.company_id)
        .single()

      if (companyData?.etablissements?.[0]) {
        setEstablishment(companyData.etablissements[0])
        loadRecentJobs(companyData.etablissements[0].id)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const loadRecentJobs = async (establishmentId: string) => {
    const { data } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('etablissement_id', establishmentId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setRecentJobs(data)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const droppedFile = acceptedFiles[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
      setCurrentJob(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024 // 100MB
  })

  const handleImport = async () => {
    if (!file || !establishment) return

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('establishmentId', establishment.id)

      const response = await fetch('/api/import/process', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Import failed')
      }

      // Start tracking the job
      const { data: jobData } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', result.jobId)
        .single()

      if (jobData) {
        setCurrentJob(jobData)
      }

    } catch (error) {
      console.error('Import error:', error)
      setError(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'from-orange-500 to-red-500'
    if (progress < 70) return 'from-yellow-500 to-orange-500'
    return 'from-green-500 to-emerald-500'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'failed': return 'text-red-400'
      case 'processing': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-900/70 to-slate-800/70 border border-purple-500/20 rounded-2xl backdrop-blur-sm mb-6">
            <Zap size={20} className="text-purple-400" />
            <span className="text-purple-400 font-mono text-sm">OPTIMIZED IMPORT v2.0</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            High-Performance HR Import
          </h1>
          
          <p className="text-slate-400 text-lg">
            Background processing • Real-time progress • Up to 100MB files
          </p>
        </div>

        {/* Current Job Progress */}
        {currentJob && (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl flex items-center gap-3">
                <Activity size={24} className="text-purple-400 animate-pulse" />
                Import in Progress: {currentJob.file_name}
              </h3>
              <span className={`px-4 py-2 rounded-lg font-mono text-sm ${getStatusColor(currentJob.status)}`}>
                {currentJob.status.toUpperCase()}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">{currentJob.current_message}</span>
                  <span className="text-purple-400 font-mono">{currentJob.progress}%</span>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getProgressColor(currentJob.progress)} rounded-full transition-all duration-500`}
                    style={{ width: `${currentJob.progress}%` }}
                  />
                </div>
              </div>
              
              {currentJob.current_detail && (
                <p className="text-sm text-slate-400 text-center">{currentJob.current_detail}</p>
              )}

              {/* Success/Error Messages */}
              {currentJob.status === 'completed' && currentJob.result && (
                <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                    <CheckCircle size={20} />
                    Import Completed Successfully!
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Employees:</span>
                      <span className="text-white ml-2 font-mono">{currentJob.result.recordsImported?.employees || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">KPIs:</span>
                      <span className="text-white ml-2 font-mono">{currentJob.result.snapshotsCalculated || 0}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Time:</span>
                      <span className="text-white ml-2 font-mono">{(currentJob.result.processingTime / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                  <p className="text-center text-purple-400 mt-4">
                    Redirecting to dashboard in 3 seconds...
                  </p>
                </div>
              )}

              {currentJob.status === 'failed' && (
                <div className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <XCircle size={20} />
                    Import Failed
                  </div>
                  <p className="text-red-300 text-sm mt-2">{currentJob.error_message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Upload (only show if no job running) */}
        {!currentJob && (
          <>
            {/* Drop Zone */}
            <div
              {...getRootProps()}
              className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-500 ${
                isDragActive 
                  ? 'border-purple-400 bg-purple-500/10 scale-[1.02]' 
                  : file
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/30'
              }`}
            >
              <input {...getInputProps()} />
              
              {file ? (
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                    <FileSpreadsheet size={40} className="text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2">{file.name}</h3>
                    <p className="text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <Upload size={64} className="text-slate-500 mx-auto" />
                  <div>
                    <h3 className="text-white font-bold text-2xl mb-2">
                      {isDragActive ? 'Drop your Excel file here' : 'Drag & drop your Excel file'}
                    </h3>
                    <p className="text-slate-400">or click to browse</p>
                  </div>
                  <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                    <span>XLSX/XLS</span>
                    <span>•</span>
                    <span>Up to 100MB</span>
                    <span>•</span>
                    <span>Background processing</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-6 bg-red-900/20 border border-red-500/30 rounded-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="text-red-400" />
                  <div className="flex-1">
                    <p className="text-red-400 font-bold">Import Error</p>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Import Button */}
            {file && !currentJob && (
              <div className="text-center">
                <button
                  onClick={handleImport}
                  disabled={isSubmitting || !establishment}
                  className="px-12 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 mx-auto disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Starting Import...
                    </>
                  ) : (
                    <>
                      <Zap size={24} />
                      Start Background Import
                    </>
                  )}
                </button>
                <p className="text-sm text-slate-500 mt-4">
                  ✓ Processes in background • ✓ Real-time progress • ✓ Auto KPI calculation
                </p>
              </div>
            )}
          </>
        )}

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
            <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" />
              Recent Imports
            </h3>
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                  <div>
                    <p className="text-white font-medium">{job.file_name}</p>
                    <p className="text-slate-400 text-sm">{new Date(job.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                      job.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {job.status}
                    </span>
                    {job.status === 'processing' && (
                      <button
                        onClick={() => setCurrentJob(job)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <RefreshCw size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}