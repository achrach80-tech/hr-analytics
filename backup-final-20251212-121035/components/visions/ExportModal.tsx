// components/visions/ExportModal.tsx
'use client'

import { useState } from 'react'
import { X, FileDown, Image as ImageIcon, FileText } from 'lucide-react'
import { useExport } from '@/lib/hooks/useExport'
import { visionsApi } from '@/lib/api/visions'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  visionName: string
  visionId: string
}

export default function ExportModal({ isOpen, onClose, visionName, visionId }: ExportModalProps) {
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf')
  const [quality, setQuality] = useState<'presentation' | 'print'>('presentation')
  const { exportToPDF, exportToPNG, isExporting } = useExport()

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      const element = document.getElementById('vision-content')
      if (!element) {
        alert('Contenu introuvable')
        return
      }

      // Increment export count
      await visionsApi.incrementExportCount(visionId)

      if (format === 'pdf') {
        await exportToPDF(
          element,
          `${visionName}_${new Date().toISOString().substring(0, 10)}`,
          quality
        )
      } else {
        await exportToPNG(
          element,
          `${visionName}_${new Date().toISOString().substring(0, 10)}`,
          quality
        )
      }

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Erreur lors de l\'export')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <div>
            <h2 className="text-xl font-bold text-white">Exporter la vision</h2>
            <p className="text-sm text-slate-400 mt-1">{visionName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Format d'export
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'pdf'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <FileText className={`w-6 h-6 mx-auto mb-2 ${
                  format === 'pdf' ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-medium ${
                  format === 'pdf' ? 'text-white' : 'text-slate-400'
                }`}>
                  PDF
                </p>
              </button>

              <button
                onClick={() => setFormat('png')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  format === 'png'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <ImageIcon className={`w-6 h-6 mx-auto mb-2 ${
                  format === 'png' ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                <p className={`text-sm font-medium ${
                  format === 'png' ? 'text-white' : 'text-slate-400'
                }`}>
                  PNG
                </p>
              </button>
            </div>
          </div>

          {/* Quality selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Qualité
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setQuality('presentation')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  quality === 'presentation'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${
                    quality === 'presentation' ? 'text-white' : 'text-slate-400'
                  }`}>
                    Présentation
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    quality === 'presentation'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    1920px
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Optimisé pour PowerPoint et écrans
                </p>
              </button>

              <button
                onClick={() => setQuality('print')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  quality === 'print'
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${
                    quality === 'print' ? 'text-white' : 'text-slate-400'
                  }`}>
                    Impression
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    quality === 'print'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}>
                    2400px
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Haute résolution pour impression
                </p>
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <FileDown className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-sm text-cyan-300">
                <p className="font-medium mb-1">Format 16:9</p>
                <p className="text-xs text-cyan-400/80">
                  Le document sera exporté au format PowerPoint standard
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-cyan-500/20">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Annuler
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Export en cours...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4" />
                Exporter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}