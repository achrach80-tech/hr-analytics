// components/visions/ExportModal.tsx
// Modal d'export production-ready - Simple et efficace

'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileDown, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useExport } from '@/lib/hooks/useExport'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  visionId: string
  visionName: string
}

export default function ExportModal({
  isOpen,
  onClose,
  visionId,
  visionName,
}: ExportModalProps) {
  const { exportElement, isExporting, progress } = useExport()
  
  const [format, setFormat] = useState<'pdf' | 'png'>('pdf')
  const [quality, setQuality] = useState<'standard' | 'high' | 'ultra'>('high')

  // Fermer après succès
  useEffect(() => {
    if (progress.status === 'success') {
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }, [progress.status, onClose])

  const handleExport = async () => {
    const filename = `${visionName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}`
    
    await exportElement(
      'vision-content',
      filename,
      { format, quality, includeHeader: true, includeFooter: true },
      visionId
    )
  }

  const getProgressColor = () => {
    switch (progress.status) {
      case 'success': return 'bg-emerald-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-cyan-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg">
                    <FileDown className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Exporter</h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFormat('pdf')}
                      disabled={isExporting}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        format === 'pdf'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">PDF</div>
                      <div className="text-xs text-slate-400 mt-1">Document</div>
                    </button>
                    <button
                      onClick={() => setFormat('png')}
                      disabled={isExporting}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        format === 'png'
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-sm font-medium text-white">PNG</div>
                      <div className="text-xs text-slate-400 mt-1">Image</div>
                    </button>
                  </div>
                </div>

                {/* Qualité */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Qualité
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'standard' as const, label: 'Standard', time: '1-2s' },
                      { value: 'high' as const, label: 'Haute', time: '2-3s' },
                      { value: 'ultra' as const, label: 'Ultra', time: '3-5s' },
                    ].map((q) => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        disabled={isExporting}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          quality === q.value
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-white">{q.label}</div>
                            <div className="text-xs text-slate-400">{q.time}</div>
                          </div>
                          {quality === q.value && (
                            <div className="w-2 h-2 bg-cyan-500 rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{progress.message}</span>
                      <span className="text-slate-400">{progress.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${progress.progress}%` }}
                        className={`h-full ${getProgressColor()}`}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      {progress.status === 'error' ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : progress.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      )}
                      <span>
                        {progress.status === 'success' ? 'Terminé !' : 'En cours...'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
                <button
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Export...
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}