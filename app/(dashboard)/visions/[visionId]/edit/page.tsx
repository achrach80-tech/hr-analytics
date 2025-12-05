// app/(dashboard)/visions/[visionId]/edit/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { visionsApi } from '@/lib/api/visions'
import type { SavedVision } from '@/lib/types/visions'

const AVAILABLE_SECTIONS = [
  { id: 'workforce', label: 'Effectif & Mouvements', description: 'ETP, mouvements, turnover' },
  { id: 'payroll', label: 'Masse Salariale', description: 'Salaires, charges, waterfall' },
  { id: 'absences', label: 'Absences', description: 'Taux, jours, fréquence' },
  { id: 'demographics', label: 'Démographie', description: 'Âge, ancienneté, genre' }
]

export default function EditVisionPage() {
  const params = useParams()
  const router = useRouter()
  const visionId = params.visionId as string

  const [vision, setVision] = useState<SavedVision | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  useEffect(() => {
    async function loadVision() {
      try {
        const data = await visionsApi.getVision(visionId)
        if (!data) {
          throw new Error('Vision introuvable')
        }
        setVision(data)
        setNom(data.nom)
        setDescription(data.description || '')
        setSelectedSections(data.layout?.sections || [])
      } catch (error) {
        console.error('Erreur:', error)
        alert('Vision introuvable')
        router.push('/visions')
      } finally {
        setLoading(false)
      }
    }

    loadVision()
  }, [visionId, router])

  const handleToggleSection = (sectionId: string) => {
    setSelectedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(s => s !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSave = async () => {
    if (!nom.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    if (selectedSections.length === 0) {
      alert('Sélectionnez au moins une section')
      return
    }

    setSaving(true)

    try {
      await visionsApi.updateVision(visionId, {
        nom: nom.trim(),
        description: description.trim() || null,
        layout: {
          sections: selectedSections
        }
      } as any)

      router.push(`/visions/${visionId}`)
    } catch (error: any) {
      console.error('Erreur:', error)
      alert(error.message || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/visions/${visionId}`)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Modifier la vision</h1>
            <p className="text-slate-400 text-sm">Personnalisez votre vision</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 space-y-6">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de la vision *
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Reporting Mensuel"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez cette vision..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Sections */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Sections à inclure * ({selectedSections.length}/4)
            </label>
            <div className="space-y-3">
              {AVAILABLE_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleToggleSection(section.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedSections.includes(section.id)
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedSections.includes(section.id)
                        ? 'border-cyan-500 bg-cyan-500'
                        : 'border-slate-600'
                    }`}>
                      {selectedSections.includes(section.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{section.label}</p>
                      <p className="text-sm text-slate-400">{section.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              onClick={() => router.push(`/visions/${visionId}`)}
              disabled={saving}
              className="px-6 py-2 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !nom.trim() || selectedSections.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}