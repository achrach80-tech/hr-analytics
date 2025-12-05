// components/visions/ExportModal.tsx
'use client'

import { useState } from 'react'
import { X, FileDown, Loader2, CheckCircle2, AlertCircle, FileImage, Monitor, Printer } from 'lucide-react'
import { useExport, type ExportFormat, type ExportQuality } from '@/lib/hooks/useExport'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  visionName: string
  visionId?: string
}

export default function ExportModal({
  isOpen,
  onClose,
  visionName,
  visionId
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf')
  const [quality, setQuality] = useState<ExportQuality>('presentation')

  const { exportElement, isExporting, progress } = useExport()

  if (!isOpen) return null

  const handleExport = async () => {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${visionName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}`
    
    await exportElement('vision-content', filename, {
      format,
      quality
    }, visionId)
  }

  const handleClose = () => {
    if (!isExporting || progress.status === 'success' || progress.status === 'error') {
      onClose()
    }
  }

  const getStatusIcon = () => {
    if (progress.status === 'success') return <CheckCircle2 className="w-12 h-12 text-green-500" />
    if (progress.status === 'error') return <AlertCircle className="w-12 h-12 text-red-500" />
    return <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
  }

  const getStatusColor = () => {
    if (progress.status === 'success') return 'from-green-500 to-emerald-500'
    if (progress.status === 'error') return 'from-red-500 to-pink-500'
    return 'from-cyan-500 via-blue-500 to-purple-500'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/80 to-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
              <FileDown className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export PowerPoint</h2>
              <p className="text-sm text-slate-400">{visionName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting && progress.status !== 'success' && progress.status !== 'error'}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isExporting || progress.status === 'success' || progress.status === 'error' ? (
            // Mode export actif
            <div className="space-y-6">
              <div className="flex items-center justify-center py-8">
                {getStatusIcon()}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-medium">Progression</span>
                  <span className={`font-bold ${
                    progress.status === 'success' ? 'text-green-400' :
                    progress.status === 'error' ? 'text-red-400' :
                    'text-cyan-400'
                  }`}>
                    {progress.progress}%
                  </span>
                </div>
                
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                  <div
                    className={`h-full transition-all duration-500 bg-gradient-to-r ${getStatusColor()}`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
                
                <p className="text-center text-sm text-slate-300 font-medium min-h-[20px]">
                  {progress.message}
                </p>
              </div>

              {progress.status === 'success' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
                  <p className="text-green-400 text-sm font-medium">
                    ✅ Export réussi ! {format === 'png' ? 'Images téléchargées.' : 'PDF téléchargé.'}
                  </p>
                </div>
              )}

              {progress.status === 'error' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-400 text-sm font-medium text-center">
                    ❌ {progress.message}
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Mode configuration
            <div className="space-y-6">
              {/* Format selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Format d'export
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('pdf')}
                    className={`group relative p-4 rounded-xl border-2 transition-all ${
                      format === 'pdf'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileDown className={`w-8 h-8 ${
                        format === 'pdf' ? 'text-cyan-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        format === 'pdf' ? 'text-white' : 'text-slate-300'
                      }`}>
                        PDF 16:9
                      </span>
                      <span className="text-xs text-slate-400">
                        PowerPoint ready
                      </span>
                    </div>
                    {format === 'pdf' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setFormat('png')}
                    className={`group relative p-4 rounded-xl border-2 transition-all ${
                      format === 'png'
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileImage className={`w-8 h-8 ${
                        format === 'png' ? 'text-purple-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        format === 'png' ? 'text-white' : 'text-slate-300'
                      }`}>
                        PNG Slides
                      </span>
                      <span className="text-xs text-slate-400">
                        1 image/section
                      </span>
                    </div>
                    {format === 'png' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-purple-400" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Quality selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Qualité
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setQuality('presentation')}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      quality === 'presentation'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Monitor className={`w-7 h-7 ${
                        quality === 'presentation' ? 'text-cyan-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        quality === 'presentation' ? 'text-white' : 'text-slate-300'
                      }`}>
                        Présentation
                      </span>
                      <span className="text-xs text-slate-400">
                        1920px • Projection
                      </span>
                    </div>
                    {quality === 'presentation' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => setQuality('print')}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      quality === 'print'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Printer className={`w-7 h-7 ${
                        quality === 'print' ? 'text-blue-400' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm font-medium ${
                        quality === 'print' ? 'text-white' : 'text-slate-300'
                      }`}>
                        Impression
                      </span>
                      <span className="text-xs text-slate-400">
                        2400px • HD
                      </span>
                    </div>
                    {quality === 'print' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="text-white font-semibold">
                      Export professionnel
                    </p>
                    <ul className="text-slate-300 space-y-1 text-xs">
                      <li>✓ Format 16:9 PowerPoint</li>
                      <li>✓ Sections complètes (pas de coupure)</li>
                      <li>✓ Couleurs préservées</li>
                      <li>✓ Haute résolution</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-cyan-500/20 bg-slate-900/50">
          <button
            onClick={handleClose}
            disabled={isExporting && progress.status !== 'success' && progress.status !== 'error'}
            className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {progress.status === 'success' || progress.status === 'error' ? 'Fermer' : 'Annuler'}
          </button>
          
          {progress.status !== 'success' && progress.status !== 'error' && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
            >
              {isExporting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Export en cours...
                </span>
              ) : (
                `Exporter ${format === 'pdf' ? 'PDF' : 'PNG'}`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}