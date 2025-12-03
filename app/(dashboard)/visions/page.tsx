'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Sparkles, FileText, Download, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function VisionsPage() {
  const router = useRouter()
  const [etablissementId, setEtablissementId] = useState<string | null>(null)
  const [visions, setVisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        
        // Get etablissement from localStorage (token-based auth)
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)
        
        // Get first etablissement
        const { data: etablissements } = await supabase
          .from('etablissements')
          .select('id')
          .eq('entreprise_id', session.company_id)
          .limit(1)

        if (etablissements && etablissements.length > 0) {
          const estabId = etablissements[0].id
          setEtablissementId(estabId)

          // Load visions (OPTIONAL - can be empty)
          const { data: visionsData } = await supabase
            .from('visions')
            .select('*')
            .eq('etablissement_id', estabId)
            .order('created_at', { ascending: false })

          setVisions(visionsData || [])
        }
      } catch (err) {
        console.error('Error loading visions:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleBack = () => {
    router.push('/dashboard')
  }

  const handleCreate = () => {
    router.push('/visions/new')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </button>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Mes Visions
                </h1>
                <p className="text-slate-400 text-sm">
                  Créez vos dashboards personnalisés
                </p>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-cyan-500/25"
            >
              <Plus className="w-5 h-5" />
              Créer une vision
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {visions.length}
                </p>
                <p className="text-sm text-slate-400">
                  Vision{visions.length > 1 ? 's' : ''} créée{visions.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {visions.reduce((sum, v) => sum + (v.layout?.items?.length || 0), 0)}
                </p>
                <p className="text-sm text-slate-400">Items au total</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {visions.reduce((sum, v) => sum + (v.export_count || 0), 0)}
                </p>
                <p className="text-sm text-slate-400">Exports réalisés</p>
              </div>
            </div>
          </div>
        </motion.div>

        {visions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-12 text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Aucune vision créée
            </h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Créez votre première vision personnalisée from scratch.
              Choisissez les KPIs et graphiques qui vous intéressent !
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Créer ma première vision
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visions.map((vision, index) => (
              <motion.div
                key={vision.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-6 cursor-pointer hover:border-cyan-500/50 transition-all"
                onClick={() => router.push(`/visions/${vision.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-1">
                      {vision.nom}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {vision.description || 'Aucune description'}
                    </p>
                  </div>
                  {vision.is_default && (
                    <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg">
                      Par défaut
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{vision.layout?.items?.length || 0} items</span>
                  <span>•</span>
                  <span>{vision.view_count || 0} vues</span>
                  <span>•</span>
                  <span>{vision.export_count || 0} exports</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}