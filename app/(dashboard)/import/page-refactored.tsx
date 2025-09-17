'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import { useImport } from '@/lib/import/hooks/useImport'
import { 
  Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle,
  Download, Building2, ArrowRight, X, Database, Server, Sparkles,
  TrendingUp, RefreshCw, Zap, Activity, FileCheck, BookOpen,
  ChevronRight, ChevronLeft, Settings, AlertTriangle, FileX,
  ShieldAlert, Clock, Users, ChevronDown, ChevronUp, Target,
  MapPin, Search, Filter, Copy, ExternalLink, Info, Bug, Wrench,
  Eye, EyeOff, History, Save, Shield, BarChart3, Cpu, Terminal,
  Code2, Gauge, HardDrive, Binary, Menu, Calendar, CheckSquare,
  FileDown, Layers, Package, PlayCircle, Hash, CheckCircle2
} from 'lucide-react'

// ==========================================
// COMPONENTS
// ==========================================

interface Company {
  id: string
  nom: string
  subscription_plan: string
  ai_features_enabled?: boolean
  max_establishments: number
  max_employees: number
}

interface Establishment {
  id: string
  entreprise_id: string
  nom: string
  code_etablissement: string
  is_default: boolean
  is_headquarters: boolean
  statut: string
}

const DropZone: React.FC<{
  onFileSelect: (file: File) => void
  file: File | null
  disabled?: boolean
}> = ({ onFileSelect, file, disabled }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) onFileSelect(acceptedFiles[0])
    },
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled
  })

  return (
    <div
      {...getRootProps()}
      className={`relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-500 ${
        isDragActive 
          ? 'border-purple-400 bg-purple-500/10 scale-[1.02]' 
          : file
          ? 'border-green-500 bg-green-500/5'
          : disabled
          ? 'border-gray-600 bg-gray-800/30 cursor-not-allowed'
          : 'border-slate-600 hover:border-slate-500 bg-slate-900/30'
      }`}
    >
      <input {...getInputProps()} />
      
      {file ? (
        <div className="space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck size={40} className="text-white" />
          </div>
          
          <div>
            <h3 className="text-white font-bold text-2xl mb-2">{file.name}</h3>
            <p className="text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <Upload size={64} className={disabled ? "text-slate-600" : "text-slate-500"} />
          <div>
            <h3 className={`font-bold text-2xl mb-2 ${disabled ? "text-slate-600" : "text-white"}`}>
              {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier Excel'}
            </h3>
            <p className={disabled ? "text-slate-600" : "text-slate-400"}>
              {disabled ? 'Import en cours...' : 'ou cliquez pour sélectionner'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>XLSX/XLS</span>
            <span>•</span>
            <span>Max 50MB</span>
            <span>•</span>
            <span>5 onglets requis</span>
          </div>
        </div>
      )}
    </div>
  )
}

const ProgressTracker: React.FC<{
  progress: any
  onCancel: () => void
}> = ({ progress, onCancel }) => {
  if (!progress) return null

  return (
    <div className="mt-8 p-8 bg-slate-900/50 rounded-2xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-bold text-xl flex items-center gap-3">
          <Cpu size={24} className="text-purple-400 animate-spin" />
          Import en cours
        </h3>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400"
        >
          Annuler
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{progress.step}</span>
            <span className="text-purple-400 font-mono">{progress.percentage}%</span>
          </div>
          <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
        
        {progress.detail && (
          <p className="text-sm text-slate-400 text-center">{progress.detail}</p>
        )}
      </div>
    </div>
  )
}

const ImportSidebar: React.FC<{
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  logs: Array<{ timestamp: string; message: string; type: string }>
  onDownloadTemplate: () => void
}> = ({ sidebarOpen, setSidebarOpen, logs, onDownloadTemplate }) => {
  return (
    <div className={`${sidebarOpen ? 'w-80' : 'w-20'} transition-all duration-300 bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-xl border-r border-slate-700/50`}>
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <h3 className={`text-white font-bold ${sidebarOpen ? 'text-xl' : 'text-sm'} transition-all`}>
            {sidebarOpen ? 'Outils d\'Import' : 'Tools'}
          </h3>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700/50 rounded-lg"
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Template download */}
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <FileSpreadsheet size={20} className="text-green-400" />
            {sidebarOpen && <span className="text-green-400 font-medium">Template Excel</span>}
          </div>
          {sidebarOpen && (
            <button
              onClick={onDownloadTemplate}
              className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Télécharger
            </button>
          )}
        </div>

        {/* Import logs */}
        {sidebarOpen && logs.length > 0 && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Terminal size={16} className="text-purple-400" />
              Journal d'import
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs font-mono">
              {logs.slice(-10).map((log, idx) => (
                <div key={idx} className={`${
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'error' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {log.timestamp} {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick guide */}
        {sidebarOpen && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <BookOpen size={16} className="text-cyan-400" />
              Guide rapide
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Formats dates: JJ/MM/AAAA</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>5 onglets obligatoires</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>Import par batch de 100</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={12} className="text-green-400 mt-0.5" />
                <span>KPIs calculés automatiquement</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const ErrorDisplay: React.FC<{
  error: string
  onDismiss: () => void
}> = ({ error, onDismiss }) => {
  return (
    <div className="mb-8 p-6 bg-red-900/20 border border-red-500/30 rounded-2xl">
      <div className="flex items-center gap-3">
        <XCircle size={24} className="text-red-400" />
        <div className="flex-1">
          <p className="text-red-400 font-bold">Erreur</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
        <button onClick={onDismiss} className="p-2 hover:bg-red-500/20 rounded-lg">
          <X size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  )
}

const SuccessDisplay: React.FC<{
  result: any
  onNewImport: () => void
  onViewDashboard: () => void
}> = ({ result, onNewImport, onViewDashboard }) => {
  return (
    <div className="mt-8 p-10 bg-green-900/20 border border-green-500/30 rounded-2xl text-center">
      <CheckCircle size={64} className="text-green-400 mx-auto mb-4" />
      <h3 className="text-2xl font-bold text-white mb-2">Import réussi!</h3>
      <p className="text-green-400 mb-6">
        {result.recordsImported.employees} employés, {result.recordsImported.remunerations} rémunérations importés
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onViewDashboard}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium"
        >
          Voir le Dashboard
        </button>
        <button
          onClick={onNewImport}
          className="px-6 py-3 bg-slate-700 text-white rounded-xl font-medium"
        >
          Nouvel Import
        </button>
      </div>
    </div>
  )
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function RefactoredImportPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const supabase = createClient()
  const router = useRouter()
  
  // Use the import hook
  const {
    file,
    status,
    progress,
    error,
    logs,
    importResult,
    handleFileSelect,
    clearFile,
    startImport,
    cancelImport,
    clearError,
    downloadTemplate
  } = useImport()

  // Initialize company data
  useEffect(() => {
    initializeCompany()
  }, [])

  const initializeCompany = async () => {
    try {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)
      
      const { data: companyData, error: companyError } = await supabase
        .from('entreprises')
        .select(`*, etablissements (*)`)
        .eq('id', session.company_id)
        .single()

      if (companyError) throw companyError

      setCompany(companyData as Company)
      const establishmentsData = companyData.etablissements || []
      setEstablishments(establishmentsData)
      
      const defaultEstablishment = establishmentsData.find((e: any) => e.is_headquarters) || establishmentsData[0]
      if (defaultEstablishment) {
        setSelectedEstablishment(defaultEstablishment as Establishment)
      }
    } catch (error) {
      console.error('Initialization error:', error)
    }
  }

  const handleImportStart = async () => {
    if (!selectedEstablishment) {
      alert('Aucun établissement sélectionné')
      return
    }
    
    try {
      await startImport(selectedEstablishment.id)
    } catch (error) {
      console.error('Import error:', error)
    }
  }

  const canStartImport = file && selectedEstablishment && status === 'idle'
  const isProcessing = status === 'processing'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-950 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }} />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full filter blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <ImportSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          logs={logs}
          onDownloadTemplate={downloadTemplate}
        />

        {/* Main content */}
        <div className="flex-1 container max-w-6xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-900/70 to-slate-800/70 border border-purple-500/20 rounded-2xl backdrop-blur-sm mb-6">
              <Database size={20} className="text-purple-400" />
              <span className="text-purple-400 font-mono text-sm">IMPORT SYSTEM v4.0</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Import de Données RH
            </h1>
            
            <p className="text-slate-400 text-lg">
              Importez vos données Excel pour générer automatiquement vos KPIs
            </p>

            {company && selectedEstablishment && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                  <span className="text-slate-300 text-sm">{company.nom}</span>
                </div>
                <div className="px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700">
                  <span className="text-slate-300 text-sm">{selectedEstablishment.nom}</span>
                </div>
              </div>
            )}
          </div>

          {/* Error display */}
          {error && <ErrorDisplay error={error} onDismiss={clearError} />}

          {/* Success display */}
          {status === 'success' && importResult && (
            <SuccessDisplay
              result={importResult}
              onNewImport={clearFile}
              onViewDashboard={() => router.push('/dashboard')}
            />
          )}

          {/* Main import interface */}
          {status !== 'success' && (
            <>
              {/* Drop zone */}
              <DropZone
                onFileSelect={handleFileSelect}
                file={file}
                disabled={isProcessing}
              />

              {/* Progress tracker */}
              {progress && <ProgressTracker progress={progress} onCancel={cancelImport} />}

              {/* Import button */}
              {canStartImport && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleImportStart}
                    className="px-12 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 mx-auto"
                  >
                    <Zap size={24} />
                    Lancer l'import
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}