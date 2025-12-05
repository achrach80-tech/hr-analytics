// app/(dashboard)/visions/page.tsx
// Liste des visions enregistrées

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, Eye, Calendar, FileDown, Star, Edit2, 
  Trash2, Copy, Sparkles, AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { visionsApi } from '@/lib/api/visions'
import type { SavedVision } from '@/lib/types/visions'

export default function VisionsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [visions, setVisions] = useState<SavedVision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [etablissementId, setEtablissementId] = useState<string>('')

  // Charger établissement
  useEffect(() => {
    const loadEstablishment = async () => {
      const sessionStr = localStorage.getItem('company_session')
      if (!sessionStr) {
        router.push('/login')
        return
      }

      const session = JSON.parse(sessionStr)
      
      const { data: etablissements } = await supabase
        .from('etablissements')
        .select('id')
        .eq('entreprise_id', session.company_id)
        .limit(1)

      if (etablissements && etablissements.length > 0) {
        setEtablissementId(etablissements[0].id)
      }
    }

    loadEstablishment()
  }, [supabase, router])

  // Charger visions
  useEffect(() => {
    if (!etablissementId) return

    const loadVisions = async () => {
      try {
        setLoading(true)
        const data = await visionsApi.getVisions(etablissementId)
        setVisions(data)
      } catch (err) {
        console.error('Erreur chargement visions:', err)
        setError('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    loadVisions()
  }, [etablissementId])

  const handleDelete = async (visionId: string, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ?`)) return

    try {
      await visionsApi.deleteVision(visionId)
      setVisions(prev => prev.filter(v => v.id !== visionId))
    } catch (error) {
      alert('Erreur lors de la suppression')
    }
  }

  const handleDuplicate = async (visionId: string) => {
    try {
      const duplicated = await visionsApi.duplicateVision(visionId)
      if (duplicated) {
        setVisions(prev => [duplicated, ...prev])
      }
    } catch (error) {
      alert('Erreur lors de la duplication')
    }
  }

  const handleToggleDefault = async (visionId: string) => {
    try {
      await visionsApi.setDefaultVision(visionId, etablissementId)
      
      // Mettre à jour l'état local
      setVisions(prev => prev.map(v => ({
        ...v,
        isDefault: v.id === visionId
      })))
    } catch (error) {
      alert('Erreur lors de la mise à jour')
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const getSectionsCount = (vision: SavedVision) => {
    if (vision.layout?.sections) {
      return vision.layout.sections.length
    }
    if (vision.layout?.items) {
      return vision.layout.items.length
    }
    return 0
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent mb-2">
                Mes Visions
              </h1>
              <p className="text-slate-400">
                Créez et gérez vos exports personnalisés du Dashboard
              </p>
            </div>
            <motion.button
              onClick={() => router.push('/visions/new')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Créer une vision
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Visions créées</p>
                  <p className="text-2xl font-bold text-white">{visions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Exports réalisés</p>
                  <p className="text-2xl font-bold text-white">
                    {visions.reduce((sum, v) => sum + (v.exportCount || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Vision par défaut</p>
                  <p className="text-2xl font-bold text-white">
                    {visions.filter(v => v.isDefault).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Liste des visions */}
        {error ? (
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Erreur</h3>
            <p className="text-red-300">{error}</p>
          </div>
        ) : visions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-12 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Aucune vision pour le moment
            </h2>
            <p className="text-slate-400 mb-6">
              Créez votre première vision pour exporter vos KPIs Dashboard
            </p>
            <motion.button
              onClick={() => router.push('/visions/new')}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Créer ma première vision
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {visions.map((vision, index) => {
              const isDefault = vision.isDefault
              const sectionsCount = getSectionsCount(vision)

              return (
                <motion.div
                  key={vision.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-cyan-500/50 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                          {vision.nom}
                        </h3>
                        {isDefault && (
                          <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-bold rounded-full border border-cyan-500/20">
                            PAR DÉFAUT
                          </span>
                        )}
                      </div>
                      {vision.description && (
                        <p className="text-slate-400 text-sm mb-4">{vision.description}</p>
                      )}
                      <div className="flex items-center gap-6 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Créée le {formatDate(vision.createdAt)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          {sectionsCount} section{sectionsCount > 1 ? 's' : ''}
                        </div>
                        {vision.exportCount > 0 && (
                          <div className="flex items-center gap-2">
                            <FileDown className="w-4 h-4" />
                            {vision.exportCount} export{vision.exportCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => router.push(`/visions/${vision.id}`)}
                        className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleToggleDefault(vision.id)}
                        className={`p-2 rounded-lg transition-all ${
                          isDefault
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800 text-slate-400 hover:text-cyan-400'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={isDefault ? 'Retirer par défaut' : 'Définir par défaut'}
                      >
                        <Star className="w-4 h-4" fill={isDefault ? 'currentColor' : 'none'} />
                      </motion.button>

                      <motion.button
                        onClick={() => router.push(`/visions/${vision.id}/edit`)}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleDuplicate(vision.id)}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-green-400 rounded-lg transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Dupliquer"
                      >
                        <Copy className="w-4 h-4" />
                      </motion.button>

                      <motion.button
                        onClick={() => handleDelete(vision.id, vision.nom)}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}