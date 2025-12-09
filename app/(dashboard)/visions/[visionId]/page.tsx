// app/(dashboard)/visions/[visionId]/page.tsx
'use client'

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { visionsApi, type Vision } from '@/lib/api/visions'
import { ComponentRenderer } from '@/components/builder/ComponentRenderer'
import { useExport, generateFilename, type ExportFormat } from '@/lib/hooks/useExport'
import { useOptimizedKPIData } from '@/lib/hooks/useOptimizedKPIData'
import { ArrowLeft, Download, Calendar, FileImage, FileText, Settings, ChevronDown, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

export default function VisionViewerPage() {
  const router = useRouter()
  const params = useParams()
  const visionId = params.visionId as string
  const supabase = createClient()

  const canvasRef = useRef<HTMLDivElement>(null)
  const mountedRef = useRef(true)
  const { exportElement, isExporting, progress } = useExport()

  const [vision, setVision] = useState<Vision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États pour la logique
  const [etablissementId, setEtablissementId] = useState<string>('')
  const [availablePeriods, setAvailablePeriods] = useState<string[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [isInitialized, setIsInitialized] = useState(false)

  // Pour l'interface
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  // Export options
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf')
  const [exportQuality, setExportQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [showWatermark, setShowWatermark] = useState(false)

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  // Extraire les années disponibles
  const availableYears = useMemo(() => {
    const years = availablePeriods.map(p => {
      const year = new Date(p).getFullYear()
      return year
    })
    return [...new Set(years)].sort((a, b) => b - a)
  }, [availablePeriods])

  // Extraire les mois disponibles pour l'année sélectionnée
  const availableMonthsForYear = useMemo(() => {
    const monthsSet = new Set<number>()
    availablePeriods.forEach(p => {
      const date = new Date(p)
      if (date.getFullYear() === selectedYear) {
        monthsSet.add(date.getMonth())
      }
    })
    return Array.from(monthsSet).sort((a, b) => b - a)
  }, [availablePeriods, selectedYear])

  const establishmentIdMemo = useMemo(() => etablissementId || '', [etablissementId])
  const shouldFetchKPI = isInitialized && !!establishmentIdMemo && !!selectedPeriod

  // 🔥 IMPORTANT: Log pour debug
  useEffect(() => {
    console.log('📊 État KPI:', {
      isInitialized,
      etablissementId: establishmentIdMemo,
      selectedPeriod,
      shouldFetchKPI
    })
  }, [isInitialized, establishmentIdMemo, selectedPeriod, shouldFetchKPI])

  const { data: kpiData, loading: kpiLoading, error: kpiError } = useOptimizedKPIData(
    shouldFetchKPI ? establishmentIdMemo : '',
    shouldFetchKPI ? selectedPeriod : ''
  )

  // 🔥 Log les données chargées
  useEffect(() => {
    if (kpiData) {
      console.log('✅ KPI Data:', {
        etp: kpiData.workforce?.etpTotal,
        turnover: kpiData.workforce?.tauxTurnover,
        periode: selectedPeriod
      })
    }
  }, [kpiData, selectedPeriod])

  const loadPeriodsForEstablishment = useCallback(async (estId: string) => {
    if (!estId || !mountedRef.current) return
    
    try {
      console.log('🔄 Chargement périodes pour:', estId)
      
      const { data: periodData, error: snapError } = await supabase
        .from('snapshots_mensuels')
        .select('periode')
        .eq('etablissement_id', estId)
        .not('periode', 'is', null)
        .order('periode', { ascending: false })

      if (!mountedRef.current) return

      if (snapError) {
        console.error('❌ Erreur chargement périodes:', snapError)
        return
      }

      const uniquePeriods = [...new Set(periodData?.map(p => p.periode) || [])]
      
      console.log('📅 Périodes disponibles:', uniquePeriods)
      
      if (uniquePeriods.length === 0) {
        console.warn('⚠️ Aucune période trouvée')
        return
      }

      setAvailablePeriods(uniquePeriods)
      
      // Sélectionner la période la plus récente
      const latestPeriod = uniquePeriods[0]
      const latestDate = new Date(latestPeriod)
      
      setSelectedMonth(latestDate.getMonth())
      setSelectedYear(latestDate.getFullYear())
      setSelectedPeriod(latestPeriod)
      
      console.log('✅ Période initiale:', latestPeriod)
      
    } catch (err) {
      console.error('❌ Erreur:', err)
    }
  }, [supabase])

  // Initialisation
  useEffect(() => {
    mountedRef.current = true
    
    const initializeData = async () => {
      try {
        setLoading(true)
        
        const visionData = await visionsApi.getById(visionId)
        setVision(visionData)

        const sessionStr = localStorage.getItem('company_session')
        if (!sessionStr) {
          router.push('/login')
          return
        }

        const storedEtabId = localStorage.getItem('current_etablissement_id')
        
        if (storedEtabId) {
          console.log('🏢 Établissement:', storedEtabId)
          setEtablissementId(storedEtabId)
          
          await loadPeriodsForEstablishment(storedEtabId)
          
          setIsInitialized(true)
          console.log('✅ Initialisation terminée')
        }

      } catch (err) {
        console.error('❌ Erreur initialisation:', err)
        setError('Impossible de charger la vision')
      } finally {
        setLoading(false)
      }
    }

    initializeData()

    return () => {
      mountedRef.current = false
    }
  }, [visionId, router, loadPeriodsForEstablishment])

  // 🔥 LOGIQUE CRITIQUE: Mettre à jour selectedPeriod quand mois/année changent
  useEffect(() => {
    if (!isInitialized || availablePeriods.length === 0) {
      return
    }

    // Chercher une période qui correspond
    const matchingPeriod = availablePeriods.find(p => {
      const pDate = new Date(p)
      return pDate.getFullYear() === selectedYear && pDate.getMonth() === selectedMonth
    })
    
    if (matchingPeriod && matchingPeriod !== selectedPeriod) {
      console.log('🔄 CHANGEMENT DE PÉRIODE:', {
        de: selectedPeriod,
        vers: matchingPeriod,
        mois: months[selectedMonth],
        année: selectedYear
      })
      setSelectedPeriod(matchingPeriod)
    }
  }, [selectedMonth, selectedYear, availablePeriods, isInitialized, selectedPeriod, months])

  const handleExport = async () => {
    if (!canvasRef.current || !vision) return

    const filename = generateFilename(vision.nom, exportFormat, selectedPeriod)

    const result = await exportElement(canvasRef.current, {
      format: exportFormat,
      quality: exportQuality,
      filename,
      watermark: showWatermark
    })

    if (result.success) {
      await visionsApi.incrementExportCount(visionId)
      
      setVision(prev => prev ? {
        ...prev,
        export_count: (prev.export_count || 0) + 1,
        last_exported_at: new Date().toISOString()
      } : null)
    } else {
      alert(`Erreur d'export: ${result.error}`)
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

  if (error || !vision) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-semibold mb-2">Erreur</p>
          <p className="text-slate-400 mb-6">{error || 'Vision introuvable'}</p>
          <button
            onClick={() => router.push('/visions')}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-white font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    )
  }

  const template = vision.template
  if (!template || !template.components || template.components.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Vision vide</h2>
          <p className="text-slate-400 mb-8">
            Cette vision ne contient aucun composant. Utilisez le builder pour la concevoir.
          </p>
          <button
            onClick={() => router.push(`/visions/builder?visionId=${visionId}`)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold inline-flex items-center gap-2"
          >
            Ouvrir le builder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - SANS doublon */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/visions')}
              className="p-2 hover:bg-cyan-500/20 rounded-lg text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div>
              <h1 className="text-3xl font-bold text-cyan-400">{vision.nom}</h1>
              {vision.description && (
                <p className="text-slate-400 text-sm mt-1">{vision.description}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push(`/visions/${visionId}/edit`)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-lg text-purple-400 font-medium text-sm flex items-center gap-2 transition-all"
          >
            <Settings size={18} />
            Modifier
          </button>
        </div>

        {/* Export controls - UNE SEULE section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl"
        >
          <h2 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
            <Download size={20} />
            Paramètres d'export
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Période avec mois/année filtrés */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Période
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value)
                      console.log('🔄 Changement mois:', months[newMonth])
                      setSelectedMonth(newMonth)
                    }}
                    className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                  >
                    {availableMonthsForYear.map((monthIndex) => (
                      <option key={monthIndex} value={monthIndex} className="bg-slate-900">
                        {months[monthIndex]}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
                </div>
                
                <div className="relative w-24">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value)
                      console.log('🔄 Changement année:', newYear)
                      setSelectedYear(newYear)
                    }}
                    className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year} className="bg-slate-900">
                        {year}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    exportFormat === 'pdf'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
                  }`}
                >
                  <FileText size={16} className="inline mr-1" />
                  PDF
                </button>
                <button
                  onClick={() => setExportFormat('png')}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    exportFormat === 'png'
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                      : 'bg-slate-950/50 border-cyan-500/20 text-slate-400 hover:text-cyan-400'
                  }`}
                >
                  <FileImage size={16} className="inline mr-1" />
                  PNG
                </button>
              </div>
            </div>

            {/* Qualité */}
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Qualité
              </label>
              <div className="relative">
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950/50 border border-cyan-500/20 rounded-lg text-cyan-400 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                >
                  <option value="low" className="bg-slate-900">Basse</option>
                  <option value="medium" className="bg-slate-900">Moyenne</option>
                  <option value="high" className="bg-slate-900">Haute</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
              </div>
            </div>

            {/* Export button */}
            <div className="flex items-end">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 rounded-lg text-white font-semibold flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {progress}%
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    Exporter
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="watermark"
              checked={showWatermark}
              onChange={(e) => setShowWatermark(e.target.checked)}
              className="w-4 h-4 rounded border-cyan-500/20 bg-slate-950/50 text-cyan-500 focus:ring-cyan-500/50 cursor-pointer"
            />
            <label htmlFor="watermark" className="text-sm text-slate-400 cursor-pointer">
              Ajouter un watermark "Talvio Analytics"
            </label>
          </div>
        </motion.div>

        {/* Loading indicator */}
        {kpiLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center gap-3"
          >
            <RefreshCw className="w-5 h-5 text-cyan-400 animate-spin" />
            <p className="text-cyan-400 text-sm">
              Chargement des données pour {months[selectedMonth]} {selectedYear}...
            </p>
          </motion.div>
        )}

        {/* Canvas preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-3xl blur-2xl"></div>
          
          <div className="relative bg-slate-900/50 backdrop-blur-sm border border-cyan-500/20 rounded-3xl p-8">
            <div 
              ref={canvasRef}
              className="relative mx-auto"
              style={{
                width: template.canvas.width * 0.5,
                height: template.canvas.height * 0.5,
                backgroundColor: template.canvas.backgroundColor,
                transform: 'scale(1)',
                transformOrigin: 'center'
              }}
            >
              {template.components.map((component) => (
                <div
                  key={component.id}
                  className="absolute"
                  style={{
                    left: component.position.x * 0.5,
                    top: component.position.y * 0.5,
                    width: component.size.width * 0.5,
                    height: component.size.height * 0.5
                  }}
                >
                  <ComponentRenderer 
                    component={component} 
                    isPreview 
                    kpiData={kpiData}
                    period={selectedPeriod}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mt-6 flex justify-center gap-6 text-sm text-slate-400">
          <div>
            Composants: <span className="text-cyan-400 font-semibold">{template.components.length}</span>
          </div>
          <div>
            Format: <span className="text-cyan-400 font-semibold">{template.canvas.format}</span>
          </div>
          <div>
            Exporté: <span className="text-cyan-400 font-semibold">{vision.export_count || 0} fois</span>
          </div>
          <div>
            Période: <span className="text-cyan-400 font-semibold">{months[selectedMonth]} {selectedYear}</span>
          </div>
        </div>
      </div>
    </div>
  )
}