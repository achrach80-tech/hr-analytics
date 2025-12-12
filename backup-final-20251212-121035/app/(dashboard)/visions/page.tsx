// app/(dashboard)/visions/page.tsx
// ✅ Même logique que Dashboard - Utilise company_session

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { visionsApi, type Vision } from '@/lib/api/visions'
import { Plus, Eye, Edit, Trash2, Download, LayoutGrid } from 'lucide-react'
import { motion } from 'framer-motion'

export default function VisionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const mountedRef = useRef(true)
  
  const [etablissementId, setEtablissementId] = useState<string | null>(null)
  const [visions, setVisions] = useState<Vision[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialisation - même logique que Dashboard
  useEffect(() => {
    mountedRef.current = true

    const initializeData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Vérifier la session (comme Dashboard)
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)

        // 2. Charger l'entreprise et établissements (comme Dashboard)
        const { data: companyData, error: companyError } = await supabase
          .from('entreprises')
          .select(`
            id,
            nom,
            etablissements (
              id,
              nom,
              is_headquarters
            )
          `)
          .eq('id', session.company_id)
          .single()

        if (companyError) {
          throw new Error('Impossible de charger les informations de l\'entreprise')
        }

        if (!mountedRef.current) return

        const establishments = companyData.etablissements || []
        
        if (establishments.length === 0) {
          throw new Error('Aucun établissement configuré pour votre entreprise')
        }

        // 3. Sélectionner l'établissement par défaut (comme Dashboard)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultEst = establishments.find((e: any) => e.is_headquarters) || establishments[0]
        setEtablissementId(defaultEst.id)

        // 4. Charger les visions
        const data = await visionsApi.getAll(defaultEst.id)
        
        if (!mountedRef.current) return
        
        setVisions(data)
        
      } catch (err) {
        if (!mountedRef.current) return
        console.error('Erreur initialisation visions:', err)
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
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

  const handleDelete = async (visionId: string, visionName: string) => {
    if (!confirm(`Supprimer la vision "${visionName}" ?`)) return

    try {
      await visionsApi.delete(visionId)
      setVisions(visions.filter(v => v.id !== visionId))
    } catch (err) {
      console.error('Erreur suppression:', err)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement des visions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold transition-all"
          >
            Retour au Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
              Mes Visions
            </h1>
            <p className="text-slate-400">
              Créez et gérez vos rapports personnalisés
            </p>
          </div>

          <button
            onClick={() => router.push('/visions/new')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-white font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
          >
            <Plus size={20} />
            Nouvelle Vision
          </button>
        </div>

        {/* Visions grid */}
        {visions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">📊</div>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">
              Aucune vision créée
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Créez votre première vision personnalisée pour générer des rapports sur mesure
            </p>
            <button
              onClick={() => router.push('/visions/new')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-white font-semibold inline-flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/25"
            >
              <Plus size={24} />
              Créer ma première vision
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visions.map((vision, index) => {
              const componentCount = vision.template?.components?.length || 0

              return (
                <motion.div
                  key={vision.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-6 hover:border-cyan-500/40 transition-all">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-cyan-400 mb-1 line-clamp-1">
                          {vision.nom}
                        </h3>
                        {vision.description && (
                          <p className="text-sm text-slate-400 line-clamp-2">
                            {vision.description}
                          </p>
                        )}
                      </div>
                      
                      {vision.is_default && (
                        <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-purple-400 text-xs font-semibold">
                          Défaut
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-1 text-slate-400">
                        <LayoutGrid size={16} />
                        <span>{componentCount} composant{componentCount > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Eye size={16} />
                        <span>{vision.view_count || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <Download size={16} />
                        <span>{vision.export_count || 0}</span>
                      </div>
                    </div>

                    {/* Color indicator */}
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: vision.color }}
                      />
                      <span className="text-xs text-slate-500">
                        {new Date(vision.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/visions/${vision.id}`)}
                        className="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-lg text-cyan-400 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <Eye size={16} />
                        Voir
                      </button>
                      
                      <button
                        onClick={() => router.push(`/visions/builder?visionId=${vision.id}`)}
                        className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-400 font-medium text-sm flex items-center justify-center gap-2 transition-all"
                      >
                        <Edit size={16} />
                        Éditer
                      </button>
                      
                      <button
                        onClick={() => handleDelete(vision.id, vision.nom)}
                        className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 rounded-lg text-red-400 transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
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