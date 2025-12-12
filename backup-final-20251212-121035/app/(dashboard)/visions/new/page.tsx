// app/(dashboard)/visions/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { visionsApi } from '@/lib/api/visions'
import { useCurrentEtablissement } from '@/lib/hooks/useCurrentEtablissement'
import { ArrowLeft, Save, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const PRESET_COLORS = [
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#10b981', label: 'Vert' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Rouge' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#14b8a6', label: 'Teal' }
]

export default function NewVisionPage() {
  const router = useRouter()
  const { etablissementId, loading: etabLoading, error: etabError } = useCurrentEtablissement()

  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#06b6d4')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!nom.trim()) {
      setError('Le nom est requis')
      return
    }

    if (nom.trim().length < 3) {
      setError('Le nom doit contenir au moins 3 caractères')
      return
    }

    if (!etablissementId) {
      setError('Établissement non trouvé')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const vision = await visionsApi.create({
        nom: nom.trim(),
        description: description.trim() || null,
        color,
        etablissement_id: etablissementId,
        template: {
          canvas: {
            width: 1920,
            height: 1080,
            format: '16:9',
            backgroundColor: '#0f172a'
          },
          components: []
        }
      })

      // Rediriger vers le builder
      router.push(`/visions/builder?visionId=${vision.id}`)

    } catch (err) {
      console.error('Erreur création vision:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
      setIsSubmitting(false)
    }
  }

  if (etabLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (etabError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-400">{etabError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 px-4 py-2 bg-slate-900/50 hover:bg-slate-900/80 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg text-slate-400 hover:text-cyan-400 flex items-center gap-2 transition-all"
        >
          <ArrowLeft size={18} />
          Retour
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>
          
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-3xl p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl">
                  <Sparkles size={32} className="text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Nouvelle Vision
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Créez votre rapport personnalisé
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                  Nom de la vision *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Rapport RH Mensuel"
                  className="w-full px-4 py-3 bg-slate-950/50 border border-cyan-500/20 focus:border-cyan-500/50 rounded-xl text-cyan-400 placeholder-slate-500 focus:outline-none transition-colors"
                  maxLength={100}
                  required
                />
                <div className="mt-1 text-xs text-slate-500 text-right">
                  {nom.length}/100 caractères
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-2 uppercase tracking-wider">
                  Description (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez l'objectif de cette vision..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-cyan-500/20 focus:border-cyan-500/50 rounded-xl text-cyan-400 placeholder-slate-500 focus:outline-none transition-colors resize-none"
                  maxLength={500}
                />
                <div className="mt-1 text-xs text-slate-500 text-right">
                  {description.length}/500 caractères
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
                  Couleur de la vision
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={`
                        relative w-full aspect-square rounded-xl transition-all
                        ${color === preset.value
                          ? 'ring-4 ring-cyan-500 ring-offset-4 ring-offset-slate-950 scale-110'
                          : 'hover:scale-105'
                        }
                      `}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    >
                      {color === preset.value && (
                        <div className="absolute inset-0 flex items-center justify-center text-white font-bold">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom color */}
                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm text-slate-400">Couleur personnalisée:</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border-2 border-cyan-500/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-300 font-medium transition-all"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !nom.trim() || nom.trim().length < 3}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
                >
                  <Save size={20} />
                  {isSubmitting ? 'Création...' : 'Créer & Éditer'}
                </button>
              </div>
            </form>

            {/* Info box */}
            <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <p className="text-cyan-400 text-sm flex items-start gap-2">
                <Sparkles size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Après la création, vous serez redirigé vers le builder pour concevoir votre vision avec un système drag & drop intuitif.
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}