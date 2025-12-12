// app/(dashboard)/visions/builder/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { visionsApi } from '@/lib/api/visions'
import { useBuilderStore } from '@/lib/store/builderStore'
import { VisionCanvas } from '@/components/builder/VisionCanvas'
import { ComponentLibrary } from '@/components/builder/ComponentLibrary'
import PropertiesPanel from '@/components/builder/PropertiesPanel'
import { Toolbar } from '@/components/builder/Toolbar'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function BuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const visionId = searchParams.get('visionId')

  const { loadTemplate, getExportData } = useBuilderStore()

  const [vision, setVision] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load vision on mount
  useEffect(() => {
    async function loadVision() {
      if (!visionId) {
        setError('ID de vision manquant')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await visionsApi.getById(visionId)
        setVision(data)

        // Load template into builder
        if (data.template) {
          loadTemplate(
            data.template.components || [],
            data.template.canvas || {
              width: 1920,
              height: 1080,
              format: '16:9',
              backgroundColor: '#0f172a'
            }
          )
        }

        setLoading(false)
      } catch (err) {
        console.error('Erreur chargement vision:', err)
        setError('Impossible de charger la vision')
        setLoading(false)
      }
    }

    loadVision()
  }, [visionId, loadTemplate])

  const handleSave = async () => {
    if (!visionId || !vision) return

    try {
      setSaving(true)
      const exportData = getExportData()

      await visionsApi.update(visionId, {
        template: {
          canvas: exportData.canvas,
          components: exportData.components
        }
      })

      // Show success feedback
      const btn = document.querySelector('[data-save-btn]')
      if (btn) {
        btn.textContent = '✓ Sauvegardé'
        setTimeout(() => {
          btn.textContent = 'Sauvegarder'
        }, 2000)
      }

    } catch (err) {
      console.error('Erreur sauvegarde:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (confirm('Quitter sans sauvegarder ?')) {
      router.push('/visions')
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement du builder...</p>
        </div>
      </div>
    )
  }

  if (error || !vision) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-400 mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{error || 'Vision introuvable'}</p>
          <button
            onClick={() => router.push('/visions')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold inline-flex items-center gap-2 transition-all"
          >
            <ArrowLeft size={20} />
            Retour aux visions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header - Vision info */}
      <div className="h-14 bg-slate-900/95 border-b border-cyan-500/20 flex items-center justify-between px-6 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
            title="Retour"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-lg font-bold text-cyan-400">
              {vision.nom}
            </h1>
            {vision.description && (
              <p className="text-xs text-slate-400 line-clamp-1">
                {vision.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: vision.color }}
            title="Couleur de la vision"
          />
          <span className="text-xs text-slate-500">
            ID: {visionId?.slice(0, 8)}...
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Toolbar 
        onSave={handleSave} 
        isSaving={saving}
        onPreview={() => router.push(`/visions/${visionId}`)}
      />

      {/* Main content - Canvas + Sidebars */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Component library */}
        <ComponentLibrary />

        {/* Center - Canvas */}
        <div className="flex-1">
          <VisionCanvas />
        </div>

        {/* Right sidebar - Properties */}
        <PropertiesPanel />
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-cyan-500/20 rounded-lg backdrop-blur-sm">
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span><kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-400">Ctrl+Z</kbd> Annuler</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-400">Ctrl+Y</kbd> Refaire</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-400">Suppr</kbd> Supprimer</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-400">Ctrl+S</kbd> Sauvegarder</span>
        </div>
      </div>

      {/* Keyboard event listeners */}
      <KeyboardShortcuts onSave={handleSave} />
    </div>
  )
}

// Component to handle keyboard shortcuts
function KeyboardShortcuts({ onSave }: { onSave: () => void }) {
  const { undo, redo, deleteComponent, selectedId } = useBuilderStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z - Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault()
        redo()
      }

      // Delete - Remove selected component
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault()
        deleteComponent(selectedId)
      }

      // Ctrl+S - Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, deleteComponent, selectedId, onSave])

  return null
}