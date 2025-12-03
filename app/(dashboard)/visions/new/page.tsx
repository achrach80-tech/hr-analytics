'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Save, X, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { visionsApi } from '@/lib/api/visions'
import { VisionItemRenderer } from '@/components/visions/VisionItemRenderer'

// Données fictives pour la prévisualisation
const MOCK_DASHBOARD_DATA = {
  workforce: {
    etpTotal: 145.5,
    etpActif: 142.0,
    etpInactif: 3.5,
    variationM1Pct: 2.3,
    variationN1Pct: 5.8,
    tauxTurnover: 8.5,
    entreesMois: 5,
    sortiesMois: 3,
    turnoverMensuel: 1.4,
    effectifMoyen: 145.5,
    ageGroups: [
      { range: '<25', hommes: 12, femmes: 8 },
      { range: '25-35', hommes: 35, femmes: 30 },
      { range: '35-45', hommes: 28, femmes: 25 },
      { range: '45-55', hommes: 15, femmes: 12 },
      { range: '>55', hommes: 8, femmes: 7 }
    ],
    seniorityGroups: [
      { range: '0-1', hommes: 15, femmes: 12 },
      { range: '1-3', hommes: 25, femmes: 20 },
      { range: '3-5', hommes: 20, femmes: 18 },
      { range: '5-10', hommes: 22, femmes: 19 },
      { range: '>10', hommes: 18, femmes: 16 }
    ]
  },
  payroll: {
    masseSalariale: 485000,
    coutMoyen: 3350,
    variationM1Pct: 1.8,
    variationN1Pct: 4.2,
    waterfallM1: null,
    waterfallN1: null
  },
  absences: {
    tauxAbsenteisme: 4.2,
    joursAbsences: 156,
    joursConges: 89
  },
  demographics: {
    ageGroups: [
      { range: '<25', hommes: 12, femmes: 8 },
      { range: '25-35', hommes: 35, femmes: 30 },
      { range: '35-45', hommes: 28, femmes: 25 },
      { range: '45-55', hommes: 15, femmes: 12 },
      { range: '>55', hommes: 8, femmes: 7 }
    ],
    seniorityGroups: [
      { range: '0-1', hommes: 15, femmes: 12 },
      { range: '1-3', hommes: 25, femmes: 20 },
      { range: '3-5', hommes: 20, femmes: 18 },
      { range: '5-10', hommes: 22, femmes: 19 },
      { range: '>10', hommes: 18, femmes: 16 }
    ]
  }
}

// Liste complète des items disponibles
const ALL_ITEMS = [
  // KPIs Effectif
  { id: 'etp_total', type: 'kpi', label: 'ETP Total', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'etp_actif', type: 'kpi', label: 'ETP Actif', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'etp_inactif', type: 'kpi', label: 'ETP Inactif', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'variation_etp_m1', type: 'kpi', label: 'Variation M-1', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'variation_etp_n1', type: 'kpi', label: 'Variation N-1', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'entrees_mois', type: 'kpi', label: 'Entrées du mois', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'sorties_mois', type: 'kpi', label: 'Sorties du mois', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'taux_turnover', type: 'kpi', label: 'Taux Turnover', category: 'Effectif', size: { rows: 1, cols: 1 } },
  { id: 'turnover_mensuel', type: 'kpi', label: 'Turnover Mensuel', category: 'Effectif', size: { rows: 1, cols: 1 } },
  
  // KPIs Financier
  { id: 'masse_salariale', type: 'kpi', label: 'Masse Salariale', category: 'Financier', size: { rows: 1, cols: 1 } },
  { id: 'cout_moyen', type: 'kpi', label: 'Coût Moyen', category: 'Financier', size: { rows: 1, cols: 1 } },
  { id: 'variation_masse_m1', type: 'kpi', label: 'Variation Masse M-1', category: 'Financier', size: { rows: 1, cols: 1 } },
  { id: 'variation_masse_n1', type: 'kpi', label: 'Variation Masse N-1', category: 'Financier', size: { rows: 1, cols: 1 } },
  
  // KPIs Absence
  { id: 'taux_absenteisme', type: 'kpi', label: 'Taux Absentéisme', category: 'Absence', size: { rows: 1, cols: 1 } },
  { id: 'jours_absences', type: 'kpi', label: 'Jours d\'Absence', category: 'Absence', size: { rows: 1, cols: 1 } },
  { id: 'jours_conges', type: 'kpi', label: 'Jours de Congés', category: 'Absence', size: { rows: 1, cols: 1 } },
  
  // Charts
  { id: 'pyramide_ages', type: 'chart', label: 'Pyramide des Âges', category: 'Démographie', size: { rows: 2, cols: 2 } },
  { id: 'pyramide_anciennetes', type: 'chart', label: 'Pyramide des Anciennetés', category: 'Démographie', size: { rows: 2, cols: 2 } },
  { id: 'waterfall_prix_volume_m1', type: 'chart', label: 'Waterfall Prix/Volume M-1', category: 'Financier', size: { rows: 2, cols: 4 } },
  { id: 'waterfall_prix_volume_n1', type: 'chart', label: 'Waterfall Prix/Volume N-1', category: 'Financier', size: { rows: 2, cols: 4 } },
]

export default function NewVisionPageWYSIWYG() {
  const router = useRouter()
  const [etablissementId, setEtablissementId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Tous les items commencent comme visibles
  const [visibleItems, setVisibleItems] = useState<string[]>(ALL_ITEMS.map(item => item.id))
  const [editMode, setEditMode] = useState(true)
  
  // Formulaire
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#06b6d4')

  useEffect(() => {
    const loadEtablissement = async () => {
      try {
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)
        const supabase = createClient()
        
        const { data: etablissements } = await supabase
          .from('etablissements')
          .select('id')
          .eq('entreprise_id', session.company_id)
          .limit(1)

        if (etablissements && etablissements.length > 0) {
          setEtablissementId(etablissements[0].id)
        }
      } catch (err) {
        console.error('Error loading etablissement:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEtablissement()
  }, [router])

  const removeItem = (itemId: string) => {
    setVisibleItems(prev => prev.filter(id => id !== itemId))
  }

  const handleSave = async () => {
    if (!etablissementId) {
      alert('Établissement non trouvé')
      return
    }

    if (!nom.trim()) {
      alert('Le nom est obligatoire')
      return
    }

    if (visibleItems.length === 0) {
      alert('Vous devez garder au moins un élément')
      return
    }

    try {
      setSaving(true)

      // Construire le layout avec repositionnement automatique
      const layout = {
        gridCols: 4,
        items: visibleItems.map((itemId, index) => {
          const itemConfig = ALL_ITEMS.find(i => i.id === itemId)!
          const cols = itemConfig.size.cols
          const rows = itemConfig.size.rows
          
          // Calcul automatique de la position
          let currentRow = 0
          let currentCol = 0
          
          // Trouver la prochaine position disponible
          for (let i = 0; i < index; i++) {
            const prevItem = ALL_ITEMS.find(it => it.id === visibleItems[i])!
            currentCol += prevItem.size.cols
            
            if (currentCol >= 4) {
              currentRow += prevItem.size.rows
              currentCol = prevItem.size.cols
            }
          }
          
          // Si l'item dépasse, passer à la ligne suivante
          if (currentCol + cols > 4) {
            currentRow += rows
            currentCol = 0
          }
          
          return {
            id: itemId,
            type: itemConfig.type,
            position: { row: currentRow, col: currentCol },
            size: { rows, cols }
          }
        })
      }

      const vision = await visionsApi.createVision({
        etablissement_id: etablissementId,
        nom: nom.trim(),
        description: description.trim() || undefined,
        color,
        layout,
        is_default: false
      })

      if (vision) {
        router.push('/visions')
      }
    } catch (err) {
      console.error('Error creating vision:', err)
      alert('Erreur lors de la création de la vision')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/visions')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Créer une Vision
                </h1>
                <p className="text-sm text-slate-400">
                  {editMode 
                    ? `${visibleItems.length} éléments visibles - Cliquez sur ✕ pour supprimer`
                    : 'Mode prévisualisation'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditMode(!editMode)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {editMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {editMode ? 'Prévisualiser' : 'Éditer'}
            </button>

            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={visibleItems.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              Enregistrer la Vision
            </button>
          </div>
        </motion.div>

        {/* Dashboard Preview avec édition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {visibleItems.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 rounded-xl border border-slate-700/50 p-12 text-center">
              <div className="text-slate-400">
                <p className="text-lg font-medium mb-2">Tous les éléments ont été supprimés</p>
                <p className="text-sm">Rechargez la page pour recommencer</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-6 auto-rows-min">
              <AnimatePresence mode="popLayout">
                {visibleItems.map((itemId) => {
                  const itemConfig = ALL_ITEMS.find(i => i.id === itemId)!
                  const colSpan = itemConfig.size.cols
                  const rowSpan = itemConfig.size.rows

                  return (
                    <motion.div
                      key={itemId}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3 }}
                      className="relative group"
                      style={{
                        gridColumn: `span ${colSpan}`,
                        gridRow: `span ${rowSpan}`
                      }}
                    >
                      {/* Bouton de suppression */}
                      {editMode && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => removeItem(itemId)}
                          className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      )}

                      {/* Label de l'item */}
                      {editMode && (
                        <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-slate-700">
                          <span className="text-xs font-medium text-slate-300">
                            {itemConfig.label}
                          </span>
                        </div>
                      )}

                      {/* Contenu de l'item */}
                      <div className={editMode ? 'pointer-events-none' : ''}>
                        <VisionItemRenderer
                          item={{
                            id: itemId,
                            type: itemConfig.type as 'kpi' | 'chart' | 'table',
                            position: { row: 0, col: 0 },
                            size: itemConfig.size
                          }}
                          data={MOCK_DASHBOARD_DATA}
                          etablissementId={etablissementId || ''}
                          periode="2024-12-01"
                          className="h-full"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Dialog d'enregistrement */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">
              Enregistrer la Vision
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Ma Vue Personnalisée"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre vision..."
                  rows={2}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Couleur
                </label>
                <div className="flex gap-2">
                  {['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nom.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}