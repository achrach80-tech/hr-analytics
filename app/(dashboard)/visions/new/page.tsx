// app/(dashboard)/visions/new/page.tsx
// ✅ CORRIGÉ: Utilise company_session comme les autres pages

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { visionsApi } from '@/lib/api/visions'
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
  const supabase = createClient()
  const mountedRef = useRef(true)

  const [etablissementId, setEtablissementId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#06b6d4')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialisation - même logique que Dashboard
  useEffect(() => {
    mountedRef.current = true

    const initializeData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Vérifier la session
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)

        // 2. Charger entreprise + établissements
        const { data: companyData, error: companyError } = await supabase
          .from('entreprises')
          .select(`
            id,
            etablissements (id, nom, is_headquarters)
          `)
          .eq('id', session.company_id)
          .single()

        if (companyError) {
          throw new Error('Impossible de charger l\'entreprise')
        }

        if (!mountedRef.current) return

        const establishments = companyData.etablissements || []
        
        if (establishments.length === 0) {
          throw new Error('Aucun établissement configuré')
        }

        // 3. Sélectionner établissement par défaut
        const defaultEst = establishments.find((e: { id: string; nom: string; is_headquarters: boolean }) => e.is_headquarters) || establishments[0]
        setEtablissementId(defaultEst.id)

      } catch (err) {
        if (!mountedRef.current) return
        console.error('Erreur initialisation:', err)
        setError(err instanceof Error ? err.message : 'Erreur d\'initialisation')
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    initializeData()

    return () => {
      mountedRef.current = false
    }
  }, [supabase, router])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !etablissementId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/visions')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold"
          >
            Retour aux Visions
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/visions')}
            className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Nouvelle Vision
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Créez un nouveau rapport personnalisé
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8"
        >
          {/* Erreur */}
          {error && etablissementId && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Nom */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de la vision <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Rapport mensuel RH"
              className="w-full px-4 py-3 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement cette vision..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Couleur */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Couleur
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setColor(preset.value)}
                  className={`w-full aspect-square rounded-lg transition-all ${
                    color === preset.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.value }}
                  disabled={isSubmitting}
                  title={preset.label}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/visions')}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold transition-all"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !nom.trim()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Création...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Créer & Éditer
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Info */}
        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-cyan-400 font-semibold text-sm mb-1">
                Prochaine étape
              </p>
              <p className="text-slate-400 text-sm">
                Après création, vous serez redirigé vers le builder pour ajouter vos composants (KPIs, graphiques, etc.)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}