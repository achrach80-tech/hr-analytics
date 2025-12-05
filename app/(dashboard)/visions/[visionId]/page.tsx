// app/(dashboard)/visions/[visionId]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileDown, ArrowLeft, Star, Edit2, Trash2, Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ExportModal from '@/components/visions/ExportModal'
import { visionsApi } from '@/lib/api/visions'
import type { SavedVision } from '@/lib/types/visions'
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { CyberWorkforceSection } from '@/components/dashboard/CyberWorkforceSection'
import { CyberPayrollSection } from '@/components/dashboard/CyberPayrollSection'
import { CyberAbsenceSection } from '@/components/dashboard/CyberAbsenceSection'
import { CyberDemographicsSection } from '@/components/dashboard/CyberDemographicsSection'

const SECTION_TITLES = {
  workforce: 'Effectif & Mouvements',
  payroll: 'Masse Salariale & Analyse',
  absences: 'Absences',
  demographics: 'Démographie'
}

export default function VisionPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const visionId = params.visionId as string

  const [vision, setVision] = useState<SavedVision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  
  const [etablissementId, setEtablissementId] = useState<string>('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [isReady, setIsReady] = useState(false)

  const shouldFetch = isReady && !!etablissementId && !!selectedPeriod
  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    shouldFetch ? etablissementId : '',
    shouldFetch ? selectedPeriod : ''
  )

  useEffect(() => {
    async function loadUserEstablishment() {
      try {
        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const session = JSON.parse(sessionStr)

        const { data: companyData, error: companyError } = await supabase
          .from('entreprises')
          .select(`
            id,
            etablissements (
              id,
              nom,
              is_headquarters
            )
          `)
          .eq('id', session.company_id)
          .single()

        if (companyError) throw companyError

        const establishments = (companyData.etablissements || []) as any[]
        if (establishments.length === 0) {
          setError('Aucun établissement configuré')
          return
        }

        const defaultEst = establishments.find(e => e.is_headquarters) || establishments[0]
        setEtablissementId(defaultEst.id)

        const { data: periodData } = await supabase
          .from('snapshots_mensuels')
          .select('periode')
          .eq('etablissement_id', defaultEst.id)
          .not('periode', 'is', null)
          .order('periode', { ascending: false })

        const periods = [...new Set((periodData || []).map(p => p.periode))]
        setAvailablePeriods(periods)
        
        if (periods.length > 0) {
          setSelectedPeriod(periods[0])
          setIsReady(true)
        } else {
          setError('Aucune donnée disponible')
        }
      } catch (err) {
        console.error('Erreur:', err)
        setError('Erreur de chargement')
      }
    }

    loadUserEstablishment()
  }, [supabase, router])

  useEffect(() => {
    async function loadVision() {
      try {
        setLoading(true)
        const visionData = await visionsApi.getVision(visionId)
        if (!visionData) throw new Error('Vision introuvable')
        setVision(visionData)
        try {
          await visionsApi.incrementViewCount(visionId)
        } catch (e) {
          console.warn('View count failed:', e)
        }
      } catch (err: any) {
        console.error('Error:', err)
        setError(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }
    loadVision()
  }, [visionId])

  const formatPeriod = (period: string): string => {
    try {
      const [year, month] = period.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1)
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
    } catch {
      return period
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cette vision ?')) return
    try {
      await visionsApi.deleteVision(visionId)
      router.push('/visions')
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la suppression')
    }
  }

  const handleToggleDefault = async () => {
    if (!vision) return
    try {
      const updated = await visionsApi.updateVision(visionId, {
        is_default: !vision.isDefault
      } as any)
      if (updated) setVision(updated)
    } catch (error) {
      console.error('Toggle failed:', error)
    }
  }

  const renderSection = (sectionId: string) => {
    const title = SECTION_TITLES[sectionId as keyof typeof SECTION_TITLES]
    
    return (
      <div key={sectionId} className="export-section">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <span className="text-cyan-400">•</span>
          {title}
        </h2>
        
        {sectionId === 'workforce' && (
          <CyberWorkforceSection 
            data={kpiData?.workforce || null} 
            loading={false}
            previousMonthData={kpiData?.previousMonthWorkforce}
            previousYearData={kpiData?.previousYearWorkforce}
          />
        )}
        {sectionId === 'payroll' && (
          <CyberPayrollSection 
            establishmentId={etablissementId}
            period={selectedPeriod}
            data={kpiData?.financials || null}
            previousMonthData={kpiData?.previousMonthFinancials || null}
            previousYearData={kpiData?.previousYearFinancials || null}
            loading={false} 
          />
        )}
        {sectionId === 'absences' && (
          <CyberAbsenceSection 
            data={kpiData?.absences || null} 
            loading={false}
            previousMonthData={kpiData?.previousMonthAbsences}
            previousYearData={kpiData?.previousYearAbsences}
          />
        )}
        {sectionId === 'demographics' && (
          <CyberDemographicsSection 
            data={kpiData?.workforce || null} 
            loading={false}
            previousMonthData={kpiData?.previousMonthWorkforce}
            previousYearData={kpiData?.previousYearWorkforce}
          />
        )}
      </div>
    )
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!vision) return null

  const sections = (vision?.layout?.sections || []) as string[]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/visions')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{vision.nom}</h1>
                  {vision.isDefault && (
                    <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">
                      Par défaut
                    </span>
                  )}
                </div>
                {vision.description && (
                  <p className="text-sm text-slate-400 mt-1">{vision.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isReady && selectedPeriod && availablePeriods.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="bg-transparent text-sm text-white border-none outline-none cursor-pointer"
                  >
                    {availablePeriods.map((period) => (
                      <option key={period} value={period} className="bg-slate-800">
                        {formatPeriod(period)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleToggleDefault}
                className={`p-2 rounded-lg transition-colors ${
                  vision.isDefault ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <Star className="w-5 h-5" fill={vision.isDefault ? 'currentColor' : 'none'} />
              </button>

              <button
                onClick={() => router.push(`/visions/${visionId}/edit`)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
              >
                <Edit2 className="w-5 h-5" />
              </button>

              <button
                onClick={handleDelete}
                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600"
              >
                <FileDown className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div id="vision-content" className="p-8">
        {!isReady || kpiLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw size={48} className="text-cyan-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Chargement des données...</p>
            </div>
          </div>
        ) : kpiError ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-300">{kpiError}</p>
            </div>
          </div>
        ) : kpiData && sections.length > 0 ? (
          <div className="space-y-16">
            {sections.map(sectionId => renderSection(sectionId))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-400">Aucune donnée disponible</p>
          </div>
        )}
      </div>

      {/* CSS pour export */}
      <style jsx global>{`
        .export-section {
          page-break-inside: avoid;
          break-inside: avoid;
          margin-bottom: 4rem;
        }
      `}</style>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        visionName={vision.nom}
        visionId={visionId}
      />
    </div>
  )
}